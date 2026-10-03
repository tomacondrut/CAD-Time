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
 * Projekt: CAD Time Manager
 * Domain: Baugruppen-Farbkategorien (Supabase-Master mit lokalem Cache)
 * ERSETZEN IN: db.js (Abschnitt Farbpaletten & Kategorien)
 * Zeitstempel: 2026-09-26 11:05:00 CEST
 * Breadcrumbs:
 *   - [2026-08-29 21:15:00 CEST]: Statische Farbkreis-Sortierung.
 *   - [2026-09-26 10:45:00 CEST]: Umstellung von reinen Farben auf Baugruppen-
 *     Zugehörigkeiten (Förderbänder, Bandelemente, Antriebsstationen, Knicke, Schurren etc.).
 *   - [2026-09-26 11:05:00 CEST]: Supabase-Tabelle 'app_config' als zentrale Master-DB
 *     mit Spalte 'updated_at' verknüpft; doppelten Initial-Fetch bereinigt.
 * =============================================================================
 */

window.DEFAULT_COLOR_PRESETS = [
    { name: 'Förderbänder', hex: '#2563eb' },
    { name: 'Bandelemente', hex: '#ea580c' },
    { name: 'Antriebsstationen', hex: '#dc2626' },
    { name: 'Spannstationen', hex: '#7c3aed' },
    { name: 'Knicke', hex: '#c026d3' },
    { name: 'Schurren', hex: '#eab308' },
    { name: 'Abstützungen', hex: '#16a34a' },
    { name: 'Sonstiges / Allgemein', hex: '#4b5563' }
];

// 1. Initialer Stand (Cache oder Werkseinstellung)
window.COLOR_PRESETS = JSON.parse(localStorage.getItem('cad_tm_color_categories')) || window.DEFAULT_COLOR_PRESETS;

// 2. Asynchroner Abruf aus Supabase Master-Tabelle
window.fetchColorCategories = async function () {
    try {
        const client = (typeof realDb !== 'undefined') ? realDb : db;
        const { data, error } = await client.from('app_config').select('value').eq('key', 'color_categories').single();
        if (!error && data && data.value) {
            const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
            if (Array.isArray(parsed) && parsed.length > 0) {
                window.COLOR_PRESETS = parsed;
                localStorage.setItem('cad_tm_color_categories', JSON.stringify(parsed));

                // UI sofort mit den aktuellen Server-Daten aktualisieren
                if (typeof renderColorPresets === 'function') renderColorPresets();
                if (typeof renderZoneColorPresets === 'function') renderZoneColorPresets();
                if (typeof renderCanvas === 'function') renderCanvas();
            }
        }
    } catch (e) {
        console.warn("Kategorien aus Cache/Default geladen (Supabase nicht erreichbar).", e);
    }
};

