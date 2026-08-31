/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Datenbank, Supabase-Proxy, State & Hierarchie-Rollup Engine
 * ERSETZEN IN: db.js (Gesamte Datei)
 * Zeitstempel: 2026-08-30 10:27:00 CEST
 * Breadcrumbs:
 *   - [2026-08-23 21:10:00 CEST]: Initiale DB-Anbindung, paralleles Laden aller 
 *     Projektdaten inkl. Materialfluss-Pfeile (zone_flow_arrows).
 *   - [2026-08-28 22:50:00 - 2026-08-29 21:15:00 CEST]: Farbpaletten-Optimierung 
 *     (High-Contrast Edition & Farbkreis-Sortierung).
 *   - [2026-08-30 10:20:00 CEST]: Supabase-Proxy integriert zur strikten Isolation 
 *     lokaler Projekte vor unbeabsichtigtem Cloud-Sync.
 *   - [2026-08-30 10:45:00 CEST]: Hardcodiertes ADMIN_PASS entfernt und dynamische 
 *     Abfrage über Supabase-Tabelle 'app_config' zur Proxy-Whitelist hinzugefügt.
 *   - [2026-08-30 10:50:00 CEST]: Doppelte Deklarationen von fetchCanvasData bereinigt 
 *     und direkte realDb-Instanz für Systemabfragen stabilisiert.
 * =============================================================================
 */

const SUPABASE_URL = 'https://oazqaykiffiznfgrmihi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9XeDSb2HEkzK8yDL1ralIQ_HERPIq3C';
const realDb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Datenbank & Lokaler Mock (Sofortiger Response & Single-Select Fix)
 * ERSETZEN IN: db.js (Konstante localDbMock)
 * Zeitstempel: 2026-08-30 10:35:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 10:20:00 CEST]: Initiale Mock-Engine.
 *   - [2026-08-30 10:35:00 CEST]: Promise-Rückgabe für insert().select().single()
 *     vollständig kompatibel zur Supabase-Client-Syntax gemacht, damit neu 
 *     erstellte Blöcke und Verbindungen ohne Reload/Projektwechsel sofort gerendert werden.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Datenbank & Lokaler Mock (Array/Objekt Guard & Abfrage-Kompatibilität)
 * ERSETZEN IN: db.js (Konstante localDbMock)
 * Zeitstempel: 2026-08-31 18:25:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 10:35:00 CEST]: Promise-Rückgabe für insert().select().single().
 *   - [2026-08-31 18:25:00 CEST]: Array.isArray Guard bei Inserts ergänzt, damit 
 *     sowohl Objekte als auch Arrays im lokalen Modus fehlerfrei gespeichert werden.
 * =============================================================================
 */
