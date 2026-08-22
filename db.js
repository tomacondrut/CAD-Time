/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Datenbank, Realtime-Sync, State & Hierarchie-Rollup Engine
 * Zeitstempel: 2026-08-22 16:15:00 CEST
 * =============================================================================
 */

const SUPABASE_URL = 'https://oazqaykiffiznfgrmihi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9XeDSb2HEkzK8yDL1ralIQ_HERPIq3C';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_PASS = '787456c';
let isAdmin = false;
let activeUserCode = '';
let activeProjectId = 'proj_default';

// Konstanten, die zuvor verloren gingen
const COLOR_PRESETS = [
    { name: 'Stahlblau', hex: '#2b6cb0' },
    { name: 'Salbeigrün', hex: '#38a169' },
    { name: 'Schiefergrau', hex: '#4a5568' },
    { name: 'Kupfer', hex: '#c05621' },
    { name: 'Dunkel-Petrol', hex: '#319795' },
    { name: 'Gedämpftes Indigo', hex: '#553c9a' }
];

let currentProjects = [];
let currentNodes = [];
let currentEdges = [];
let currentZones = [];
let currentTimeLogs = [];
let currentUsers = [];
let currentAuditLogs = [];
let showAllAuditLogs = false;

let selectedNodeIds = new Set();
let expandedNodes = new Set();
let collapsedParents = new Set();
let dialogResolve = null;

// --- Datenabruf & Realtime ---
async function fetchUsers() {
    const { data } = await db.from('app_users').select('*').order('code', { ascending: true });
    currentUsers = data || [];
    if (window.renderUserDropdowns) window.renderUserDropdowns();
    if (isAdmin && window.renderAdminUserList) window.renderAdminUserList();
}

async function fetchProjects() {
    const { data } = await db.from('projects').select('*').order('object_number', { ascending: true });
    currentProjects = data || [];
    if (window.renderProjectDropdowns) window.renderProjectDropdowns();
    if (window.updateSidebarStats) window.updateSidebarStats();
    if (isAdmin && window.renderAdminProjectList) window.renderAdminProjectList();
    if (window.renderArchivedProjectsList) window.renderArchivedProjectsList();
}

// --- Datenabruf & Realtime mit Anti-Freeze ---
window.isDraggingAnything = false;
window.pendingCanvasUpdate = false;

async function fetchCanvasData() {
    const { data: nodes } = await db.from('project_nodes').select('*').eq('project_id', activeProjectId);
    const { data: edges } = await db.from('project_edges').select('*').eq('project_id', activeProjectId);
    const { data: zones } = await db.from('project_zones').select('*').eq('project_id', activeProjectId);
    const { data: logs } = await db.from('time_logs').select('*').eq('project_id', activeProjectId).order('logged_at', { ascending: false });

    // BUGFIX: Rendering pausieren, wenn User gerade etwas verschiebt!
    if (window.isDraggingAnything) {
        window.pendingCanvasUpdate = true;
        return;
    }

    currentNodes = nodes || [];
    currentEdges = edges || [];
    currentZones = zones || [];
    currentTimeLogs = logs || [];

    if (window.renderCanvas) window.renderCanvas();
    if (window.updateSidebarStats) window.updateSidebarStats();
    if (isAdmin && window.renderPendingLogsTable) window.renderPendingLogsTable();
}

async function fetchAuditLogs() {
    const { data } = await db.from('budget_audit_logs').select('*').order('changed_at', { ascending: false }).limit(50);
    currentAuditLogs = data || [];
    if (isAdmin && window.renderBudgetAuditLogs) window.renderBudgetAuditLogs();
}

// --- Hierarchische Rollup-Engine ---
function calculateRollups() {
    const childrenMap = {};
    currentEdges.forEach(e => {
        if (!childrenMap[e.source]) childrenMap[e.source] = [];
        childrenMap[e.source].push(e.target);
    });

    const directMap = {};
    currentTimeLogs.forEach(l => {
        if (!directMap[l.node_id]) directMap[l.node_id] = { design: 0, drafting: 0, logs: [] };
        const hrs = Math.max(0, parseFloat(l.hours) || 0);
        if (l.task_type === 'design') directMap[l.node_id].design += hrs;
        if (l.task_type === 'drafting') directMap[l.node_id].drafting += hrs;
        directMap[l.node_id].logs.push(l);
    });

    const memo = {};
    function aggregate(nodeId, visited = new Set()) {
        if (visited.has(nodeId)) return { totalDesign: 0, totalDrafting: 0 };
        visited.add(nodeId);

        const direct = directMap[nodeId] || { design: 0, drafting: 0, logs: [] };
        let totalDesign = direct.design;
        let totalDrafting = direct.drafting;

        const children = childrenMap[nodeId] || [];
        children.forEach(childId => {
            const totals = aggregate(childId, new Set(visited));
            totalDesign += totals.totalDesign;
            totalDrafting += totals.totalDrafting;
        });

        memo[nodeId] = { totalDesign, totalDrafting, logs: direct.logs };
        return { totalDesign, totalDrafting };
    }

    currentNodes.forEach(n => aggregate(n.id));
    return memo;
}

function getCurrentProject() {
    return currentProjects.find(p => p.id === activeProjectId) || {
        object_number: 'OBJ-2026-01',
        name: 'Standard',
        total_budget_design: 100,
        total_budget_drafting: 60
    };
}