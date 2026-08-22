/**
 * =============================================================================
 * Projekt: CAD & Zeichnungs-Hierarchie Tracker
 * Domain: Canvas Engine, Kontinuierliche Live-Spline-Vorschau, ESC-Cancel,
 *         Automatische Y-Positions-Hierarchie & Native SVG Bezier Layer
 * Zeitstempel: 2026-08-22 10:35:00 UTC
 * 
 * Breadcrumbs:
 * - 2026-08-22 09:20: Initialer Vanilla JS Build.
 * - 2026-08-22 09:55: Panzoom, Sidebar, User-Auswahl, Admin-Lock & Freigaben.
 * - 2026-08-22 10:15: Stunden/Minuten, Mousewheel 5m, Kommentare & Hover.
 * - 2026-08-22 10:20: Projekt-Budgets & Admin-Log-Löschung.
 * - 2026-08-22 10:30: Farb-Presets & Dialog z-index Fix.
 * - 2026-08-22 10:35: [UPDATE] Kontinuierliche Live-Spline-Vorschau beim Ziehen,
 *                     ESC-Abbruch, automatische Hierarchie aus relativer Y-Position.
 * =============================================================================
 */

const SUPABASE_URL = 'https://oazqaykiffiznfgrmihi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9XeDSb2HEkzK8yDL1ralIQ_HERPIq3C';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_PASS = '787456c';
let isAdmin = false;
let activeUserCode = '';

const COLOR_PRESETS = [
    { name: 'Stahlblau', hex: '#2b6cb0' },
    { name: 'Salbeigrün', hex: '#38a169' },
    { name: 'Schiefergrau', hex: '#4a5568' },
    { name: 'Kupfer', hex: '#c05621' },
    { name: 'Dunkel-Petrol', hex: '#319795' },
    { name: 'Gedämpftes Indigo', hex: '#553c9a' }
];

let panzoomInstance = null;
let currentNodes = [];
let currentEdges = [];
let currentTimeLogs = [];
let currentUsers = [];
let currentProjectSettings = {
    object_number: 'OBJ-2026-01',
    total_budget_design: 100.0,
    total_budget_drafting: 60.0
};

let expandedNodes = new Set();

// Verbindungs-Zustand
let connectingFirstNodeId = null;
let connectingFirstPoint = null; // { x, y }
let dialogResolve = null;

// Initialisierung
window.addEventListener('DOMContentLoaded', () => {
    const canvasEl = document.getElementById('canvas');

    panzoomInstance = Panzoom(canvasEl, {
        maxScale: 2.0,
        minScale: 0.3,
        contain: 'outside',
        canvas: true,
        excludeClass: 'assembly-card'
    });

    const viewport = document.getElementById('viewport');
    viewport.addEventListener('wheel', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        panzoomInstance.zoomWithWheel(e);
    });

    // Kontinuierliche Spline-Zeichnung: Folgt dem Mauszeiger
    viewport.addEventListener('mousemove', handleLiveSplineMove);

    // ESC-Taste bricht Verbindungsmodus ab
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && connectingFirstNodeId) {
            cancelConnectionMode();
            showToast('Verbindungsvorgang abgebrochen', 'info');
        }
    });

    document.getElementById('btnZoomIn').addEventListener('click', () => panzoomInstance.zoomIn());
    document.getElementById('btnZoomOut').addEventListener('click', () => panzoomInstance.zoomOut());
    document.getElementById('btnZoomReset').addEventListener('click', () => panzoomInstance.reset());

    document.getElementById('btnOpenAddBlockModal').addEventListener('click', handleOpenAddBlockModal);
    document.getElementById('newBlockForm').addEventListener('submit', handleAddBlock);
    document.getElementById('configForm').addEventListener('submit', handleSaveConfig);
    document.getElementById('btnDeleteBlock').addEventListener('click', handleDeleteNode);
    document.getElementById('projectSettingsForm').addEventListener('submit', handleSaveProjectSettings);

    renderColorPresets();
    fetchUsers();
    fetchProjectSettings();
    fetchCanvasData();

    db.channel('realtime-all')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
            fetchCanvasData();
            fetchUsers();
            fetchProjectSettings();
        })
        .subscribe();
});

// Toast Benachrichtigungen
function showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = '';
    if (type === 'error') toast.classList.add('toast-error');
    if (type === 'success') toast.classList.add('toast-success');
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// In-App Dialog Manager
function customPrompt(title, message, defaultValue = '', isPassword = false) {
    return new Promise((resolve) => {
        dialogResolve = resolve;
        document.getElementById('dialogTitle').textContent = title;
        document.getElementById('dialogMessage').textContent = message;
        const inputCont = document.getElementById('dialogInputContainer');
        const input = document.getElementById('dialogInput');
        inputCont.style.display = 'block';
        input.type = isPassword ? 'password' : 'text';
        input.value = defaultValue;
        openModal('dialogModal');
        input.focus();
    });
}

function customConfirm(title, message) {
    return new Promise((resolve) => {
        dialogResolve = resolve;
        document.getElementById('dialogTitle').textContent = title;
        document.getElementById('dialogMessage').textContent = message;
        document.getElementById('dialogInputContainer').style.display = 'none';
        openModal('dialogModal');
    });
}

