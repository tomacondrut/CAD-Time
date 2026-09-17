/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Lokale Dateiverwaltung (Speichern, Backup, Laden, IndexedDB)
 * ERSETZEN IN: file_manager.js (Gesamte Datei)
 * Zeitstempel: 2026-08-30 11:15:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 10:30:00 CEST]: Abfrage von Objekt-Nr. und Projektname auf ein
 *     gemeinsames 2-Felder-Fenster (customPromptDual) konsolidiert.
 *   - [2026-08-30 11:15:00 CEST]: window.loadedLocalProjectId Zuweisung in allen
 *     Import/Erstellen Funktionen ergänzt, um Lade-Schleifen beim Speichern zu verhindern.
 * =============================================================================
 */

window.isLocalFileOpen = false;
window.localFileHandle = null;
window.localDB = null;
window.loadedLocalProjectId = null; // Neu: Hält das aktuell im RAM liegende Projekt

// IndexedDB initialisieren
window.initLocalDB = function () {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('CAD_Local_Projects', 1);
        req.onupgradeneeded = (e) => {
            e.target.result.createObjectStore('projects', { keyPath: 'id' });
        };
        req.onsuccess = (e) => {
            window.localDB = e.target.result;
            resolve();
        };
        req.onerror = () => reject();
    });
};

window.loadLocalProjects = async function () {
    if (!window.localDB) await window.initLocalDB();
    return new Promise((resolve) => {
        const tx = window.localDB.transaction('projects', 'readonly');
        const req = tx.objectStore('projects').getAll();
        req.onsuccess = () => resolve(req.result || []);
    });
};

// Neue Datei anlegen & Cachen (1 Fenster für beide Felder)
window.handleNewFile = async function () {
    const res = await customPromptDual(
        'Neues lokales Projekt',
        'Bitte Projektdaten für die lokale Datei angeben:',
        'Objekt-Nummer:',
        'OBJ-',
        'Projektname:',
        ''
    );
    if (!res || !res.val1 || !res.val2) return;

    const objNum = res.val1;
    const pName = res.val2;

    window.isLocalFileOpen = true;
    window.localFileHandle = null;

    currentNodes = [];
    currentEdges = [];
    currentZones = [];
    currentTimeLogs = [];
    window.currentFlowArrows = [];

    try {
        if (window.showSaveFilePicker) {
            window.localFileHandle = await window.showSaveFilePicker({
                suggestedName: `${objNum}_${pName.replace(/\s+/g, '_')}.html`,
                types: [{ description: 'CAD Time Manager', accept: { 'text/html': ['.html'] } }]
            });

            const localId = 'local_' + Date.now();
            const newProj = {
                id: localId,
                object_number: objNum,
                name: pName,
                total_budget_design: 100,
                total_budget_drafting: 60,
                is_local: true,
                handle: window.localFileHandle
            };

            if (!window.localDB) await window.initLocalDB();
            const tx = window.localDB.transaction('projects', 'readwrite');
            tx.objectStore('projects').put(newProj);

            activeProjectId = localId;
            window.loadedLocalProjectId = localId; // RAM ist jetzt aktuell
            currentProjects.unshift(newProj);

            await window.handleSaveFile(true);
            showToast('Lokales Projekt erstellt und gespeichert', 'success');

            if (typeof renderProjectDropdowns === 'function') renderProjectDropdowns();
            if (typeof fetchCanvasData === 'function') fetchCanvasData();
        } else {
            showToast('Dein Browser unterstützt das lokale Speichern nicht nativ.', 'error');
        }
    } catch (e) {
        if (e.name !== 'AbortError') console.error(e);
    }
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Lokale Dateiverwaltung (Strikte Projekt-Isolation beim Speichern)
 * ERSETZEN IN: file_manager.js (Funktion handleSaveFile)
 * Zeitstempel: 2026-08-31 17:50:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 11:15:00 CEST]: In-Place Save für lokale Dateien.
 *   - [2026-08-31 17:50:00 CEST]: isSupabaseProject strikt an activeProjectId
 *     gebunden. Verhindert versehentliches Überschreiben lokaler Dateien bei
 *     aktivem Cloud-Projekt.
 * =============================================================================
 */
