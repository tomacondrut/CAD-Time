/**
 * Project: Miro-like CAD / Drafting Hierarchy Tracker
 * Domain: Vanilla Canvas, Supabase Integration & Hierarchical Rollup
 * Timestamp: 2026-08-22 09:20:00 UTC
 */

const SUPABASE_URL = 'https://oazqaykiffiznfgrmihi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9XeDSb2HEkzK8yDL1ralIQ_HERPIq3C';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let jsPlumbInstance = null;
let currentNodes = [];
let currentEdges = [];
let currentTimeLogs = [];

// Initialize Canvas & jsPlumb
window.addEventListener('DOMContentLoaded', () => {
  jsPlumbInstance = jsPlumb.getInstance({
    Connector: ['Bezier', { curviness: 50 }],
    PaintStyle: { stroke: '#4a5568', strokeWidth: 2.5 },
    Endpoint: ['Dot', { radius: 5 }],
    EndpointStyle: { fill: '#2b6cb0' },
    Container: 'canvas'
  });

  // Track manual connection creation
  jsPlumbInstance.bind('connection', async (info) => {
    const sourceId = info.sourceId;
    const targetId = info.targetId;
    const exists = currentEdges.some(e => e.source === sourceId && e.target === targetId);
    if (!exists) {
      await db.from('project_edges').insert([{ source: sourceId, target: targetId }]);
    }
  });

  document.getElementById('btnAddBlock').addEventListener('click', handleAddBlock);

  // Fetch initial data & subscribe to live changes
  fetchCanvasData();

  db.channel('realtime-all')
    .on('postgres_changes', { event: '*', schema: 'public' }, () => {
      fetchCanvasData();
    })
    .subscribe();
});

// Fetch all elements from Supabase
async function fetchCanvasData() {
  const { data: nodes } = await db.from('project_nodes').select('*');
  const { data: edges } = await db.from('project_edges').select('*');
  const { data: logs } = await db.from('time_logs').select('*');

  currentNodes = nodes || [];
  currentEdges = edges || [];
  currentTimeLogs = logs || [];

  renderCanvas();
}

// Tree Rollup Calculation Engine
function calculateRollups() {
  const childrenMap = {};
  currentEdges.forEach(e => {
    if (!childrenMap[e.source]) childrenMap[e.source] = [];
    childrenMap[e.source].push(e.target);
  });

  const directMap = {};
  currentTimeLogs.forEach(l => {
    if (!directMap[l.node_id]) directMap[l.node_id] = { design: 0, drafting: 0 };
    const hrs = parseFloat(l.hours) || 0;
    if (l.task_type === 'design') directMap[l.node_id].design += hrs;
    if (l.task_type === 'drafting') directMap[l.node_id].drafting += hrs;
  });

  const memo = {};
  function aggregate(nodeId, visited = new Set()) {
    if (visited.has(nodeId)) return { totalDesign: 0, totalDrafting: 0 };
    visited.add(nodeId);

    const direct = directMap[nodeId] || { design: 0, drafting: 0 };
    let totalDesign = direct.design;
    let totalDrafting = direct.drafting;

    const children = childrenMap[nodeId] || [];
    children.forEach(childId => {
      const totals = aggregate(childId, new Set(visited));
      totalDesign += totals.totalDesign;
      totalDrafting += totals.totalDrafting;
    });

    memo[nodeId] = { totalDesign, totalDrafting };
    return { totalDesign, totalDrafting };
  }

  currentNodes.forEach(n => aggregate(n.id));
  return memo;
}

// Render nodes and connect lines on canvas
function renderCanvas() {
  const canvas = document.getElementById('canvas');
  jsPlumbInstance.reset();
  canvas.innerHTML = '';

  const rollups = calculateRollups();

  currentNodes.forEach(node => {
    const stats = rollups[node.id] || { totalDesign: 0, totalDrafting: 0 };

    const el = document.createElement('div');
    el.id = node.id;
    el.className = 'assembly-card';
    el.style.left = `${node.pos_x}px`;
    el.style.top = `${node.pos_y}px`;

    el.innerHTML = `
      <div class="assembly-header">${escapeHtml(node.name)}</div>
      <div class="assembly-body">
        <div class="stat-row">
          <span class="stat-label">CAD Design:</span>
          <span class="stat-val">${stats.totalDesign}h / ${node.budget_design_hours}h</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Drafting:</span>
          <span class="stat-val">${stats.totalDrafting}h / ${node.budget_drafting_hours}h</span>
        </div>
        <hr class="divider" />
        <form class="log-form" onsubmit="handleLog(event, '${node.id}')">
          <input type="text" class="log-input" style="width: 42px; text-transform: uppercase;" placeholder="ABC" maxlength="3" required />
          <select class="log-input">
            <option value="drafting">Draft</option>
            <option value="design">CAD</option>
          </select>
          <input type="number" class="log-input" style="width: 48px;" step="0.25" placeholder="Hrs" required />
          <button type="submit" class="btn-log">+ Log</button>
        </form>
      </div>
    `;

    canvas.appendChild(el);

    // Make node draggable & save position
    jsPlumbInstance.draggable(el, {
      stop: async (params) => {
        const [x, y] = params.pos;
        await db.from('project_nodes').update({ pos_x: x, pos_y: y }).eq('id', node.id);
      }
    });

    // Add connectable Top (Target) and Bottom (Source) handles
    jsPlumbInstance.addEndpoint(el, { anchor: 'Top', isTarget: true, maxConnections: -1 });
    jsPlumbInstance.addEndpoint(el, { anchor: 'Bottom', isSource: true, maxConnections: -1 });
  });

  // Render edges
  currentEdges.forEach(edge => {
    if (document.getElementById(edge.source) && document.getElementById(edge.target)) {
      jsPlumbInstance.connect({
        source: edge.source,
        target: edge.target,
        anchors: ['Bottom', 'Top']
      });
    }
  });
}

// Add New Assembly Block
async function handleAddBlock() {
  const name = prompt('Assembly / Work Package Name:', 'Conveyor Belt Drive');
  if (!name) return;
  const designBudget = parseFloat(prompt('CAD Design Budget (hours):', '10') || '0');
  const draftingBudget = parseFloat(prompt('Technical Drawing Budget (hours):', '5') || '0');

  await db.from('project_nodes').insert([{
    name,
    budget_design_hours: designBudget,
    budget_drafting_hours: draftingBudget,
    pos_x: Math.random() * 300 + 100,
    pos_y: Math.random() * 200 + 100
  }]);
}

// Handle time entry submission
async function handleLog(e, nodeId) {
  e.preventDefault();
  const form = e.target;
  const userCode = form.elements[0].value.trim().toUpperCase();
  const taskType = form.elements[1].value;
  const hours = parseFloat(form.elements[2].value);

  if (userCode.length !== 3 || isNaN(hours) || hours <= 0) {
    alert('Please enter a valid 3-letter user code and positive hours.');
    return;
  }

  await db.from('time_logs').insert([{
    node_id: nodeId,
    user_code: userCode,
    task_type: taskType,
    hours: hours
  }]);

  form.elements[2].value = '';
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}