window.closeDialog = function (isConfirmed) {
    closeModal('dialogModal');
    if (dialogResolve) {
        const input = document.getElementById('dialogInput');
        if (document.getElementById('dialogInputContainer').style.display !== 'none') {
            dialogResolve(isConfirmed ? input.value : null);
        } else {
            dialogResolve(isConfirmed);
        }
        dialogResolve = null;
    }
};

// Benutzer-Verwaltung
async function fetchUsers() {
    const { data } = await db.from('app_users').select('*').order('code', { ascending: true });
    currentUsers = data || [];
    renderUserDropdown();
    if (isAdmin) renderAdminUserList();
}

function renderUserDropdown() {
    const select = document.getElementById('userSelectDropdown');
    select.innerHTML = '';
    currentUsers.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.code;
        opt.textContent = u.code;
        select.appendChild(opt);
    });
}

window.confirmUserLogin = function () {
    const select = document.getElementById('userSelectDropdown');
    if (!select.value) return;
    activeUserCode = select.value;
    document.getElementById('sidebarUserCode').textContent = activeUserCode;
    closeModal('userLoginOverlay');
    showToast(`Angemeldet als ${activeUserCode}`, 'success');
    renderCanvas();
};

async function fetchProjectSettings() {
    const { data } = await db.from('project_settings').select('*').eq('id', 'global_project').single();
    if (data) {
        currentProjectSettings = data;
        updateSidebarStats();
    }
}

async function fetchCanvasData() {
    const { data: nodes } = await db.from('project_nodes').select('*');
    const { data: edges } = await db.from('project_edges').select('*');
    const { data: logs } = await db.from('time_logs').select('*').order('logged_at', { ascending: false });

    currentNodes = nodes || [];
    currentEdges = edges || [];
    currentTimeLogs = logs || [];

    renderCanvas();
    updateSidebarStats();
    if (isAdmin) renderPendingLogsTable();
}

/**
 * =============================================================================
 * Projekt: CAD & Zeichnungs-Hierarchie Tracker
 * Domain: Multi-Selection (Shift + Drag) & Unterbäume Ein-/Ausblenden (Subtree Toggle)
 * Zeitstempel: 2026-08-22 10:45:00 UTC
 * 
 * Breadcrumbs:
 * - 2026-08-22 10:40: Gekoppelte Mousewheel Zeit-Eingabe.
 * - 2026-08-22 10:45: [UPDATE] Multi-Selection via Shift-Taste für Admins,
 *                     Gruppen-Dragging, rekursives Ein-/Ausblenden von Subtrees.
 * =============================================================================
 */

let selectedNodeIds = new Set();
let collapsedParents = new Set(); // Speichert Eltern-IDs, deren Kinder ausgeblendet sind

// Ermittelt alle untergeordneten Knoten-IDs rekursiv
function getDescendantNodeIds(parentId) {
    const descendants = new Set();
    const queue = [parentId];

    while (queue.length > 0) {
        const current = queue.shift();
        currentEdges.forEach(e => {
            if (e.source === current && !descendants.has(e.target)) {
                descendants.add(e.target);
                queue.push(e.target);
            }
        });
    }

    return descendants;
}

// Prüft, ob ein Knoten durch einen eingeklappten Vorfahren ausgeblendet werden soll
function isNodeHiddenByAncestor(nodeId) {
    for (const collapsedParentId of collapsedParents) {
        const descendants = getDescendantNodeIds(collapsedParentId);
        if (descendants.has(nodeId)) return true;
    }
    return false;
}

window.toggleSubtreeCollapse = function (e, nodeId) {
    e.stopPropagation();
    if (collapsedParents.has(nodeId)) {
        collapsedParents.delete(nodeId);
    } else {
        collapsedParents.add(nodeId);
    }
    renderCanvas();
};

// Hierarchische Rollup-Engine: Berechnet rekursiv Zeiten von Unterbaugruppen
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

