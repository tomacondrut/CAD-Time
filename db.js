/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Datenbank, Realtime-Sync, State & Hierarchie-Rollup Engine
 * Zeitstempel: 2026-08-23 10:00:00 CEST
 * =============================================================================
 */

const SUPABASE_URL = 'https://oazqaykiffiznfgrmihi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9XeDSb2HEkzK8yDL1ralIQ_HERPIq3C';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_PASS = '787456c';
let isAdmin = false;
let activeUserCode = '';
let activeProjectId = 'proj_default';

const COLOR_PRESETS = [
    { name: 'Stahlblau', hex: '#2b6cb0' },
    { name: 'Salbeigrün', hex: '#38a169' },
    { name: 'Schiefergrau', hex: '#4a5568' },
    { name: 'Kupfer', hex: '#c05621' },
    { name: 'Dunkel-Petrol', hex: '#319795' },
    { name: 'Gedämpftes Indigo', hex: '#553c9a' }
];

// Globales Set für ausgeblendete Zonen sicher an window binden
window.hiddenTopZoneIds = new Set();

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

// NEU: Lokaler State für das Ausblenden/Isolieren von Zonen
window.hiddenTopZoneIds = new Set();

// --- Datenabruf & Realtime ---
async function fetchUsers() {
    try {
        const { data, error } = await db.from('app_users').select('*').order('code', { ascending: true });
        if (error) throw error;
        currentUsers = data || [];
    } catch (err) {
        console.error("Fehler beim Laden der Benutzer:", err);
        currentUsers = []; // Fallback bei Fehler
    } finally {
        // Wird IMMER ausgeführt, auch wenn die Abfrage fehlschlägt
        if (typeof window.renderUserDropdowns === 'function') {
            window.renderUserDropdowns();
        }
        if (isAdmin && typeof window.renderAdminUserList === 'function') {
            window.renderAdminUserList();
        }
    }
}
async function fetchProjects() {
    try {
        const { data, error } = await db.from('projects').select('*').order('object_number', { ascending: true });
        if (error) throw error;
        currentProjects = data || [];

        // Erstes aktives Projekt als Standard setzen, falls noch keines gewählt
        const activeProjects = currentProjects.filter(p => !p.is_archived);
        if (activeProjects.length > 0 && !activeProjects.some(p => p.id === activeProjectId)) {
            activeProjectId = activeProjects[0].id;
        }
    } catch (err) {
        console.error("Fehler beim Laden der Projekte:", err);
        currentProjects = []; // Fallback bei Fehler
    } finally {
        // Wird IMMER ausgeführt
        if (typeof window.renderProjectDropdowns === 'function') {
            window.renderProjectDropdowns();
        }
        if (typeof window.updateSidebarStats === 'function') {
            window.updateSidebarStats();
        }
        if (isAdmin && typeof window.renderAdminProjectList === 'function') {
            window.renderAdminProjectList();
        }
        if (typeof window.renderArchivedProjectsList === 'function') {
            window.renderArchivedProjectsList();
        }
    }
}

window.isDraggingAnything = false;
window.pendingCanvasUpdate = false;

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Datenbank & State
 * ERSETZEN IN: db.js
 * Funktion: fetchCanvasData
 * Breadcrumbs:
 *   - [2026-08-23 10:00:00 CEST]: Initialer Datenabruf für Nodes, Edges, Zones, Logs
 *   - [2026-08-23 10:55:00 CEST]: Aufruf von window.renderSidebarZones hinzugefügt, 
 *     um Zonen-Liste & Isolierungs-Status in der Sidebar synchron zu halten.
 * =============================================================================
 */
async function fetchCanvasData() {
    const { data: nodes } = await db.from('project_nodes').select('*').eq('project_id', activeProjectId);
    const { data: edges } = await db.from('project_edges').select('*').eq('project_id', activeProjectId);
    const { data: zones } = await db.from('project_zones').select('*').eq('project_id', activeProjectId);
    const { data: logs } = await db.from('time_logs').select('*').eq('project_id', activeProjectId).order('logged_at', { ascending: false });

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
    if (window.renderSidebarZones) window.renderSidebarZones();
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