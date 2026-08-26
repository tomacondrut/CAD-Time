/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Haupt-Bootstrap / Entry Point
 * ERSETZEN IN: app.js (Gesamte Datei)
 * Zeitstempel: 2026-08-26 20:25:00 CEST
 * Breadcrumbs:
 *   - [2026-08-23 15:00:00 CEST]: Initialer Start & Realtime-Sync.
 *   - [2026-08-23 16:30:00 CEST]: Hierarchische Sidebar-Zonen & Isolation.
 *   - [2026-08-26 20:25:00 CEST]: Auto-Login & Session-Restore aus localStorage,
 *     Syntax-Bereinigung und Schließen von initApp().
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
    // Notiz Formulare:
    addListenerIfEx('newNoteForm', 'submit', handleAddNote);
    addListenerIfEx('editNoteForm', 'submit', handleSaveNote);

    // Auto-Login Vorab-Prüfung: Overlay direkt verstecken, wenn Daten vorhanden
    const cachedUser = localStorage.getItem('cad_tm_user');
    const cachedProject = localStorage.getItem('cad_tm_project');

    if (cachedUser && cachedProject) {
        const overlay = document.getElementById('userLoginOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    // Initialer Datenabruf mit anschließendem Dropdown-Update & Auto-Login
    if (typeof fetchUsers === 'function' && typeof fetchProjects === 'function') {
        Promise.all([fetchUsers(), fetchProjects()]).then(() => {
            if (typeof renderUserDropdowns === 'function') renderUserDropdowns();
            if (typeof renderProjectDropdowns === 'function') renderProjectDropdowns();

            if (cachedUser && cachedProject && typeof confirmUserLogin === 'function') {
                const userSelect = document.getElementById('userSelectDropdown');
                const projSelect = document.getElementById('projectSelectLoginDropdown');
                if (userSelect) userSelect.value = cachedUser;
                if (projSelect) projSelect.value = cachedProject;

                confirmUserLogin();
            }
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
 * =============================================================================
 */
window.renderSidebarZones = function () {
    const container = document.getElementById('sidebarZonesContainer');
    if (!container) return;

    container.innerHTML = '';

    const getArea = (z) => (parseFloat(z.width) || 0) * (parseFloat(z.height) || 0);

    const topZones = currentZones
        .filter(z => !z.parent_zone_id)
        .sort((a, b) => getArea(b) - getArea(a));

    if (topZones.length === 0) {
        container.innerHTML = '<div style="font-size: 11px; color: #718096; padding-left: 10px;">Keine Bereiche definiert.</div>';
        return;
    }

    const renderZoneItem = (zone, isSubZone = false, parentHidden = false) => {
        const isSelfHidden = window.hiddenTopZoneIds && window.hiddenTopZoneIds.has(zone.id);
        const isEffectivelyHidden = isSelfHidden || parentHidden;

        const el = document.createElement('div');
        el.style.display = 'flex';
        el.style.justifyContent = 'space-between';
        el.style.alignItems = 'center';
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

window.toggleZoneVisibility = function (zoneId) {
    if (!window.hiddenTopZoneIds) window.hiddenTopZoneIds = new Set();

    if (window.hiddenTopZoneIds.has(zoneId)) {
        window.hiddenTopZoneIds.delete(zoneId);
    } else {
        window.hiddenTopZoneIds.add(zoneId);
    }

    if (typeof renderCanvas === 'function') renderCanvas();
    if (typeof renderSidebarZones === 'function') window.renderSidebarZones();
};

window.toggleIsolateZone = function (zoneId) {
    if (!window.hiddenTopZoneIds) window.hiddenTopZoneIds = new Set();

    const targetZone = currentZones.find(z => z.id === zoneId);
    if (!targetZone) return;

    const ancestors = new Set();
    let curr = targetZone;
    while (curr.parent_zone_id) {
        ancestors.add(curr.parent_zone_id);
        curr = currentZones.find(z => z.id === curr.parent_zone_id);
        if (!curr) break;
    }

    const descendants = new Set();
    const getDescendants = (parentId) => {
        currentZones.filter(z => z.parent_zone_id === parentId).forEach(child => {
            descendants.add(child.id);
            getDescendants(child.id);
        });
    };
    getDescendants(zoneId);

    const keepVisible = new Set([zoneId, ...ancestors, ...descendants]);

    let currentlyIsolated = true;
    currentZones.forEach(z => {
        if (keepVisible.has(z.id)) {
            if (window.hiddenTopZoneIds.has(z.id)) currentlyIsolated = false;
        } else {
            if (!window.isZoneHidden(z.id)) currentlyIsolated = false;
        }
    });

    window.hiddenTopZoneIds.clear();

    if (!currentlyIsolated) {
        currentZones.forEach(z => {
            if (!keepVisible.has(z.id)) {
                window.hiddenTopZoneIds.add(z.id);
            }
        });
    }

    if (typeof renderCanvas === 'function') renderCanvas();
    if (typeof renderSidebarZones === 'function') window.renderSidebarZones();

    setTimeout(() => {
        if (window.centerViewOnVisible) window.centerViewOnVisible(currentlyIsolated ? null : zoneId);
    }, 20);
};