function formatHoursToHM(decimalHours) {
    const totalMinutes = Math.round((Math.max(0, decimalHours) || 0) * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function generatePieStyle(spent, budget, baseColor) {
    const b = Math.max(0.1, parseFloat(budget) || 1);
    const pct = Math.min((spent / b) * 100, 100);
    const isOver = spent > b;
    const fillCol = isOver ? '#e53e3e' : baseColor;
    return `background: conic-gradient(${fillCol} 0% ${pct}%, #e2e8f0 ${pct}% 100%);`;
}

function updateSidebarStats() {
    let totalD = 0;
    let totalDr = 0;
    let pendingCount = 0;

    currentTimeLogs.forEach(l => {
        const hrs = Math.max(0, parseFloat(l.hours) || 0);
        if (l.task_type === 'design') totalD += hrs;
        if (l.task_type === 'drafting') totalDr += hrs;
        if (l.status === 'pending') pendingCount++;
    });

    document.getElementById('sbObjectNumber').textContent = currentProjectSettings.object_number || 'OBJ-2026-01';
    document.getElementById('sbPendingLogs').textContent = pendingCount + ' Einträge';

    const budD = parseFloat(currentProjectSettings.total_budget_design) || 1;
    const budDr = parseFloat(currentProjectSettings.total_budget_drafting) || 1;

    const pctD = Math.round((totalD / budD) * 100);
    const pctDr = Math.round((totalDr / budDr) * 100);

    const pieDesignEl = document.getElementById('sbPieDesign');
    const pieDraftingEl = document.getElementById('sbPieDrafting');

    const fillD = totalD > budD ? '#e53e3e' : '#3182ce';
    const fillDr = totalDr > budDr ? '#e53e3e' : '#38a169';

    pieDesignEl.style.background = `conic-gradient(${fillD} 0% ${Math.min(pctD, 100)}%, #4a5568 ${Math.min(pctD, 100)}% 100%)`;
    pieDraftingEl.style.background = `conic-gradient(${fillDr} 0% ${Math.min(pctDr, 100)}%, #4a5568 ${Math.min(pctDr, 100)}% 100%)`;

    document.getElementById('sbPctDesign').textContent = `${pctD}%`;
    document.getElementById('sbPctDrafting').textContent = `${pctDr}%`;

    document.getElementById('sbValDesign').textContent = `${formatHoursToHM(totalD)} / ${formatHoursToHM(budD)}`;
    document.getElementById('sbValDrafting').textContent = `${formatHoursToHM(totalDr)} / ${formatHoursToHM(budDr)}`;

    document.getElementById('btnEditProjectSettings').style.display = isAdmin ? 'inline' : 'none';
}

window.toggleInlineLogs = function (nodeId) {
    if (expandedNodes.has(nodeId)) {
        expandedNodes.delete(nodeId);
    } else {
        expandedNodes.add(nodeId);
    }
    renderCanvas();
};

/**
 * =============================================================================
 * Projekt: CAD & Zeichnungs-Hierarchie Tracker
 * Domain: Mousewheel Zeit-Eingabe mit Überlauf- und Unterlauf-Kopplung
 * Zeitstempel: 2026-08-22 10:40:00 UTC
 * 
 * Breadcrumbs:
 * - 2026-08-22 10:15: Isolierte 5m-Schritte pro Feld.
 * - 2026-08-22 10:40: [UPDATE] Gekoppelte Stunden-/Minuten-Wheel-Logik:
 *                     Überlauf (>55m -> +1h, 00m) & Unterlauf (<00m -> -1h, 55m).
 *                     Verhindert strikt negative Werte (< 0h 00m).
 * =============================================================================
 */
window.handleTimeWheel = function (e, type) {
    e.preventDefault();
    e.stopPropagation();

    const container = e.target.closest('.time-inputs-row');
    if (!container) return;

    const hourInput = container.querySelector('.input-hours');
    const minInput = container.querySelector('.input-mins');
    if (!hourInput || !minInput) return;

    let currentHours = parseInt(hourInput.value, 10) || 0;
    let currentMins = parseInt(minInput.value, 10) || 0;
    let totalMinutes = (currentHours * 60) + currentMins;

    // Wheel nach oben = Zeit erhöhen, nach unten = Zeit verringern
    const stepMinutes = (type === 'hour') ? 60 : 5;
    const delta = (e.deltaY < 0 ? 1 : -1) * stepMinutes;

    totalMinutes = Math.max(0, totalMinutes + delta);

    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;

    hourInput.value = newHours;
    minInput.value = newMins.toString().padStart(2, '0');
};

function renderColorPresets() {
    const container = document.getElementById('colorPresetsContainer');
    container.innerHTML = '';
    COLOR_PRESETS.forEach(p => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = p.hex;
        swatch.title = p.name;
        swatch.dataset.hex = p.hex;
        swatch.addEventListener('click', () => {
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
            document.getElementById('editColor').value = p.hex;
        });
        container.appendChild(swatch);
    });
}

function selectColorSwatch(hex) {
    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach(s => {
        if (s.dataset.hex.toLowerCase() === (hex || '#2b6cb0').toLowerCase()) {
            s.classList.add('selected');
        } else {
            s.classList.remove('selected');
        }
    });
    document.getElementById('editColor').value = hex || '#2b6cb0';
}

// Berechnet Canvas-Koordinaten eines Klicks
function getCanvasCoords(clientX, clientY) {
    const canvas = document.getElementById('canvas');
    const rect = canvas.getBoundingClientRect();
    const scale = panzoomInstance.getScale();
    return {
        x: (clientX - rect.left) / scale,
        y: (clientY - rect.top) / scale
    };
}

// Kontinuierliche Live-Spline-Vorschau
function handleLiveSplineMove(e) {
    if (!connectingFirstNodeId || !connectingFirstPoint) return;
    const mouseCoords = getCanvasCoords(e.clientX, e.clientY);
    renderConnections(mouseCoords);
}

function cancelConnectionMode() {
    connectingFirstNodeId = null;
    connectingFirstPoint = null;
    renderCanvas();
}

// Verbindungs-Logik: Klick auf beliebigen Knotenpunkt
/**
 * =============================================================================
 * Projekt: CAD & Zeichnungs-Hierarchie Tracker
 * Domain: Verbindungs-Management (Ersteller-Tracking, Berechtigungsprüfung & Subtree-Filter)
 * Zeitstempel: 2026-08-22 10:55:00 UTC
 * 
 * Breadcrumbs:
 * - 2026-08-22 10:35: Native SVG Bezier Layer & Auto-Hierarchie.
 * - 2026-08-22 10:55: [UPDATE] Erstellerkürzel für Kanten speichern, Berechtigungsprüfung
 *                     beim Trennen (nur Ersteller oder Admin), Ausblenden von Linien
 *                     eingeklappter Unterbaugruppen.
 * =============================================================================
 */

// 1. Verbindungs-Erstellung mit Ersteller-Speicherung
window.handleEndpointClick = async function (e, nodeId, pointType) {
    e.stopPropagation();

    const node = currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    const nodeEl = document.getElementById(node.id);
    const w = nodeEl ? nodeEl.offsetWidth : 320;
    const h = nodeEl ? nodeEl.offsetHeight : 200;

    const pointX = node.pos_x + w / 2;
    const pointY = pointType === 'top' ? node.pos_y : node.pos_y + h;

    if (!connectingFirstNodeId) {
        connectingFirstNodeId = nodeId;
        connectingFirstPoint = { x: pointX, y: pointY };
        showToast('Ersten Block gewählt. Klicke auf den zweiten Block (ESC zum Abbrechen).', 'info');
        renderCanvas();
    } else {
        if (connectingFirstNodeId === nodeId) {
            showToast('Ein Block kann nicht mit sich selbst verbunden werden.', 'error');
            cancelConnectionMode();
            return;
        }

        const firstNode = currentNodes.find(n => n.id === connectingFirstNodeId);
        const secondNode = node;

        // Relative Y-Position bestimmt Eltern-/Kind-Rolle
        let parentNode, childNode;
        if (firstNode.pos_y <= secondNode.pos_y) {
            parentNode = firstNode;
            childNode = secondNode;
        } else {
            parentNode = secondNode;
            childNode = firstNode;
        }

        cancelConnectionMode();

        const exists = currentEdges.some(edge => edge.source === parentNode.id && edge.target === childNode.id);
        if (!exists) {
            const edgeCreator = activeUserCode || 'COT';
            const newEdge = {
                source: parentNode.id,
                target: childNode.id,
                created_by: edgeCreator
            };

            currentEdges.push(newEdge);
            await db.from('project_edges').insert([newEdge]);
            showToast(`Hierarchische Verknüpfung erstellt (${parentNode.name} ➔ ${childNode.name})`, 'success');
            renderCanvas();
        } else {
            showToast('Diese Verbindung existiert bereits.', 'info');
        }
    }
};

// 2. Verbindung trennen mit Berechtigungsprüfung (nur Ersteller oder Admin)
window.handleDisconnectClick = async function (sourceId, targetId) {
    const edge = currentEdges.find(e => e.source === sourceId && e.target === targetId);
    const edgeCreator = edge ? (edge.created_by || 'COT') : 'COT';

    // Berechtigung: Nur Ersteller der Linie oder eingeloggter Admin
    const canDeleteEdge = isAdmin || (activeUserCode && activeUserCode === edgeCreator);

    if (!canDeleteEdge) {
        showToast(`Keine Berechtigung. Diese Verbindung kann nur von ${edgeCreator} oder dem Admin gelöscht werden.`, 'error');
        return;
    }

    const confirmed = await customConfirm('Verknüpfung trennen', 'Möchtest du diese hierarchische Verbindung wirklich löschen?');
    if (confirmed) {
        await db.from('project_edges').delete().match({ source: sourceId, target: targetId });
        currentEdges = currentEdges.filter(e => !(e.source === sourceId && e.target === targetId));
        showToast('Verbindung getrennt', 'success');
        renderCanvas();
    }
};

// Rendern der Blöcke
function renderCanvas() {
    const canvas = document.getElementById('canvas');
    const svgLayer = document.getElementById('connections-layer');

    const existingCards = canvas.querySelectorAll('.assembly-card');
    existingCards.forEach(c => c.remove());
    svgLayer.innerHTML = '';

    const rollups = calculateRollups();

    currentNodes.forEach(node => {
        // Falls ein Vorfahr eingeklappt ist, diesen Block nicht anzeigen
        if (isNodeHiddenByAncestor(node.id)) return;

        const stats = rollups[node.id] || { totalDesign: 0, totalDrafting: 0, logs: [] };
        const nodeColor = node.color_hex || '#2b6cb0';
        const creator = node.created_by || 'COT';
        const canDrag = isAdmin || (activeUserCode && activeUserCode === creator);

        const dSpent = stats.totalDesign;
        const dBudg = Math.max(0, parseFloat(node.budget_design_hours) || 0);
        const dPct = dBudg > 0 ? Math.round((dSpent / dBudg) * 100) : 0;
        const dPieStyle = generatePieStyle(dSpent, dBudg, nodeColor);

        const drSpent = stats.totalDrafting;
        const drBudg = Math.max(0, parseFloat(node.budget_drafting_hours) || 0);
        const drPct = drBudg > 0 ? Math.round((drSpent / drBudg) * 100) : 0;
        const drPieStyle = generatePieStyle(drSpent, drBudg, '#38a169');

        const isExpanded = expandedNodes.has(node.id);
        const nodeLogs = currentTimeLogs.filter(l => l.node_id === node.id);

        // Prüfen, ob der Block direkte Kinder hat
        const hasChildren = currentEdges.some(e => e.source === node.id);
        const isSubtreeCollapsed = collapsedParents.has(node.id);

        let subtreeBtnHtml = '';
        if (hasChildren) {
            subtreeBtnHtml = `
        <button type="button" class="btn-tree-toggle" title="${isSubtreeCollapsed ? 'Untergeordnete Blöcke einblenden' : 'Untergeordnete Blöcke ausblenden'}" onclick="toggleSubtreeCollapse(event, '${node.id}')">
          ${isSubtreeCollapsed ? '＋' : '－'}
        </button>
      `;
        }

        let inlineLogsHtml = '';
        if (isExpanded) {
            if (nodeLogs.length === 0) {
                inlineLogsHtml = `
          <div class="inline-logs-container">
            <div style="font-size:10px; color:#718096; text-align:center; padding: 4px 0;">Keine Zeiten erfasst.</div>
          </div>
        `;
            } else {
                let tableRows = '';
                nodeLogs.forEach(log => {
                    const d = new Date(log.logged_at);
                    const dateStr = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                    const kat = log.task_type === 'design' ? 'CAD' : 'Zeichn.';
                    const badge = log.status === 'approved'
                        ? '<span class="badge-approved">OK</span>'
                        : '<span class="badge-pending">Wartend</span>';

                    const timeFormatted = formatHoursToHM(log.hours);

                    let noteIconHtml = '';
                    if (log.note && log.note.trim() !== '') {
                        noteIconHtml = `
              <span class="info-tooltip-trigger">ℹ️
                <span class="tooltip-overlay">${escapeHtml(log.note)}</span>
              </span>
            `;
                    }

                    let deleteActionHtml = '';
                    if (isAdmin) {
                        deleteActionHtml = `<span class="btn-delete-log" title="Eintrag löschen" onclick="handleDeleteLog('${log.id}')">✕</span>`;
                    }

                    tableRows += `
            <tr>
              <td><strong>${escapeHtml(log.user_code)}</strong></td>
              <td>${dateStr}</td>
              <td>${kat}</td>
              <td>${timeFormatted} ${noteIconHtml}</td>
              <td>${badge} ${deleteActionHtml}</td>
            </tr>
          `;
                });

                inlineLogsHtml = `
          <div class="inline-logs-container">
            <table class="log-table">
              <thead>
                <tr>
                  <th>Kürzel</th>
                  <th>Datum</th>
                  <th>Kat.</th>
                  <th>Zeit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>
        `;
            }
        }

        const isConnectingThisNode = connectingFirstNodeId === node.id;
        const isSelected = selectedNodeIds.has(node.id);

        const el = document.createElement('div');
        el.id = node.id;
        el.className = `assembly-card ${canDrag ? 'draggable-enabled' : 'draggable-disabled'} ${isSelected ? 'selected-multi' : ''}`;
        el.style.left = `${node.pos_x}px`;
        el.style.top = `${node.pos_y}px`;
        el.style.borderColor = nodeColor;

        el.innerHTML = `
      <div id="ep-top-${node.id}" class="ep-handle ep-top ${isConnectingThisNode ? 'active-source' : ''}" title="Knotenpunkt oben" onclick="handleEndpointClick(event, '${node.id}', 'top')"></div>
      
      <div class="assembly-header" style="background: ${nodeColor};">
        <div style="display: flex; align-items: center;">
          ${subtreeBtnHtml}
          <span>${escapeHtml(node.name)}</span>
        </div>
        <div class="header-meta">
          <span class="author-badge" title="Ersteller">${escapeHtml(creator)}</span>
          <span class="assembly-article">${escapeHtml(node.article_number || '')}</span>
        </div>
      </div>
      <div class="assembly-body">
        <div class="charts-grid">
          <div class="chart-box">
            <div class="pie-chart" style="${dPieStyle}">
              <div class="pie-inner">${dPct}%</div>
            </div>
            <div class="chart-label">CAD</div>
            <div class="chart-sub">${formatHoursToHM(dSpent)} / ${formatHoursToHM(dBudg)}</div>
          </div>
          <div class="chart-box">
            <div class="pie-chart" style="${drPieStyle}">
              <div class="pie-inner">${drPct}%</div>
            </div>
            <div class="chart-label">Zeichnung</div>
            <div class="chart-sub">${formatHoursToHM(drSpent)} / ${formatHoursToHM(drBudg)}</div>
          </div>
        </div>

        <hr class="divider" />
        <form class="log-form" onsubmit="handleLog(event, '${node.id}')">
          <div class="time-inputs-row">
            <select class="log-input" style="font-weight: bold; width: 60px;">
              <option value="${activeUserCode}">${activeUserCode || 'KÜR'}</option>
            </select>
            <select class="log-input" style="width: 75px;">
              <option value="drafting">Zeichn.</option>
              <option value="design">CAD</option>
            </select>
            <input type="number" class="log-input input-hours" min="0" value="0" style="width: 44px;" title="Stunden (Mausrad: +/- 1h)" onwheel="handleTimeWheel(event, 'hour')" required />
            <span>h</span>
            <input type="number" class="log-input input-mins" min="0" max="55" step="5" value="30" style="width: 44px;" title="Minuten (Mausrad: +/- 5m)" onwheel="handleTimeWheel(event, 'min')" required />
            <span>m</span>
          </div>

          <div style="display: flex; gap: 4px;">
            <input type="text" class="log-input" placeholder="Kommentar (optional)..." style="flex: 1;" />
            <button type="submit" class="btn-log" style="background: ${nodeColor};">+ Log</button>
          </div>
        </form>
        
        <button class="btn-expand-toggle" onclick="toggleInlineLogs('${node.id}')">
          ${isExpanded ? '▲ Logs ausblenden' : '▼ Details & Logs anzeigen (' + nodeLogs.length + ')'}
        </button>

        ${inlineLogsHtml}
      </div>

      <div id="ep-bottom-${node.id}" class="ep-handle ep-bottom ${isConnectingThisNode ? 'active-source' : ''}" title="Knotenpunkt unten" onclick="handleEndpointClick(event, '${node.id}', 'bottom')"></div>
    `;

        // Multi-Selection Toggle via Shift + Klick
        el.addEventListener('click', (e) => {
            if (isAdmin && e.shiftKey) {
                e.stopPropagation();
                if (selectedNodeIds.has(node.id)) {
                    selectedNodeIds.delete(node.id);
                } else {
                    selectedNodeIds.add(node.id);
                }
                renderCanvas();
            }
        });

        el.addEventListener('dblclick', (e) => {
            if (!e.target.closest('.ep-handle') && !e.target.closest('.btn-delete-log') && !e.target.closest('.btn-tree-toggle')) {
                openConfigModal(node.id);
            }
        });

        // Multi- & Single-Dragging
        if (canDrag) {
            let isDragging = false;
            let startX = 0, startY = 0;
            let startPositions = new Map();

            el.addEventListener('mousedown', (e) => {
                if (e.target.closest('input, select, button, .ep-handle, .btn-delete-log, .btn-tree-toggle')) return;
                if (e.shiftKey) return; // Shift dient der Auswahl

                isDragging = true;
                const scale = panzoomInstance.getScale();
                startX = e.clientX;
                startY = e.clientY;
                e.stopPropagation();

                // Wenn der gezogene Knoten Teil der Multi-Auswahl ist, alle ausgewählten Knoten bewegen
                const nodesToMove = (isAdmin && selectedNodeIds.has(node.id))
                    ? Array.from(selectedNodeIds).map(id => currentNodes.find(n => n.id === id)).filter(Boolean)
                    : [node];

                startPositions.clear();
                nodesToMove.forEach(n => {
                    startPositions.set(n.id, { x: n.pos_x, y: n.pos_y });
                });

                const onMouseMove = (moveEvent) => {
                    if (!isDragging) return;
                    const dx = (moveEvent.clientX - startX) / scale;
                    const dy = (moveEvent.clientY - startY) / scale;

                    nodesToMove.forEach(n => {
                        const startPos = startPositions.get(n.id);
                        const newX = Math.max(10, Math.round(startPos.x + dx));
                        const newY = Math.max(10, Math.round(startPos.y + dy));
                        n.pos_x = newX;
                        n.pos_y = newY;
                        const nodeEl = document.getElementById(n.id);
                        if (nodeEl) {
                            nodeEl.style.left = `${newX}px`;
                            nodeEl.style.top = `${newY}px`;
                        }
                    });

                    renderConnections();
                };

                const onMouseUp = async () => {
                    if (!isDragging) return;
                    isDragging = false;
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);

                    // Datenbank-Update für alle bewegten Knoten
                    for (const n of nodesToMove) {
                        await db.from('project_nodes').update({ pos_x: n.pos_x, pos_y: n.pos_y }).eq('id', n.id);
                    }
                };

                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            });
        }

        canvas.appendChild(el);
    });

    renderConnections();
}

