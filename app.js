/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Haupt-Bootstrap / Entry Point
 * Zeitstempel: 2026-08-23 15:00:00 CEST
 * =============================================================================
 */

function initApp() {
    if (typeof initPanzoom === 'function') initPanzoom();
    if (typeof renderColorPresets === 'function') renderColorPresets();
    if (typeof renderZoneColorPresets === 'function') renderZoneColorPresets();

    // Dialog Input: Bestätigen per ENTER
    const dlgInput = document.getElementById('dialogInput');
    if (dlgInput) {
        dlgInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                closeDialog(true);
            }
        });
    }

    // Kontextmenü bei Klick irgendwo schließen
    window.addEventListener('click', () => {
        const menu = document.getElementById('canvasContextMenu');
        if (menu) menu.style.display = 'none';
    });

    // Event Listener für Formulare und Modals
    const addListenerIfEx = (id, event, handler) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
    };

    addListenerIfEx('newBlockForm', 'submit', handleAddBlock);
    addListenerIfEx('newZoneForm', 'submit', handleAddZone);
    addListenerIfEx('editZoneForm', 'submit', handleSaveZoneConfig);
    addListenerIfEx('configForm', 'submit', handleSaveConfig);
    addListenerIfEx('btnDeleteBlock', 'click', handleDeleteNode);
    addListenerIfEx('retroLogForm', 'submit', handleSaveRetroLog);
    addListenerIfEx('adminProjectForm', 'submit', handleSaveProject);

    /**
     * Breadcrumb: [2026-08-23] Sicherer Start, unabhängig vom DOMContentLoaded-Timing.
     */
    // Initialer Datenabruf mit anschließendem Dropdown-Update
    if (typeof fetchUsers === 'function' && typeof fetchProjects === 'function') {
        Promise.all([fetchUsers(), fetchProjects()]).then(() => {
            if (typeof renderUserDropdowns === 'function') renderUserDropdowns();
            if (typeof renderProjectDropdowns === 'function') renderProjectDropdowns();
        });
    }

    // Realtime-Updates
    if (typeof db !== 'undefined' && db.channel) {
        db.channel('realtime-all')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => {
                if (typeof fetchCanvasData === 'function') fetchCanvasData();
                if (typeof fetchUsers === 'function') fetchUsers();
                if (typeof fetchProjects === 'function') fetchProjects();
            })
            .subscribe();
    }
}

// =============================================================================
// SICHERER START-MECHANISMUS
// Führt initApp sofort aus, wenn das DOM schon fertig ist, ansonsten wartet es.
// =============================================================================
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Sidebar Zonen-Rendering & Hierarchische Isolation
 * Breadcrumbs:
 *   - [2026-08-23] Hierarchieebene für Zonen in der Sidebar hinzugefügt.
 *     Untergeordnete Bereiche werden eingerückt unter dem Hauptrahmen dargestellt.
 *   - [2026-08-23] Intelligente Isolation (toggleIsolateZone): Ancestors (Eltern)
 *     und Descendants (Kinder) bleiben sichtbar, wenn ein Element isoliert wird.
 * =============================================================================
 */

