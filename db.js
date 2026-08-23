/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Datenbank, Realtime-Sync, State & Hierarchie-Rollup Engine
 * Zeitstempel: 2026-08-23 21:10:00 CEST
 * Breadcrumbs:
 *   - Komplette Bereinigung redundanter Fetch-Funktionen.
 *   - Paralleles Laden aller Projektdaten inkl. Materialfluss-Pfeile (zone_flow_arrows).
 * =============================================================================
 */

const SUPABASE_URL = 'https://oazqaykiffiznfgrmihi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9XeDSb2HEkzK8yDL1ralIQ_HERPIq3C';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_PASS = '787456c';
window.isAdmin = false;
window.activeUserCode = '';
window.activeProjectId = 'proj_default';

const COLOR_PRESETS = [
    { name: 'Stahlblau', hex: '#2b6cb0' },
    { name: 'Salbeigrün', hex: '#38a169' },
    { name: 'Schiefergrau', hex: '#4a5568' },
    { name: 'Kupfer', hex: '#c05621' },
    { name: 'Dunkel-Petrol', hex: '#319795' },
    { name: 'Gedämpftes Indigo', hex: '#553c9a' }
];

// Globale State-Arrays
window.currentProjects = [];
window.currentNodes = [];
window.currentEdges = [];
window.currentZones = [];
window.currentTimeLogs = [];
window.currentUsers = [];
window.currentAuditLogs = [];
window.currentFlowArrows = [];

window.showAllAuditLogs = false;

// Globale Sets für UI-Status
window.selectedNodeIds = new Set();
window.expandedNodes = new Set();
window.collapsedParents = new Set();
window.hiddenTopZoneIds = new Set();
window.dialogResolve = null;

window.isDraggingAnything = false;
window.pendingCanvasUpdate = false;


// =============================================================================
// 1. GLOBALE DATEN-ABFRAGEN (User & Projekte)
// =============================================================================

async function fetchUsers() {
    try {
        const { data, error } = await db.from('app_users').select('*').order('code', { ascending: true });
        if (error) throw error;
        currentUsers = data || [];
    } catch (err) {
        console.error("Fehler beim Laden der Benutzer:", err);
        currentUsers = [];
    } finally {
        if (typeof window.renderUserDropdowns === 'function') window.renderUserDropdowns();
        if (isAdmin && typeof window.renderAdminUserList === 'function') window.renderAdminUserList();
    }
}

async function fetchProjects() {
    try {
        const { data, error } = await db.from('projects').select('*').order('object_number', { ascending: true });
        if (error) throw error;
        currentProjects = data || [];

        const activeProjects = currentProjects.filter(p => !p.is_archived);
        if (activeProjects.length > 0 && !activeProjects.some(p => p.id === activeProjectId)) {
            activeProjectId = activeProjects[0].id;
        }
    } catch (err) {
        console.error("Fehler beim Laden der Projekte:", err);
        currentProjects = [];
    } finally {
        if (typeof window.renderProjectDropdowns === 'function') window.renderProjectDropdowns();
        if (typeof window.updateSidebarStats === 'function') window.updateSidebarStats();
        if (isAdmin && typeof window.renderAdminProjectList === 'function') window.renderAdminProjectList();
        if (typeof window.renderArchivedProjectsList === 'function') window.renderArchivedProjectsList();
    }
}

function getCurrentProject() {
    return currentProjects.find(p => p.id === activeProjectId) || {
        object_number: 'OBJ-2026-01',
        name: 'Standard',
        total_budget_design: 100,
        total_budget_drafting: 60
    };
}


// =============================================================================
// 2. CANVAS-SPEZIFISCHE DATEN-ABFRAGEN (Nodes, Edges, Zones, Logs, Pfeile)
// =============================================================================

window.fetchCanvasData = async function() {
    if (!activeProjectId) return;

    // Parallel-Fetch für maximale Performance
    const [nodesRes, edgesRes, zonesRes, logsRes, arrowsRes] = await Promise.all([
        db.from('project_nodes').select('*').eq('project_id', activeProjectId),
        db.from('project_edges').select('*').eq('project_id', activeProjectId),
        db.from('project_zones').select('*').eq('project_id', activeProjectId),
        db.from('time_logs').select('*').eq('project_id', activeProjectId).order('logged_at', { ascending: false }),
        db.from('zone_flow_arrows').select('*').eq('project_id', activeProjectId)
    ]);

    if (arrowsRes.error) {
        console.error("Supabase Fehler beim Pfeile laden:", arrowsRes.error);
    }

    if (window.isDraggingAnything) {
        window.pendingCanvasUpdate = true;
        return;
    }

    // State updaten
    currentNodes = nodesRes.data || [];
    currentEdges = edgesRes.data || [];
    currentZones = zonesRes.data || [];
    currentTimeLogs = logsRes.data || [];
    window.currentFlowArrows = arrowsRes.data || [];

    // UI Trigger
    if (window.renderCanvas) window.renderCanvas();
    if (window.updateSidebarStats) window.updateSidebarStats();
    if (window.renderSidebarZones) window.renderSidebarZones();
    if (isAdmin && window.renderPendingLogsTable) window.renderPendingLogsTable();
};

async function fetchAuditLogs() {
    const { data } = await db.from('budget_audit_logs').select('*').order('changed_at', { ascending: false }).limit(50);
    currentAuditLogs = data || [];
    if (isAdmin && window.renderBudgetAuditLogs) window.renderBudgetAuditLogs();
}


// =============================================================================
// 3. HIERARCHISCHE ROLLUP ENGINE (Child -> Parent Zeit-Aggregation)
// =============================================================================

function calculateRollups() {
    const directMap = {};
    currentTimeLogs.forEach(l => {
        if (!directMap[l.node_id]) directMap[l.node_id] = { design: 0, drafting: 0, logs: [] };
        const hrs = Math.max(0, parseFloat(l.hours) || 0);
        if (l.task_type === 'design') directMap[l.node_id].design += hrs;
        if (l.task_type === 'drafting') directMap[l.node_id].drafting += hrs;
        directMap[l.node_id].logs.push(l);
    });

    // Gerichteter Baum für Rollup (Child -> Parent Verknüpfung)
    const childrenMap = {};
    currentEdges.forEach(e => {
        if (!childrenMap[e.source]) childrenMap[e.source] = [];
        childrenMap[e.source].push(e.target);
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
            const childTotals = aggregate(childId, new Set(visited));
            totalDesign += childTotals.totalDesign;
            totalDrafting += childTotals.totalDrafting;
        });

        memo[nodeId] = { totalDesign, totalDrafting, logs: direct.logs };
        return { totalDesign, totalDrafting };
    }

    currentNodes.forEach(n => aggregate(n.id));
    return memo;
}