// Zeichnet alle bestehenden Verbindungen sowie die Live-Vorschau-Spline
// 3. Zeichnen der Verbindungen (mit Filter für ausgeblendete Unterknoten)
function renderConnections(mouseCoords = null) {
    const svgLayer = document.getElementById('connections-layer');
    svgLayer.innerHTML = '';

    // 1. Feste Hierarchie-Verbindungen (nur anzeigen, wenn weder Source noch Target ausgeblendet sind)
    currentEdges.forEach(edge => {
        // Prüfen, ob einer der Blöcke durch einen eingeklappten Vorfahren verborgen ist
        if (isNodeHiddenByAncestor(edge.source) || isNodeHiddenByAncestor(edge.target)) {
            return;
        }

        // Wenn der Quell-Block selbst eingeklappt ist, seine ausgehenden Linien nicht zeichnen
        if (collapsedParents.has(edge.source)) {
            return;
        }

        const srcNode = currentNodes.find(n => n.id === edge.source);
        const tgtNode = currentNodes.find(n => n.id === edge.target);

        if (srcNode && tgtNode) {
            const srcEl = document.getElementById(srcNode.id);
            const tgtEl = document.getElementById(tgtNode.id);

            const srcW = srcEl ? srcEl.offsetWidth : 320;
            const srcH = srcEl ? srcEl.offsetHeight : 200;
            const tgtW = tgtEl ? tgtEl.offsetWidth : 320;

            const x1 = srcNode.pos_x + srcW / 2;
            const y1 = srcNode.pos_y + srcH;

            const x2 = tgtNode.pos_x + tgtW / 2;
            const y2 = tgtNode.pos_y;

            const dy = Math.max(50, Math.abs(y2 - y1) * 0.5);
            const pathD = `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathD);
            path.setAttribute('class', 'connection-line');
            path.setAttribute('title', `Verbindung (Erstellt von: ${edge.created_by || 'COT'}) - Klick zum Trennen`);
            path.addEventListener('click', () => handleDisconnectClick(edge.source, edge.target));

            svgLayer.appendChild(path);
        }
    });

    // 2. Kontinuierliche Live-Spline-Vorschau
    if (connectingFirstPoint && mouseCoords) {
        const x1 = connectingFirstPoint.x;
        const y1 = connectingFirstPoint.y;
        const x2 = mouseCoords.x;
        const y2 = mouseCoords.y;

        const dy = Math.max(40, Math.abs(y2 - y1) * 0.5);
        const pathD = `M ${x1} ${y1} C ${x1} ${y1 + (y2 >= y1 ? dy : -dy)}, ${x2} ${y2 + (y2 >= y1 ? -dy : dy)}, ${x2} ${y2}`;

        const previewPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        previewPath.setAttribute('d', pathD);
        previewPath.setAttribute('class', 'preview-connection-line');

        svgLayer.appendChild(previewPath);
    }
}

function handleOpenAddBlockModal() {
    const budgetRow = document.getElementById('newBlockBudgetRow');
    budgetRow.style.display = isAdmin ? 'flex' : 'none';
    openModal('newBlockModal');
}

async function handleAddBlock(e) {
    e.preventDefault();
    const name = document.getElementById('newBlockName').value.trim();
    const article = document.getElementById('newBlockArticle').value.trim();

    let designBudget = 0;
    let draftingBudget = 0;

    if (isAdmin) {
        designBudget = Math.max(0, parseFloat(document.getElementById('newBlockBudgetDesign').value) || 0);
        draftingBudget = Math.max(0, parseFloat(document.getElementById('newBlockBudgetDrafting').value) || 0);
    }

    if (article && !/^\d{5}$/.test(article)) {
        showToast('Artikelnummer muss genau 5 Ziffern lang sein.', 'error');
        return;
    }

    const posX = Math.round(Math.random() * 250 + 150);
    const posY = Math.round(Math.random() * 200 + 150);

    await db.from('project_nodes').insert([{
        name,
        article_number: article,
        budget_design_hours: designBudget,
        budget_drafting_hours: draftingBudget,
        color_hex: '#2b6cb0',
        created_by: activeUserCode || 'COT',
        pos_x: posX,
        pos_y: posY
    }]);

    closeModal('newBlockModal');
    document.getElementById('newBlockForm').reset();
    showToast('Block erfolgreich hinzugefügt', 'success');
}

window.handleDeleteLog = async function (logId) {
    if (!isAdmin) return;
    const confirmed = await customConfirm('Zeiteintrag löschen', 'Sind Sie sicher, dass dieser Zeiteintrag unwiderruflich gelöscht werden soll?');
    if (confirmed) {
        await db.from('time_logs').delete().eq('id', logId);
        showToast('Zeiteintrag gelöscht', 'success');
    }
};

window.openProjectSettingsModal = function () {
    if (!isAdmin) return;
    document.getElementById('editObjectNumber').value = currentProjectSettings.object_number || '';
    document.getElementById('editTotalBudgetDesign').value = currentProjectSettings.total_budget_design || 100;
    document.getElementById('editTotalBudgetDrafting').value = currentProjectSettings.total_budget_drafting || 60;
    openModal('projectSettingsModal');
};

async function handleSaveProjectSettings(e) {
    e.preventDefault();
    const objNum = document.getElementById('editObjectNumber').value.trim();
    const bDesign = Math.max(0, parseFloat(document.getElementById('editTotalBudgetDesign').value) || 0);
    const bDraft = Math.max(0, parseFloat(document.getElementById('editTotalBudgetDrafting').value) || 0);

    await db.from('project_settings').upsert({
        id: 'global_project',
        object_number: objNum,
        total_budget_design: bDesign,
        total_budget_drafting: bDraft
    });

    closeModal('projectSettingsModal');
    showToast('Projekt-Budget aktualisiert', 'success');
}

async function handleLog(e, nodeId) {
    e.preventDefault();
    const form = e.target;
    const taskType = form.elements[1].value;
    const hours = parseInt(form.elements[2].value, 10) || 0;
    const mins = parseInt(form.elements[3].value, 10) || 0;
    const note = form.elements[4].value.trim();

    if (hours < 0 || mins < 0 || (hours === 0 && mins === 0)) {
        showToast('Bitte mindestens 5 Minuten positive Zeit eingeben.', 'error');
        return;
    }

    if (!activeUserCode) {
        showToast('Bitte wähle zuerst dein Benutzerkürzel.', 'error');
        return;
    }

    const decimalHours = parseFloat((hours + (mins / 60)).toFixed(4));

    await db.from('time_logs').insert([{
        node_id: nodeId,
        user_code: activeUserCode,
        task_type: taskType,
        hours: decimalHours,
        note: note,
        status: 'pending'
    }]);

    form.elements[2].value = '0';
    form.elements[3].value = '30';
    form.elements[4].value = '';
    showToast(`${hours}h ${mins}m erfasst (wartet auf Freigabe)`, 'success');
}

window.openConfigModal = function (nodeId) {
    const node = currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    document.getElementById('editNodeId').value = node.id;
    document.getElementById('editName').value = node.name;
    document.getElementById('editArticleNumber').value = node.article_number || '';
    selectColorSwatch(node.color_hex);

    const bDesign = document.getElementById('editBudgetDesign');
    const bDraft = document.getElementById('editBudgetDrafting');
    const btnDel = document.getElementById('btnDeleteBlock');

    bDesign.value = node.budget_design_hours;
    bDraft.value = node.budget_drafting_hours;

    bDesign.disabled = !isAdmin;
    bDraft.disabled = !isAdmin;
    btnDel.style.display = isAdmin ? 'block' : 'none';

    openModal('configModal');
};

window.openModal = function (modalId) {
    document.getElementById(modalId).style.display = 'flex';
};

window.closeModal = function (modalId) {
    document.getElementById(modalId).style.display = 'none';
};

async function handleSaveConfig(e) {
    e.preventDefault();
    const id = document.getElementById('editNodeId').value;
    const name = document.getElementById('editName').value;
    const article_number = document.getElementById('editArticleNumber').value;
    const color_hex = document.getElementById('editColor').value;

    const updateData = { name, article_number, color_hex };

    if (isAdmin) {
        updateData.budget_design_hours = Math.max(0, parseFloat(document.getElementById('editBudgetDesign').value) || 0);
        updateData.budget_drafting_hours = Math.max(0, parseFloat(document.getElementById('editBudgetDrafting').value) || 0);
    }

    await db.from('project_nodes').update(updateData).eq('id', id);
    closeModal('configModal');
    showToast('Block aktualisiert', 'success');
}

async function handleDeleteNode() {
    if (!isAdmin) {
        showToast('Nur Administratoren können Blöcke löschen.', 'error');
        return;
    }
    const confirmed = await customConfirm('Block löschen', 'Sind Sie sicher, dass Sie diesen Block und alle Unterverknüpfungen unwiderruflich löschen möchten?');
    if (confirmed) {
        const id = document.getElementById('editNodeId').value;
        await db.from('project_nodes').delete().eq('id', id);
        closeModal('configModal');
        showToast('Block gelöscht', 'success');
    }
}

window.handleAdminIconClick = async function () {
    if (isAdmin) {
        openAdminModal();
    } else {
        const pwd = await customPrompt('Administrator-Login', 'Bitte Admin-Passwort eingeben:', '', true);
        if (pwd === ADMIN_PASS) {
            isAdmin = true;
            const btn = document.getElementById('adminLockBtn');
            btn.classList.add('logged-in');
            btn.textContent = '🔓';
            showToast('Als Administrator eingeloggt', 'success');
            renderCanvas();
            updateSidebarStats();
            openAdminModal();
        } else if (pwd !== null) {
            showToast('Falsches Passwort', 'error');
        }
    }
};

function openAdminModal() {
    renderPendingLogsTable();
    renderAdminUserList();
    openModal('adminModal');
}

function renderPendingLogsTable() {
    const container = document.getElementById('pendingLogsTableContainer');
    const pendingLogs = currentTimeLogs.filter(l => l.status === 'pending');

    if (pendingLogs.length === 0) {
        container.innerHTML = '<div style="font-size:12px; color:#718096; padding:10px 0;">Keine ausstehenden Freigaben vorhanden.</div>';
        return;
    }

    let html = `
    <table class="log-table">
      <thead>
        <tr>
          <th>Kürzel</th>
          <th>Block</th>
          <th>Kat.</th>
          <th>Zeit</th>
          <th>Kommentar</th>
          <th>Aktion</th>
        </tr>
      </thead>
      <tbody>
  `;

    pendingLogs.forEach(log => {
        const node = currentNodes.find(n => n.id === log.node_id);
        const nodeName = node ? node.name : 'Unbekannt';
        const kat = log.task_type === 'design' ? 'CAD' : 'Zeichn.';

        html += `
      <tr>
        <td><strong>${escapeHtml(log.user_code)}</strong></td>
        <td>${escapeHtml(nodeName)}</td>
        <td>${kat}</td>
        <td>${formatHoursToHM(log.hours)}</td>
        <td style="color:#718096; font-style:italic;">${escapeHtml(log.note || '-')}</td>
        <td>
          <button class="btn-prim" style="padding: 2px 8px; font-size: 10px;" onclick="approveLog('${log.id}')">Freigeben</button>
        </td>
      </tr>
    `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

window.approveLog = async function (logId) {
    await db.from('time_logs').update({ status: 'approved' }).eq('id', logId);
    showToast('Zeiteintrag freigegeben', 'success');
};

function renderAdminUserList() {
    const container = document.getElementById('userListContainer');
    container.innerHTML = '';
    currentUsers.forEach(u => {
        const tag = document.createElement('div');
        tag.style.cssText = 'background:#edf2f7; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:bold; display:flex; align-items:center; gap:6px;';
        tag.innerHTML = `
      <span>${u.code}</span>
      <span style="color:#e53e3e; cursor:pointer;" onclick="handleDeleteUserCode('${u.id}')">&times;</span>
    `;
        container.appendChild(tag);
    });
}

window.handleAddUserCode = async function () {
    const input = document.getElementById('newCodeInput');
    const code = input.value.trim().toUpperCase();
    if (code.length !== 3) {
        showToast('Kürzel muss genau 3 Zeichen lang sein.', 'error');
        return;
    }
    await db.from('app_users').insert([{ code }]);
    input.value = '';
    showToast(`Kürzel ${code} hinzugefügt`, 'success');
};

window.handleDeleteUserCode = async function (userId) {
    const confirmed = await customConfirm('Kürzel löschen', 'Möchtest du dieses Benutzerkürzel wirklich entfernen?');
    if (confirmed) {
        await db.from('app_users').delete().eq('id', userId);
        showToast('Kürzel gelöscht', 'success');
    }
};

function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}