const localDbMock = {
    from: function (table) {
        return {
            select: (cols = '*') => ({
                eq: (col, val) => ({
                    order: () => {
                        let targetArr = [];
                        if (table === 'project_nodes') targetArr = currentNodes;
                        else if (table === 'project_edges') targetArr = currentEdges;
                        else if (table === 'project_zones') targetArr = currentZones;
                        else if (table === 'time_logs') targetArr = currentTimeLogs;
                        else if (table === 'zone_flow_arrows') targetArr = window.currentFlowArrows || [];
                        return Promise.resolve({ data: targetArr.filter(x => x[col] === val), error: null });
                    },
                    single: () => {
                        let targetArr = [];
                        if (table === 'project_nodes') targetArr = currentNodes;
                        else if (table === 'project_zones') targetArr = currentZones;
                        return Promise.resolve({ data: targetArr.find(x => x[col] === val) || null, error: null });
                    },
                    then: (resolve) => {
                        let targetArr = [];
                        if (table === 'project_nodes') targetArr = currentNodes;
                        else if (table === 'project_edges') targetArr = currentEdges;
                        else if (table === 'project_zones') targetArr = currentZones;
                        else if (table === 'time_logs') targetArr = currentTimeLogs;
                        return resolve({ data: targetArr.filter(x => x[col] === val), error: null });
                    }
                }),
                order: () => Promise.resolve({ data: [], error: null }),
                single: () => Promise.resolve({ data: null, error: null })
            }),
            insert: (dataOrArr) => {
                const arr = Array.isArray(dataOrArr) ? dataOrArr : [dataOrArr];
                const insertedItems = arr.map(item => ({
                    ...item,
                    id: item.id || ('loc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)),
                    created_at: item.created_at || new Date().toISOString()
                }));

                if (table === 'project_nodes') currentNodes.push(...insertedItems);
                else if (table === 'project_edges') currentEdges.push(...insertedItems);
                else if (table === 'project_zones') currentZones.push(...insertedItems);
                else if (table === 'time_logs') currentTimeLogs.push(...insertedItems);
                else if (table === 'zone_flow_arrows') {
                    if (!window.currentFlowArrows) window.currentFlowArrows = [];
                    window.currentFlowArrows.push(...insertedItems);
                }

                if (window.handleSaveFile) window.handleSaveFile(true); // Silent Auto-save

                return {
                    select: () => ({
                        single: () => Promise.resolve({ data: insertedItems[0], error: null }),
                        then: (resolve) => resolve({ data: insertedItems, error: null })
                    }),
                    then: (resolve) => resolve({ data: insertedItems, error: null })
                };
            },
            update: (obj) => ({
                eq: (col, val) => {
                    let targetArr = [];
                    if (table === 'project_nodes') targetArr = currentNodes;
                    else if (table === 'project_zones') targetArr = currentZones;
                    else if (table === 'time_logs') targetArr = currentTimeLogs;

                    const item = targetArr.find(x => x[col] === val);
                    if (item) Object.assign(item, obj);
                    if (window.handleSaveFile) window.handleSaveFile(true);
                    return Promise.resolve({ data: item, error: null });
                }
            }),
            delete: () => ({
                eq: (col, val) => {
                    if (table === 'project_nodes') currentNodes = currentNodes.filter(x => x[col] !== val);
                    else if (table === 'project_zones') currentZones = currentZones.filter(x => x[col] !== val);
                    else if (table === 'time_logs') currentTimeLogs = currentTimeLogs.filter(x => x[col] !== val);
                    else if (table === 'zone_flow_arrows' && window.currentFlowArrows) {
                        window.currentFlowArrows = window.currentFlowArrows.filter(x => x[col] !== val);
                    }

                    if (window.handleSaveFile) window.handleSaveFile(true);
                    return Promise.resolve({ data: null, error: null });
                },
                match: (queryObj) => {
                    if (table === 'project_edges') {
                        currentEdges = currentEdges.filter(e => !(e.source === queryObj.source && e.target === queryObj.target));
                    }
                    if (window.handleSaveFile) window.handleSaveFile(true);
                    return Promise.resolve({ data: null, error: null });
                }
            })
        };
    }
};
// Globaler DB-Proxy: Leitet Anfragen je nach Projekt-Präfix ('local_') um
const db = new Proxy(realDb, {
    get(target, prop) {
        if (prop === 'from') {
            return function (table) {
                const isLocalActive = window.activeProjectId && window.activeProjectId.startsWith('local_');

                // Blockiere Supabase strikt für lokale Projekte (Ausnahmen bleiben ansprechbar)
                if (isLocalActive && table !== 'projects' && table !== 'app_users' && table !== 'budget_audit_logs' && table !== 'app_config') {
                    return localDbMock.from(table);
                }

                // Lokale Projekt-Updates/-Löschungen in IndexedDB abfangen
                if (table === 'projects') {
                    return {
                        ...target.from(table),
                        update: (obj) => ({
                            eq: (col, val) => {
                                if (val.startsWith('local_')) {
                                    const p = currentProjects.find(x => x.id === val);
                                    if (p) {
                                        Object.assign(p, obj);
                                        if (window.localDB) {
                                            const tx = window.localDB.transaction('projects', 'readwrite');
                                            tx.objectStore('projects').put(p);
                                        }
                                        if (window.renderProjectDropdowns) window.renderProjectDropdowns();
                                    }
                                    return Promise.resolve({ data: null, error: null });
                                }
                                return target.from(table).update(obj).eq(col, val);
                            }
                        }),
                        delete: () => ({
                            eq: (col, val) => {
                                if (val.startsWith('local_')) {
                                    if (window.localDB) {
                                        const tx = window.localDB.transaction('projects', 'readwrite');
                                        tx.objectStore('projects').delete(val);
                                    }
                                    currentProjects = currentProjects.filter(x => x.id !== val);
                                    return Promise.resolve({ data: null, error: null });
                                }
                                return target.from(table).delete().eq(col, val);
                            }
                        })
                    };
                }
                return target.from(table);
            };
        }
        return target[prop];
    }
});

window.isAdmin = false;
window.activeUserCode = '';
window.activeProjectId = 'proj_default';

/**
 * =============================================================================
 * Domain: Farbpaletten (Global)
 * Breadcrumbs:
 *   - [2026-08-28 22:50:00 CEST]: 9 komplementäre Erdfarben.
 *   - [2026-08-28 23:05:00 CEST]: High-Contrast Edition für Dark-Sidebar/Light-Canvas.
 *   - [2026-08-29 20:50:00 CEST]: Dunkelgrau und Sonnengelb integriert.
 *   - [2026-08-29 21:15:00 CEST]: Farbkreis-Sortierung von Rot bis Magenta.
 * =============================================================================
 */
const COLOR_PRESETS = [
    { name: 'Rubinrot', hex: '#dc2626' },
    { name: 'Bernstein', hex: '#ea580c' },
    { name: 'Sonnengelb', hex: '#eab308' },
    { name: 'Smaragdgrün', hex: '#16a34a' },
    { name: 'Königsblau', hex: '#2563eb' },
    { name: 'Violett', hex: '#7c3aed' },
    { name: 'Magenta', hex: '#c026d3' },
    { name: 'Ockergold', hex: '#b45309' },
    { name: 'Dunkelgrau', hex: '#4b5563' }
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
        const { data, error } = await realDb.from('app_users').select('*').order('code', { ascending: true });
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

/**
 * =============================================================================
 * Domain: Projekt-Abruf & Session-Wiederherstellung
 * Breadcrumbs:
 *   - [2026-08-30 10:25:00 CEST]: IndexedDB-Merge für lokale Projekte integriert.
 *   - [2026-08-30 10:50:00 CEST]: Strikte Trennung zwischen realDb und lokalem Speicher.
 * =============================================================================
 */
async function fetchProjects() {
    try {
        const { data, error } = await realDb.from('projects').select('*').order('object_number', { ascending: true });
        if (error) throw error;
        currentProjects = data || [];

        // Lokale Projekte laden und zusammenführen
        if (window.loadLocalProjects) {
            const localProjs = await window.loadLocalProjects();
            currentProjects = [...localProjs, ...currentProjects];
        }

        const activeProjects = currentProjects.filter(p => !p.is_archived);
        if (activeProjects.length > 0 && !activeProjects.some(p => p.id === activeProjectId)) {
            activeProjectId = activeProjects[0].id;
        }
    } catch (err) {
        console.error("Fehler beim Laden der Projekte:", err);
        if (window.loadLocalProjects) currentProjects = await window.loadLocalProjects();
    } finally {
        if (typeof window.renderProjectDropdowns === 'function') window.renderProjectDropdowns();
        if (typeof window.updateSidebarStats === 'function') window.updateSidebarStats();
        if (isAdmin && typeof window.renderAdminProjectList === 'function') window.renderAdminProjectList();
        if (typeof window.renderArchivedProjectsList === 'function') window.renderArchivedProjectsList();
    }
}

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Audit-Logs Abruf (Admin-Center)
 * EINFÜGEN IN: db.js (Abschnitt 1: Globale Daten-Abfragen)
 * Zeitstempel: 2026-08-31 17:40:00 CEST
 * Breadcrumbs:
 *   - [2026-08-31 17:40:00 CEST]: fetchAuditLogs implementiert, um ReferenceError
 *     beim Öffnen des Admin-Modals zu beheben.
 * =============================================================================
 */
async function fetchAuditLogs() {
    try {
        const { data, error } = await realDb
            .from('budget_audit_logs')
            .select('*')
            .order('changed_at', { ascending: false });

        if (error) throw error;
        currentAuditLogs = data || [];
    } catch (err) {
        console.warn("Audit-Logs konnten nicht geladen werden:", err);
        currentAuditLogs = [];
    } finally {
        if (typeof window.renderBudgetAuditLogs === 'function') {
            window.renderBudgetAuditLogs();
        }
    }
}
window.fetchAuditLogs = fetchAuditLogs;

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Canvas-Datenabfrage (Race-Condition Fix für lokale Dateien)
 * ERSETZEN IN: db.js (Funktionen getCurrentProject & fetchCanvasData)
 * Zeitstempel: 2026-08-30 11:15:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 10:50:00 CEST]: Bereinigung redundanter Deklarationen.
 *   - [2026-08-30 11:15:00 CEST]: loadedLocalProjectId eingeführt. Verhindert 
 *     permanentes Lesen von der Festplatte bei jedem UI-Update (Race Condition Fix). 
 *     Lokale Modifikationen (Löschen/Erstellen) sind nun augenblicklich.
 * =============================================================================
 */
function getCurrentProject() {
    return currentProjects.find(p => p.id === activeProjectId) || {
        object_number: 'OBJ-2026-01',
        name: 'Standard',
        total_budget_design: 100,
        total_budget_drafting: 60
    };
}

// Speichert, welches lokale Projekt aktuell im Arbeitsspeicher liegt
window.loadedLocalProjectId = null;

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Datenbank & State-Trennung (Cloud vs. Lokal)
 * ERSETZEN IN: db.js (Funktion fetchCanvasData)
 * Zeitstempel: 2026-08-31 17:50:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 11:15:00 CEST]: loadedLocalProjectId Caching.
 *   - [2026-08-31 17:50:00 CEST]: Beim Wechsel auf Cloud-Projekte werden
 *     isLocalFileOpen und localFileHandle zwingend entkoppelt.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Datenbank & State-Trennung (Auto-Admin bei lokalen Projekten)
 * ERSETZEN IN: db.js (Funktion fetchCanvasData)
 * Zeitstempel: 2026-08-31 17:58:00 CEST
 * Breadcrumbs:
 *   - [2026-08-31 17:50:00 CEST]: State-Trennung Cloud vs. Lokal.
 *   - [2026-08-31 17:58:00 CEST]: Automatisches Freischalten von isAdmin = true
 *     und Synchronisation des Schloss-Buttons bei lokalen Offline-Projekten.
 * =============================================================================
 */