window.renderSidebarZones = function() {
    const container = document.getElementById('sidebarZonesContainer');
    if (!container) return;

    container.innerHTML = '';

    // Hilfsfunktion zur Flächenberechnung für Sortierung
    const getArea = (z) => (parseFloat(z.width) || 0) * (parseFloat(z.height) || 0);

    // Top-Level Zonen nach Größe ABSTEIGEND sortieren
    const topZones = currentZones
        .filter(z => !z.parent_zone_id)
        .sort((a, b) => getArea(b) - getArea(a));

    if (topZones.length === 0) {
        container.innerHTML = '<div style="font-size: 11px; color: #718096; padding-left: 10px;">Keine Bereiche definiert.</div>';
        return;
    }

    // Rekursive (oder 2-stufige) Rendering-Funktion
    const renderZoneItem = (zone, isSubZone = false, parentHidden = false) => {
        const isSelfHidden = window.hiddenTopZoneIds && window.hiddenTopZoneIds.has(zone.id);
        const isEffectivelyHidden = isSelfHidden || parentHidden;

        const el = document.createElement('div');
        el.style.display = 'flex';
        el.style.justifyContent = 'space-between';
        el.style.alignItems = 'center';
        // Optische Einrückung für Untergeordnete Bereiche
        el.style.padding = isSubZone ? '4px 10px 4px 24px' : '6px 10px';
        el.style.background = isSubZone ? 'transparent' : '#2d3748';
        el.style.borderRadius = '4px';
        el.style.fontSize = isSubZone ? '11px' : '12px';
        el.style.color = isEffectivelyHidden ? '#718096' : '#e2e8f0';
        el.style.borderLeft = isSubZone ? `2px solid ${zone.color_hex || '#a0aec0'}` : 'none';
        el.style.marginBottom = isSubZone ? '2px' : '4px';

        el.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="color:${zone.color_hex || '#a0aec0'}; font-size: ${isSubZone ? '10px' : '14px'};">${isSubZone ? '└' : '■'}</span>
                <span style="cursor:pointer; ${isEffectivelyHidden ? 'text-decoration:line-through;' : ''}" onclick="centerViewOnVisible('${zone.id}')">${escapeHtml(zone.title)}</span>
            </div>
            <div style="display:flex; gap:6px;">
                <button title="Sichtbarkeit umschalten" onclick="toggleZoneVisibility('${zone.id}')" style="background:none; border:none; cursor:pointer; opacity: ${isEffectivelyHidden ? '0.5' : '1'};">👁️</button>
                <button title="Nur diesen Bereich isolieren" onclick="toggleIsolateZone('${zone.id}')" style="background:none; border:none; cursor:pointer; opacity: ${isEffectivelyHidden ? '0.5' : '1'};">🎯</button>
            </div>
        `;
        container.appendChild(el);

        // Suche eine Hierarchieebene tiefer nach Kindern
        if (!isSubZone) {
            const childZones = currentZones
                .filter(z => z.parent_zone_id === zone.id)
                .sort((a, b) => getArea(b) - getArea(a));

            childZones.forEach(child => {
                renderZoneItem(child, true, isEffectivelyHidden);
            });
        }
    };

    topZones.forEach(zone => {
        renderZoneItem(zone, false, false);
    });
};
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Sidebar & Isolation Logic
 * ERSETZEN IN: app.js
 * Update: Robuste Statusabfrage für das Isolieren von Zonen
 * =============================================================================
 */

// Schaltet die Sichtbarkeit einer einzelnen Zone um
window.toggleZoneVisibility = function(zoneId) {
    if (!window.hiddenTopZoneIds) window.hiddenTopZoneIds = new Set();

    if (window.hiddenTopZoneIds.has(zoneId)) {
        window.hiddenTopZoneIds.delete(zoneId);
    } else {
        window.hiddenTopZoneIds.add(zoneId);
    }

    if (typeof renderCanvas === 'function') renderCanvas();
    if (typeof renderSidebarZones === 'function') window.renderSidebarZones();
};

// Isoliert eine Zone (blendet alle anderen aus) oder hebt Isolation auf
window.toggleIsolateZone = function(zoneId) {
    if (!window.hiddenTopZoneIds) window.hiddenTopZoneIds = new Set();

    const targetZone = currentZones.find(z => z.id === zoneId);
    if (!targetZone) return;

    // 1. Alle übergeordneten Eltern-Rahmen ermitteln (müssen sichtbar bleiben)
    const ancestors = new Set();
    let curr = targetZone;
    while (curr.parent_zone_id) {
        ancestors.add(curr.parent_zone_id);
        curr = currentZones.find(z => z.id === curr.parent_zone_id);
        if (!curr) break;
    }

    // 2. Alle untergeordneten Kind-Rahmen ermitteln (sollen sichtbar bleiben)
    const descendants = new Set();
    const getDescendants = (parentId) => {
        currentZones.filter(z => z.parent_zone_id === parentId).forEach(child => {
            descendants.add(child.id);
            getDescendants(child.id);
        });
    };
    getDescendants(zoneId);

    // Diese IDs dürfen für die Isolation NICHT ausgeblendet werden
    const keepVisible = new Set([zoneId, ...ancestors, ...descendants]);

    // 3. Prüfen: Ist diese Konstellation bereits isoliert?
    let currentlyIsolated = true;
    currentZones.forEach(z => {
        if (keepVisible.has(z.id)) {
            // Darf nicht ausgeblendet sein
            if (window.hiddenTopZoneIds.has(z.id)) currentlyIsolated = false;
        } else {
            // Muss ausgeblendet sein
            if (!window.isZoneHidden(z.id)) currentlyIsolated = false;
        }
    });

    window.hiddenTopZoneIds.clear();

    // 4. Isolation anwenden oder aufheben
    if (!currentlyIsolated) {
        // Isoliere: Alle Ausblenden, die nicht auf der keepVisible-Liste stehen
        currentZones.forEach(z => {
            if (!keepVisible.has(z.id)) {
                window.hiddenTopZoneIds.add(z.id);
            }
        });
    }

    if (typeof renderCanvas === 'function') renderCanvas();
    if (typeof renderSidebarZones === 'function') window.renderSidebarZones();

    // Smooth scroll zum sichtbaren Bereich
    setTimeout(() => {
        if (window.centerViewOnVisible) window.centerViewOnVisible(currentlyIsolated ? null : zoneId);
    }, 20);
};