window.handleSaveFile = async function (silent = false) {
    const isLocalActive = !!(window.activeProjectId && window.activeProjectId.startsWith('local_'));

    // Silent Auto-Save nur für lokale Offline-Dateien ausführen
    if (!isLocalActive && silent) return;

    const payload = {
        nodes: currentNodes || [],
        edges: currentEdges || [],
        zones: currentZones || [],
        logs: currentTimeLogs || [],
        arrows: window.currentFlowArrows || [],
        manager_layout: (typeof getManagerLayout === 'function') ? getManagerLayout() : null // <--- NEU
    };

    const jsonStr = JSON.stringify(payload);
    const currentUrl = window.location.href.split('?')[0];

    const htmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>CAD Time Manager - Lokale Datensicherung</title>
</head>
<body style="font-family: sans-serif; padding: 40px; text-align: center; background: #f0f4f8;">
    <h2>CAD Time Manager - Lokale Datei</h2>
    <p>Diese Datei enthält lokale Canvas-Informationen.</p>
    <a href="${currentUrl}" style="display:inline-block; padding: 10px 20px; background: #2b6cb0; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold;">App öffnen & Datei dort laden</a>
    <script id="cad-data" type="application/json">${jsonStr}</script>
</body>
</html>`;

    try {
        if (!isLocalActive) {
            // CLOUD-PROJEKT: Immer als neues HTML-Backup herunterladen (niemals lokale Files überschreiben)
            const proj = (typeof getCurrentProject === 'function') ? getCurrentProject() : { object_number: 'OBJ', name: 'Projekt' };
            const now = new Date();

            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const hourStr = String(now.getHours()).padStart(2, '0') + 'h';

            const safeName = (proj.name || 'Projekt').replace(/[^a-zA-Z0-9\-_ÄÖÜäöü]/g, '_');
            const suggestedName = `BACKUP_${proj.object_number || 'OBJ'}_${safeName}_${dateStr}_${hourStr}.html`;

            if (window.showSaveFilePicker) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: suggestedName,
                    types: [{ description: 'CAD Time Manager Backup', accept: { 'text/html': ['.html'] } }]
                });
                const writable = await handle.createWritable();
                await writable.write(htmlContent);
                await writable.close();
                showToast(`Backup erstellt: ${suggestedName}`, 'success');
            } else {
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = suggestedName;
                a.click();
                URL.revokeObjectURL(url);
                showToast(`Backup heruntergeladen: ${suggestedName}`, 'success');
            }
        } else {
            // LOKALES PROJEKT: Gezieltes In-Place Überschreiben des aktuellen Handles
            const currentProj = (currentProjects || []).find(p => p.id === activeProjectId);
            const handleToUse = currentProj ? currentProj.handle : window.localFileHandle;

            if (handleToUse) {
                const writable = await handleToUse.createWritable();
                await writable.write(htmlContent);
                await writable.close();
                if (!silent) showToast('Lokale Datei aktualisiert', 'success');
            } else if (!silent) {
                // Falls noch kein Dateizugriff hinterlegt ist, Picker aufrufen
                if (window.showSaveFilePicker) {
                    const safeName = (currentProj?.name || 'Projekt').replace(/\s+/g, '_');
                    const newHandle = await window.showSaveFilePicker({
                        suggestedName: `${currentProj?.object_number || 'OBJ'}_${safeName}.html`,
                        types: [{ description: 'CAD Time Manager', accept: { 'text/html': ['.html'] } }]
                    });
                    if (currentProj) currentProj.handle = newHandle;
                    window.localFileHandle = newHandle;

                    const writable = await newHandle.createWritable();
                    await writable.write(htmlContent);
                    await writable.close();
                    showToast('Lokale Datei gespeichert', 'success');
                } else {
                    showToast('Kein Dateizugriff für direktes Überschreiben vorhanden.', 'error');
                }
            }
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('Speichern fehlgeschlagen:', err);
            if (!silent) showToast('Fehler beim Speichern', 'error');
        }
    }
};

// Laden einer existierenden Datei (1 Fenster für beide Felder)
window.handleLoadFile = async function () {
    if (window.showOpenFilePicker) {
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{ description: 'HTML Dokument', accept: { 'text/html': ['.html'] } }]
            });

            const file = await fileHandle.getFile();
            const text = await file.text();

            window.processLoadedHtml(text, false);

            const res = await customPromptDual(
                'Datei ins Menü aufnehmen',
                'Bitte Projektdaten für diese lokale Datei festlegen:',
                'Objekt-Nummer:',
                'OBJ-IMPORT',
                'Projektname:',
                file.name.replace('.html', '')
            );

            if (res && res.val1 && res.val2) {
                const localId = 'local_' + Date.now();
                const newProj = {
                    id: localId,
                    object_number: res.val1,
                    name: res.val2,
                    total_budget_design: 100,
                    total_budget_drafting: 60,
                    is_local: true,
                    handle: fileHandle
                };

                if (!window.localDB) await window.initLocalDB();
                const tx = window.localDB.transaction('projects', 'readwrite');
                tx.objectStore('projects').put(newProj);

                activeProjectId = localId;
                window.loadedLocalProjectId = localId; // RAM ist aktuell
                currentProjects.unshift(newProj);
                window.isLocalFileOpen = true;
                window.localFileHandle = fileHandle;

                if (typeof renderProjectDropdowns === 'function') renderProjectDropdowns();
                if (typeof fetchCanvasData === 'function') fetchCanvasData();
                showToast('Lokale Datei geladen (Ohne Supabase-Sync)', 'success');
            }
        } catch (err) {
            if (err.name !== 'AbortError') console.error('Laden abgebrochen:', err);
        }
    } else {
        showToast('Dein Browser unterstützt das lokale Dateisystem nicht nativ.', 'error');
    }
};

window.processLoadedHtml = function (htmlText, triggerRender = true) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const scriptTag = doc.getElementById('cad-data');
    if (scriptTag) {
        try {
            const data = JSON.parse(scriptTag.textContent);
            currentNodes = data.nodes || [];
            currentEdges = data.edges || [];
            currentZones = data.zones || [];
            currentTimeLogs = data.logs || [];
            window.currentFlowArrows = data.arrows || [];

            // Manager-Layout aus Datei einlesen
            if (data.manager_layout && typeof saveManagerLayout === 'function') {
                saveManagerLayout(data.manager_layout);
            }

            if (triggerRender) {
                if (typeof renderCanvas === 'function') renderCanvas();
                if (typeof renderSidebarZones === 'function') renderSidebarZones();
                if (typeof updateSidebarStats === 'function') updateSidebarStats();
            }
        } catch (e) {
            showToast('Fehler beim Parsen der lokalen Datei', 'error');
        }
    } else {
        showToast('Keine gültigen CAD-Daten gefunden', 'error');
        throw new Error("Invalid CAD file");
    }
};

// Auto-Load Hook: Wenn die Datei doppelgeklickt wurde
document.addEventListener('DOMContentLoaded', () => {
    const importData = localStorage.getItem('cad_tm_local_import');
    if (importData) {
        try {
            const data = JSON.parse(importData);
            currentNodes = data.nodes || [];
            currentEdges = data.edges || [];
            currentZones = data.zones || [];
            currentTimeLogs = data.logs || [];
            window.currentFlowArrows = data.arrows || [];

            localStorage.removeItem('cad_tm_local_import');

            setTimeout(async () => {
                const res = await customPromptDual(
                    'Backup importieren',
                    'Projektdaten für dieses wiederhergestellte Projekt festlegen:',
                    'Objekt-Nummer:',
                    'OBJ-BACKUP',
                    'Projektname:',
                    'Wiederhergestellt'
                );

                if (res && res.val1 && res.val2) {
                    const localId = 'local_' + Date.now();
                    const newProj = {
                        id: localId,
                        object_number: res.val1,
                        name: res.val2,
                        total_budget_design: 100,
                        total_budget_drafting: 60,
                        is_local: true,
                        handle: null
                    };

                    if (!window.localDB) await window.initLocalDB();
                    const tx = window.localDB.transaction('projects', 'readwrite');
                    tx.objectStore('projects').put(newProj);

                    activeProjectId = localId;
                    window.loadedLocalProjectId = localId; // RAM ist aktuell
                    currentProjects.unshift(newProj);
                    window.isLocalFileOpen = true;

                    if (typeof renderProjectDropdowns === 'function') renderProjectDropdowns();
                    if (typeof fetchCanvasData === 'function') fetchCanvasData();
                    showToast('Backup als lokales Projekt geladen', 'success');
                } else {
                    showToast('Import abgebrochen.', 'info');
                }
            }, 600);

        } catch (e) {
            console.error(e);
        }
    }
});