window.fetchCanvasData = async function () {
    if (!activeProjectId) return;

    // 1. Lokaler Modus (Auto-Admin aktiv)
    if (activeProjectId.startsWith('local_')) {
        const proj = (currentProjects || []).find(p => p.id === activeProjectId);
        window.isLocalFileOpen = true;
        window.localFileHandle = proj ? proj.handle : null;

        // Auto-Admin für lokale Offline-Dateien aktivieren
        isAdmin = true;
        const adminBtn = document.getElementById('adminLockBtn');
        if (adminBtn) {
            adminBtn.classList.add('logged-in');
            adminBtn.textContent = '🔓';
            adminBtn.title = 'Erweiterte Optionen (In lokalen Projekten dauerhaft aktiv)';
        }

        if (window.loadedLocalProjectId !== activeProjectId) {
            if (proj && proj.handle) {
                try {
                    const perm = await proj.handle.queryPermission({ mode: 'readwrite' });
                    if (perm !== 'granted') {
                        const confirmRestore = await customConfirm('Lokaler Dateizugriff', `Bitte erlaube den Dateizugriff auf "${proj.name}", um das lokale Projekt zu laden.`, 'Zugriff Erlauben', 'Abbrechen');
                        if (confirmRestore) {
                            const req = await proj.handle.requestPermission({ mode: 'readwrite' });
                            if (req !== 'granted') throw new Error('Berechtigung verweigert');
                        } else {
                            throw new Error('Vom Nutzer abgebrochen');
                        }
                    }
                    const file = await proj.handle.getFile();
                    const text = await file.text();
                    window.processLoadedHtml(text, false);
                    window.loadedLocalProjectId = activeProjectId;
                } catch (e) {
                    console.error("Lokale Datei Fehler:", e);
                    showToast('Lokale HTML-Datei gelöscht oder Zugriff verweigert.', 'error');

                    if (window.localDB) {
                        const tx = window.localDB.transaction('projects', 'readwrite');
                        tx.objectStore('projects').delete(activeProjectId);
                    }
                    currentProjects = currentProjects.filter(p => p.id !== activeProjectId);
                    activeProjectId = currentProjects.find(p => !p.is_local && !p.is_archived)?.id;
                    if (typeof window.renderProjectDropdowns === 'function') window.renderProjectDropdowns();
                    fetchCanvasData();
                    return;
                }
            } else if (proj && !proj.handle) {
                window.loadedLocalProjectId = activeProjectId;
            }
        }

        if (window.renderCanvas) window.renderCanvas();
        if (window.updateSidebarStats) window.updateSidebarStats();
        if (window.renderSidebarZones) window.renderSidebarZones();
        if (isAdmin && window.renderPendingLogsTable) window.renderPendingLogsTable();
        return;
    }

    // 2. Cloud-Modus: Lokale Handles entkoppeln & Schloss-Button synchronisieren
    window.isLocalFileOpen = false;
    window.localFileHandle = null;
    window.loadedLocalProjectId = null;

    const adminBtn = document.getElementById('adminLockBtn');
    if (adminBtn) {
        if (isAdmin) {
            adminBtn.classList.add('logged-in');
            adminBtn.textContent = '🔓';
            adminBtn.title = 'Erweiterte Optionen freigeschaltet';
        } else {
            adminBtn.classList.remove('logged-in');
            adminBtn.textContent = '🔒';
            adminBtn.title = 'Erweiterte Optionen freischalten';
        }
    }

    const [nodesRes, edgesRes, zonesRes, logsRes, arrowsRes] = await Promise.all([
        realDb.from('project_nodes').select('*').eq('project_id', activeProjectId),
        realDb.from('project_edges').select('*').eq('project_id', activeProjectId),
        realDb.from('project_zones').select('*').eq('project_id', activeProjectId),
        realDb.from('time_logs').select('*').eq('project_id', activeProjectId).order('logged_at', { ascending: false }),
        realDb.from('zone_flow_arrows').select('*').eq('project_id', activeProjectId)
    ]);

    if (arrowsRes.error) console.error("Supabase Fehler beim Pfeile laden:", arrowsRes.error);
    if (window.isDraggingAnything) {
        window.pendingCanvasUpdate = true;
        return;
    }

    currentNodes = nodesRes.data || [];
    currentEdges = edgesRes.data || [];
    currentZones = zonesRes.data || [];
    currentTimeLogs = logsRes.data || [];
    window.currentFlowArrows = arrowsRes.data || [];

    if (window.renderCanvas) window.renderCanvas();
    if (window.updateSidebarStats) window.updateSidebarStats();
    if (window.renderSidebarZones) window.renderSidebarZones();
    if (isAdmin && window.renderPendingLogsTable) window.renderPendingLogsTable();
};

// =============================================================================
// 2. HIERARCHISCHE ROLLUP ENGINE (Child -> Parent Zeit-Aggregation)
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