// 3. Speichern direkt in Supabase
window.saveColorCategories = async function (categories) {
    window.COLOR_PRESETS = categories;
    localStorage.setItem('cad_tm_color_categories', JSON.stringify(categories));

    try {
        const client = (typeof realDb !== 'undefined') ? realDb : db;
        await client.from('app_config').upsert({
            key: 'color_categories',
            value: JSON.stringify(categories),
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
    } catch (e) {
        console.warn("Fehler beim Speichern in Supabase (nur Cache aktiv):", e);
    }

    if (typeof renderColorPresets === 'function') renderColorPresets();
    if (typeof renderZoneColorPresets === 'function') renderZoneColorPresets();
    if (typeof renderCanvas === 'function') renderCanvas();
};

// Genau ein initialer Abruf beim Laden
window.fetchColorCategories();

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

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Globale Datenabfragen (Benutzer laden & synchronisieren)
 * ERSETZEN IN: db.js (Funktion fetchUsers)
 * Zeitstempel: 2026-08-31 18:35:00 CEST
 * Breadcrumbs:
 *   - [2026-08-31 18:35:00 CEST]: fetchUsers gegen fehlende Tabellen abgesichert
 *     und direkte UI-Befüllung garantiert.
 * =============================================================================
 */
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
window.fetchUsers = fetchUsers;

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
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Datenbank & State-Trennung (Sicheres Admin-Reset beim Cloud-Wechsel)
 * ERSETZEN IN: db.js (Funktion fetchCanvasData)
 * Zeitstempel: 2026-08-31 18:30:00 CEST
 * Breadcrumbs:
 *   - [2026-08-31 17:58:00 CEST]: Auto-Admin bei lokalen Projekten.
 *   - [2026-08-31 18:30:00 CEST]: isAdmin wird beim Wechsel zurück in ein Cloud-Projekt
 *     zwingend auf false zurückgesetzt und das Schloss verriegelt.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Datenbank & State-Synchronisation (Persistenter Admin-Status)
 * ERSETZEN IN: db.js (Funktion fetchCanvasData)
 * Zeitstempel: 2026-09-01 17:40:00 CEST
 * Breadcrumbs:
 *   - [2026-08-31 18:30:00 CEST]: Auto-Admin bei lokalen Projekten.
 *   - [2026-09-01 17:40:00 CEST]: Ungewolltes Zurücksetzen von isAdmin = false 
 *     bei Cloud-Syncs entfernt. Admin-Status bleibt über Aktionen hinweg aktiv.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Datenbank (Crash-Proof Cloud-Abruf mit isoliertem Snapshot-Laden)
 * ERSETZEN IN: db.js (Funktion window.fetchCanvasData komplett ersetzen)
 * Zeitstempel: 2026-09-27 16:30:00 CEST
 * Breadcrumbs:
 *   - [2026-09-27 16:15:00 CEST]: project_snapshots in Promise.all aufgenommen.
 *   - [2026-09-27 16:30:00 CEST]: CRASH-FIX: project_snapshots aus Promise.all 
 *     entkoppelt und in eigenen try/catch gelegt. Verhindert, dass eine fehlende 
 *     Supabase-Tabelle das Laden von Baugruppen und Rahmen blockiert.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Datenbank (Crash-Proof Cloud-Abruf mit isoliertem Snapshot-Laden)
 * ERSETZEN IN: db.js (Block window.fetchCanvasData bis vor calculateRollups)
 * Zeitstempel: 2026-09-27 16:35:00 CEST
 * Breadcrumbs:
 *   - [2026-09-27 16:15:00 CEST]: project_snapshots in Promise.all integriert.
 *   - [2026-09-27 16:30:00 CEST]: Snapshots defensiv entkoppelt.
 *   - [2026-09-27 16:35:00 CEST]: SYNTAX-REPAIR: Verwaistes Top-Level-Fragment 
 *     aus Iteration 16:15 (await Promise.all außerhalb async) restlos entfernt.
 * =============================================================================
 */
window.fetchCanvasData = async function () {
    if (!activeProjectId) return;

    // 1. Lokaler Modus (Auto-Admin aktiv)
    if (activeProjectId.startsWith('local_')) {
        const proj = (currentProjects || []).find(p => p.id === activeProjectId);
        window.isLocalFileOpen = true;
        window.localFileHandle = proj ? proj.handle : null;

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
                        const confirmRestore = await customConfirm(
                            'Lokaler Dateizugriff',
                            `Bitte erlaube den Dateizugriff auf "${proj.name}", um das lokale Projekt zu laden.`,
                            'Zugriff Erlauben',
                            'Abbrechen'
                        );
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

    // 2. Cloud-Modus: Lokale Handles entkoppeln
    window.isLocalFileOpen = false;
    window.localFileHandle = null;
    window.loadedLocalProjectId = null;

    // A. Kern-Elemente laden (geschützt gegen Abbrüche)
    try {
        const [nodesRes, edgesRes, zonesRes, logsRes, arrowsRes] = await Promise.all([
            realDb.from('project_nodes').select('*').eq('project_id', activeProjectId),
            realDb.from('project_edges').select('*').eq('project_id', activeProjectId),
            realDb.from('project_zones').select('*').eq('project_id', activeProjectId),
            realDb.from('time_logs').select('*').eq('project_id', activeProjectId).order('logged_at', { ascending: false }),
            realDb.from('zone_flow_arrows').select('*').eq('project_id', activeProjectId)
        ]);

        if (arrowsRes && arrowsRes.error) console.error("Supabase Fehler beim Pfeile laden:", arrowsRes.error);
        if (window.isDraggingAnything) {
            window.pendingCanvasUpdate = true;
            return;
        }

        currentNodes = (nodesRes && nodesRes.data) ? nodesRes.data : [];
        currentEdges = (edgesRes && edgesRes.data) ? edgesRes.data : [];
        currentZones = (zonesRes && zonesRes.data) ? zonesRes.data : [];
        currentTimeLogs = (logsRes && logsRes.data) ? logsRes.data : [];
        window.currentFlowArrows = (arrowsRes && arrowsRes.data) ? arrowsRes.data : [];
    } catch (err) {
        console.error("Fehler beim Laden der Canvas-Daten aus Supabase:", err);
    }

    // =============================================================================
    // Projekt: CAD Time Manager
    // Domain: Datenbank (Snapshot-Laden mit Fehler-Prüfung)
    // ERSETZEN IN: db.js (Am Ende von window.fetchCanvasData)
    // Zeitstempel: 2026-09-27 16:50:00 CEST
    // Breadcrumbs:
    //   - [2026-09-27 16:30:00 CEST]: Defensiver try/catch ohne error-Log.
    //   - [2026-09-27 16:50:00 CEST]: snapsRes.error explizit abfragen, um RLS- oder
    //     Berechtigungsfehler von Supabase sofort in der Browser-Konsole zu sehen.
    // =============================================================================

    // B. Snapshots separat & defensiv abfragen
    try {
        const snapsRes = await realDb
            .from('project_snapshots')
            .select('*')
            .eq('project_id', activeProjectId)
            .order('review_date', { ascending: false });

        if (snapsRes.error) {
            console.error("Fehler beim Laden der Snapshots aus Supabase:", snapsRes.error);
        } else if (snapsRes.data) {
            window.currentSnapshots = snapsRes.data;
        }
    } catch (e) {
        console.warn("project_snapshots Verbindungsfehler:", e);
        if (!window.currentSnapshots) window.currentSnapshots = [];
    }

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

/**
* =============================================================================
* Projekt: CAD Time Manager
* Domain: Datenbank & State (Review-Snapshots Engine)
* EINFÜGEN IN: db.js (Am Dateiende)
* Zeitstempel: 2026-09-27 15:50:00 CEST
* Breadcrumb: [2026-09-27] window.currentSnapshots initialisiert und 
* createProjectSnapshot mit Stichtags-Rekonstruktion implementiert.
* =============================================================================
*/

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Datenbank & State (Review-Snapshots Engine mit CRUD & Listen-Sync)
 * ERSETZEN IN: db.js (Ab window.currentSnapshots bis Dateiende)
 * Zeitstempel: 2026-10-03 08:50:00 CEST
 * Breadcrumbs:
 *   - [2026-09-27 15:50:00 CEST]: Basis-Snapshot Einfrieren & Rekonstruktion.
 *   - [2026-09-27 16:45:00 CEST]: Fehler-Logging Supabase & Mock-Support.
 *   - [2026-10-03 08:50:00 CEST]: CRUD komplettiert:
 *     1. renderSnapshotList(): Baut Liste mit ✏️ Edit und ✕ Delete.
 *     2. startEditSnapshot() & cancelEditSnapshot(): Formular-Umschaltung.
 *     3. handleSaveSnapshot(): Prüft snapshotEditId für Update vs. Neu-Erstellung.
 *     4. handleDeleteSnapshot(): Revisionssicheres Löschen (Cloud/Lokal) mit Rechteprüfung.
 *     5. BUGFIX-GUARD: Dropdowns in der Auswertung (#repSelectSnapshotA/B) 
 *        werden nach jeder Änderung sofort synchronisiert.
 * =============================================================================
 */

window.currentSnapshots = [];

window.openCreateSnapshotModal = function () {
    window.cancelEditSnapshot();
    window.renderSnapshotList();
    openModal('createSnapshotModal');
};

window.renderSnapshotList = function () {
    const container = document.getElementById('snapshotListContainer');
    if (!container) return;

    container.innerHTML = '';
    const snapshots = window.currentSnapshots || [];

    if (snapshots.length === 0) {
        container.innerHTML = '<div style="font-size:11px; color:#718096; padding:10px; text-align:center;">Noch keine Review-Snapshots für dieses Projekt vorhanden.</div>';
        return;
    }

    snapshots.forEach(s => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; font-size:11px; padding:6px 8px; border-bottom:1px solid #edf2f7; background:#fff; margin-bottom:2px; border-radius:4px;';

        const dFormatted = s.review_date ? new Date(s.review_date).toLocaleDateString('de-DE') : '-';
        const creator = s.created_by || 'COT';
        const canDelete = isAdmin || (activeUserCode && activeUserCode === creator);

        row.innerHTML = `
            <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:8px; flex:1;">
                <span style="font-weight:bold; color:#2b6cb0;">🚩 ${escapeHtml(s.title)}</span>
                <span style="color:#718096; margin-left:6px;">[${dFormatted} · von ${escapeHtml(creator)}]</span>
                ${s.note ? `<div style="font-size:10px; color:#a0aec0; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(s.note)}</div>` : ''}
            </div>
            <div style="display:flex; gap:6px; align-items:center; flex-shrink:0;">
                <button type="button" class="btn-sec" style="padding:2px 6px; font-size:10px;" onclick="window.startEditSnapshot('${s.id}')" title="Bezeichnung, Datum oder Notiz bearbeiten">✏️ Edit</button>
                ${canDelete ? `<span style="color:#e53e3e; cursor:pointer; font-weight:bold; font-size:13px; padding:0 4px;" title="Snapshot löschen" onclick="window.handleDeleteSnapshot('${s.id}')">✕</span>` : ''}
            </div>
        `;
        container.appendChild(row);
    });
};

window.startEditSnapshot = function (snapshotId) {
    const snap = (window.currentSnapshots || []).find(s => s.id === snapshotId);
    if (!snap) return;

    const editIdInput = document.getElementById('snapshotEditId');
    const titleInput = document.getElementById('snapshotTitle');
    const dateInput = document.getElementById('snapshotDate');
    const noteInput = document.getElementById('snapshotNote');
    const btnSubmit = document.getElementById('btnSubmitSnapshot');
    const btnCancelEdit = document.getElementById('btnCancelEditSnapshot');
    const formTitle = document.getElementById('snapshotFormLegend');

    if (editIdInput) editIdInput.value = snap.id;
    if (titleInput) titleInput.value = snap.title;
    if (dateInput && snap.review_date) {
        dateInput.value = snap.review_date.split('T')[0];
    }
    if (noteInput) noteInput.value = snap.note || '';

    if (btnSubmit) {
        btnSubmit.textContent = '💾 Änderungen speichern';
        btnSubmit.style.background = '#2b6cb0';
    }
    if (btnCancelEdit) btnCancelEdit.style.display = 'inline-block';
    if (formTitle) formTitle.textContent = `Snapshot bearbeiten: "${snap.title}"`;
};

window.cancelEditSnapshot = function () {
    const editIdInput = document.getElementById('snapshotEditId');
    const titleInput = document.getElementById('snapshotTitle');
    const dateInput = document.getElementById('snapshotDate');
    const noteInput = document.getElementById('snapshotNote');
    const btnSubmit = document.getElementById('btnSubmitSnapshot');
    const btnCancelEdit = document.getElementById('btnCancelEditSnapshot');
    const formTitle = document.getElementById('snapshotFormLegend');

    if (editIdInput) editIdInput.value = '';
    if (titleInput) titleInput.value = `Review Stand ${new Date().toLocaleDateString('de-DE')}`;
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    if (noteInput) noteInput.value = '';

    if (btnSubmit) {
        btnSubmit.textContent = '🚩 Snapshot einfrieren';
        btnSubmit.style.background = '#2b6cb0';
    }
    if (btnCancelEdit) btnCancelEdit.style.display = 'none';
    if (formTitle) formTitle.textContent = '+ Neuen Review-Snapshot erstellen';
};

window.handleSaveSnapshot = async function (e) {
    e.preventDefault();
    const editId = document.getElementById('snapshotEditId')?.value || '';
    const title = document.getElementById('snapshotTitle').value.trim();
    const dateVal = document.getElementById('snapshotDate').value;
    const note = document.getElementById('snapshotNote').value.trim();

    if (!title || !dateVal) return;

    const cutoffDate = new Date(dateVal + 'T23:59:59.999Z');
    const isLocalActive = !!(window.activeProjectId && window.activeProjectId.startsWith('local_'));

    // FALL 1: BESTEHENDEN SNAPSHOT AKTUALISIEREN
    if (editId) {
        const snap = (window.currentSnapshots || []).find(s => s.id === editId);
        if (!snap) return;

        snap.title = title;
        snap.note = note;
        snap.review_date = cutoffDate.toISOString();

        if (isLocalActive) {
            if (typeof window.handleSaveFile === 'function') window.handleSaveFile(true);
        } else {
            const { error } = await realDb.from('project_snapshots').update({
                title: snap.title,
                note: snap.note,
                review_date: snap.review_date
            }).eq('id', editId);

            if (error) {
                console.error("Fehler beim Aktualisieren des Snapshots:", error);
                showToast("Fehler beim Aktualisieren: " + error.message, "error");
                return;
            }
        }

        showToast(`Snapshot "${title}" aktualisiert`, 'success');
        window.cancelEditSnapshot();
        window.renderSnapshotList();

        // Dropdowns in Auswertung sofort aktualisieren
        if (typeof handleTimeframeChange === 'function') handleTimeframeChange();
        return;
    }

    // FALL 2: NEUEN SNAPSHOT EINFRIEREN
    const nodeStatsAtDate = {};
    const zoneStatsAtDate = {};

    (currentTimeLogs || []).forEach(l => {
        if (new Date(l.logged_at) <= cutoffDate) {
            const hrs = parseFloat(l.hours) || 0;
            if (l.node_id) {
                if (!nodeStatsAtDate[l.node_id]) nodeStatsAtDate[l.node_id] = { d: 0, dr: 0 };
                if (l.task_type === 'design') nodeStatsAtDate[l.node_id].d += hrs;
                if (l.task_type === 'drafting') nodeStatsAtDate[l.node_id].dr += hrs;
            }
            if (l.zone_id) {
                if (!zoneStatsAtDate[l.zone_id]) zoneStatsAtDate[l.zone_id] = { d: 0, dr: 0 };
                if (l.task_type === 'design') zoneStatsAtDate[l.zone_id].d += hrs;
                if (l.task_type === 'drafting') zoneStatsAtDate[l.zone_id].dr += hrs;
            }
        }
    });

    const proj = getCurrentProject();
    const snapshotData = {
        project_budgets: {
            design: parseFloat(proj.total_budget_design) || 0,
            drafting: parseFloat(proj.total_budget_drafting) || 0
        },
        nodes: (currentNodes || []).map(n => ({
            id: n.id,
            name: n.name,
            doc_number: n.doc_number,
            article_number: n.article_number,
            block_type: n.block_type,
            zone_id: n.zone_id,
            linked_id: n.linked_id,
            budget_design: parseFloat(n.budget_design_hours) || 0,
            budget_drafting: parseFloat(n.budget_drafting_hours) || 0,
            progress_design: n.progress_design || 0,
            progress_drafting: n.progress_drafting || 0,
            completion_status: n.completion_status || 'open',
            spent_design: nodeStatsAtDate[n.id]?.d || 0,
            spent_drafting: nodeStatsAtDate[n.id]?.dr || 0
        })),
        zones: (currentZones || []).map(z => ({
            id: z.id,
            title: z.title,
            doc_number: z.doc_number,
            article_number: z.article_number,
            parent_zone_id: z.parent_zone_id,
            budget_design: parseFloat(z.budget_design_hours) || 0,
            budget_drafting: parseFloat(z.budget_drafting_hours) || 0,
            spent_design: zoneStatsAtDate[z.id]?.d || 0,
            spent_drafting: zoneStatsAtDate[z.id]?.dr || 0
        }))
    };

    const newSnapshot = {
        id: 'snap_' + Date.now(),
        project_id: activeProjectId,
        title,
        review_date: cutoffDate.toISOString(),
        created_by: activeUserCode || 'COT',
        note,
        snapshot_data: snapshotData
    };

    if (isLocalActive) {
        window.currentSnapshots.unshift(newSnapshot);
        if (typeof window.handleSaveFile === 'function') window.handleSaveFile(true);
    } else {
        const { error } = await realDb.from('project_snapshots').insert([newSnapshot]);
        if (error) {
            console.error("Supabase Snapshot Insert Fehler:", error);
            showToast("Fehler beim Speichern in Supabase: " + error.message, "error");
            return;
        }
        window.currentSnapshots.unshift(newSnapshot);
    }

    showToast(`Snapshot "${title}" dauerhaft gespeichert`, 'success');
    window.cancelEditSnapshot();
    window.renderSnapshotList();

    if (typeof handleTimeframeChange === 'function') handleTimeframeChange();
};

window.handleDeleteSnapshot = async function (snapshotId) {
    const snap = (window.currentSnapshots || []).find(s => s.id === snapshotId);
    if (!snap) return;

    const canDelete = isAdmin || (activeUserCode && activeUserCode === snap.created_by);
    if (!canDelete) {
        showToast('Keine Berechtigung: Nur Ersteller oder Admin dürfen Snapshots löschen.', 'error');
        return;
    }

    const confirmed = typeof customConfirm === 'function'
        ? await customConfirm('Snapshot löschen', `Möchtest du den Snapshot "${snap.title}" wirklich entfernen?`)
        : confirm(`Möchtest du den Snapshot "${snap.title}" wirklich entfernen?`);

    if (!confirmed) return;

    const isLocalActive = !!(window.activeProjectId && window.activeProjectId.startsWith('local_'));
    if (isLocalActive) {
        window.currentSnapshots = window.currentSnapshots.filter(s => s.id !== snapshotId);
        if (typeof window.handleSaveFile === 'function') window.handleSaveFile(true);
    } else {
        const { error } = await realDb.from('project_snapshots').delete().eq('id', snapshotId);
        if (error) {
            console.error("Fehler beim Löschen des Snapshots in Supabase:", error);
            showToast("Fehler beim Löschen: " + error.message, "error");
            return;
        }
        window.currentSnapshots = window.currentSnapshots.filter(s => s.id !== snapshotId);
    }

    showToast(`Snapshot "${snap.title}" gelöscht`, 'success');
    window.cancelEditSnapshot();
    window.renderSnapshotList();

    if (typeof handleTimeframeChange === 'function') handleTimeframeChange();
};