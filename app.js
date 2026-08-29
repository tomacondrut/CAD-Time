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
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Sidebar Zonen-Rendering (Classic Tree & Robuste Drag/Drop Reorder)
 * ERSETZEN IN: app.js (Funktion renderSidebarZones)
 * Zeitstempel: 2026-08-28 22:25:00 CEST
 * Breadcrumbs:
 *   - [2026-08-28 22:15:00 CEST]: 1. Klassische Baumstruktur (Tree-Branches) anstelle
 *     von dicken Farbrändern. 2. Drag & Drop repariert durch echte DOM-Verschachtelung 
 *     (Sub-Zonen leben in eigenen Containern).
 * =============================================================================
 */

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Sidebar Zonen-Rendering, Hierarchische Isolation & Sichtbarkeit
 * ERSETZEN IN: app.js (Ab if (!window.collapsedZoneIds) bis Dateiende)
 * Zeitstempel: 2026-08-28 22:40:00 CEST
 * Breadcrumbs:
 *   - [2026-08-28 22:40:00 CEST]: 1. toggleIsolateZone repariert (Hierarchie-Isolation 
 *     inkl. Vorfahren/Nachkommen & De-Isolation).
 *     2. Flickern behoben: isZoneHidden als zentraler Guard & animierten Zoom 
 *     bei einfacher Sichtbarkeitsänderung gedämpft.
 * =============================================================================
 */

if (!window.collapsedZoneIds) window.collapsedZoneIds = new Set();
if (!window.hiddenTopZoneIds) window.hiddenTopZoneIds = new Set();

window.toggleSidebarZoneCollapse = function (e, zoneId) {
    if (e) e.stopPropagation();
    if (window.collapsedZoneIds.has(zoneId)) {
        window.collapsedZoneIds.delete(zoneId);
    } else {
        window.collapsedZoneIds.add(zoneId);
    }
    if (typeof window.renderSidebarZones === 'function') window.renderSidebarZones();
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Sidebar Zonen-Rendering & Performance-Isolierung
 * ERSETZEN IN: app.js (Ab window.renderSidebarZones bis Dateiende)
 * Zeitstempel: 2026-08-28 23:35:00 CEST
 * Breadcrumbs:
 *   - [2026-08-28 23:35:00 CEST]: 1. DocumentFragment-Fix: Sidebar flackert 
 *     nicht mehr, da das DOM erst im Speicher gebaut und am Stück getauscht wird.
 *     2. Layout-Thrashing-Fix: Sichtbarkeits-Toggles und Isolation laufen über 
 *     doppeltes requestAnimationFrame, um die DOM-Erstellung vom Kamera-Zoom zu entkoppeln.
 * =============================================================================
 */

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Sidebar Zonen-Rendering (Standardmäßig eingeklappte Unterrahmen)
 * ERSETZEN IN: app.js (Funktion renderSidebarZones)
 * Zeitstempel: 2026-08-29 20:50:00 CEST
 * Breadcrumbs:
 *   - [2026-08-28 23:35:00 CEST]: DocumentFragment-Fix gegen Flackern.
 *   - [2026-08-29 20:50:00 CEST]: Initialer Kollaps-Status hinzugefügt: 
 *     Beim ersten Laden werden alle Eltern-Rahmen automatisch in window.collapsedZoneIds 
 *     aufgenommen, damit der Menübaum initial geschlossen bleibt.
 * =============================================================================
 */
window.renderSidebarZones = function () {
    const container = document.getElementById('sidebarZonesContainer');
    if (!container) return;

    if (!window.collapsedZoneIds) window.collapsedZoneIds = new Set();
    if (!window.collapsedZonesInitialized && currentZones && currentZones.length > 0) {
        // Alle Zonen mit Unterzonen beim ersten Laden initial einklappen
        currentZones.forEach(z => {
            const hasChildren = currentZones.some(child => child.parent_zone_id === z.id);
            if (hasChildren) {
                window.collapsedZoneIds.add(z.id);
            }
        });
        window.collapsedZonesInitialized = true;
    }

    // 1. Fragment erstellen (Unsichtbarer Zwischenspeicher gegen Flackern)
    const fragment = document.createDocumentFragment();

    const sortZonesByOrder = (zones) => {
        return [...zones].sort((a, b) => {
            const ordA = (a.sort_order !== null && a.sort_order !== undefined) ? a.sort_order : 9999;
            const ordB = (b.sort_order !== null && b.sort_order !== undefined) ? b.sort_order : 9999;
            if (ordA !== ordB) return ordA - ordB;
            const areaA = (parseFloat(a.width) || 0) * (parseFloat(a.height) || 0);
            const areaB = (parseFloat(b.width) || 0) * (parseFloat(b.height) || 0);
            return areaB - areaA;
        });
    };

    const topZones = sortZonesByOrder(currentZones.filter(z => !z.parent_zone_id));

    if (topZones.length === 0) {
        container.innerHTML = '<div style="font-size: 11px; color: #718096; padding-left: 10px;">Keine Bereiche definiert.</div>';
        return;
    }

    let draggedEl = null;

    const saveDatabaseZoneOrder = async (parentContainer) => {
        if (!isAdmin) return;

        const itemEls = Array.from(parentContainer.children)
            .map(child => child.classList.contains('sidebar-zone-item') ? child : child.querySelector('.sidebar-zone-item'))
            .filter(Boolean);

        const updates = [];
        itemEls.forEach((el, index) => {
            const zId = el.dataset.zoneId;
            const targetZone = currentZones.find(z => z.id === zId);
            if (targetZone && targetZone.sort_order !== index) {
                targetZone.sort_order = index;
                updates.push(db.from('project_zones').update({ sort_order: index }).eq('id', zId));
            }
        });

        if (updates.length > 0) {
            await Promise.all(updates);
            showToast('Rahmen-Reihenfolge global aktualisiert', 'success');
        }
    };

    const renderZoneTree = (zone, isSubZone, parentContainer) => {
        const isHidden = typeof window.isZoneHidden === 'function' ? window.isZoneHidden(zone.id) : false;
        const childZones = sortZonesByOrder(currentZones.filter(z => z.parent_zone_id === zone.id));
        const hasChildren = childZones.length > 0;
        const isCollapsed = window.collapsedZoneIds.has(zone.id);

        const el = document.createElement('div');
        el.className = `sidebar-zone-item ${isSubZone ? 'sub-zone' : 'top-zone'}`;
        el.dataset.zoneId = zone.id;
        el.dataset.parentId = zone.parent_zone_id || 'root';
        el.draggable = !!isAdmin;

        el.style.display = 'flex';
        el.style.justifyContent = 'space-between';
        el.style.alignItems = 'center';
        el.style.padding = isSubZone ? '6px 10px 6px 0' : '6px 10px';
        el.style.background = isSubZone ? 'transparent' : '#2d3748';
        el.style.borderRadius = isSubZone ? '0' : '4px';
        el.style.fontSize = '12px';
        el.style.color = isHidden ? '#718096' : '#e2e8f0';
        el.style.marginBottom = isSubZone ? '0' : '4px';
        el.style.cursor = isAdmin ? 'grab' : 'default';
        el.style.transition = 'background 0.15s ease';

        let toggleBtnHtml = '';
        if (hasChildren && !isSubZone) {
            toggleBtnHtml = `<span onclick="toggleSidebarZoneCollapse(event, '${zone.id}')" style="cursor:pointer; font-size:10px; padding:0 3px; user-select:none; opacity:0.8; width: 16px; display:inline-block; text-align:center;" title="${isCollapsed ? 'Unterrahmen aufklappen' : 'Unterrahmen einklappen'}">${isCollapsed ? '▶' : '▼'}</span>`;
        } else if (!isSubZone) {
            toggleBtnHtml = `<span style="width: 16px; display:inline-block;"></span>`;
        }

        const dragHandleHtml = isAdmin
            ? `<span style="color:#718096; font-size:12px; cursor:grab; user-select:none; margin-right: 4px;" title="Admin: Ziehen zum Neuanordnen">⋮⋮</span>`
            : '';

        const nodeIconHtml = `<span style="color:${zone.color_hex || '#a0aec0'}; font-size: 14px; margin-right: 6px;">■</span>`;

        el.innerHTML = `
            <div style="display:flex; align-items:center; overflow:visible; flex:1; position: relative; height: 100%;">
                ${dragHandleHtml}
                ${toggleBtnHtml}
                ${nodeIconHtml}
                <span style="cursor:pointer; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; ${isHidden ? 'text-decoration:line-through; opacity:0.5;' : ''}" onclick="centerViewOnVisible('${zone.id}')">${escapeHtml(zone.title)}</span>
            </div>
            <div style="display:flex; gap:6px; flex-shrink:0;">
                <button title="Sichtbarkeit umschalten" onclick="toggleZoneVisibility('${zone.id}')" style="background:none; border:none; cursor:pointer; opacity: ${isHidden ? '0.4' : '1'};">👁️</button>
                <button title="Nur diesen Bereich isolieren" onclick="toggleIsolateZone('${zone.id}')" style="background:none; border:none; cursor:pointer; opacity: ${isHidden ? '0.4' : '1'};">🎯</button>
            </div>
        `;

        if (isAdmin) {
            el.addEventListener('dragstart', (e) => {
                draggedEl = !isSubZone ? el.parentElement : el;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', zone.id);
                setTimeout(() => draggedEl.style.opacity = '0.4', 0);
            });

            el.addEventListener('dragend', () => {
                if (draggedEl) draggedEl.style.opacity = '1';
                draggedEl = null;
                parentContainer.querySelectorAll('.sidebar-zone-item').forEach(item => {
                    item.style.borderTop = '';
                    item.style.borderBottom = '';
                });
            });

            el.addEventListener('dragover', (e) => {
                e.preventDefault();
                const dropTarget = !isSubZone ? el.parentElement : el;
                if (!draggedEl || draggedEl === dropTarget || draggedEl.parentElement !== dropTarget.parentElement) return;

                e.dataTransfer.dropEffect = 'move';
                const rect = dropTarget.getBoundingClientRect();
                const relY = e.clientY - rect.top;

                if (relY < rect.height / 2) {
                    el.style.borderTop = '2px solid #3182ce';
                    el.style.borderBottom = '';
                } else {
                    el.style.borderBottom = '2px solid #3182ce';
                    el.style.borderTop = '';
                }
            });

            el.addEventListener('dragleave', () => {
                el.style.borderTop = '';
                el.style.borderBottom = '';
            });

            el.addEventListener('drop', async (e) => {
                e.preventDefault();
                el.style.borderTop = '';
                el.style.borderBottom = '';

                const dropTarget = !isSubZone ? el.parentElement : el;
                if (!draggedEl || draggedEl === dropTarget || draggedEl.parentElement !== dropTarget.parentElement) return;

                const rect = dropTarget.getBoundingClientRect();
                const relY = e.clientY - rect.top;

                if (relY < rect.height / 2) {
                    parentContainer.insertBefore(draggedEl, dropTarget);
                } else {
                    parentContainer.insertBefore(draggedEl, dropTarget.nextSibling);
                }

                await saveDatabaseZoneOrder(parentContainer);
            });
        }

        if (!isSubZone) {
            const wrapper = document.createElement('div');
            wrapper.className = 'top-zone-wrapper';
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.appendChild(el);

            if (hasChildren && !isCollapsed) {
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'sub-zones-container';
                childZones.forEach(child => renderZoneTree(child, true, childrenContainer));
                wrapper.appendChild(childrenContainer);
            }
            parentContainer.appendChild(wrapper);
        } else {
            parentContainer.appendChild(el);
        }
    };

    topZones.forEach(zone => {
        renderZoneTree(zone, false, fragment);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
};

// Sichtbarkeit: Asynchron entkoppelt, um Rendering-Flackern zu vermeiden
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Performance & State Sync (Anti-Ruckel DOM-Patcher)
 * ERSETZEN IN: app.js (Ab window.toggleZoneVisibility bis Dateiende)
 * Zeitstempel: 2026-08-28 23:45:00 CEST
 * Breadcrumbs:
 *   - [2026-08-28 23:45:00 CEST]: Das zerstörerische Komplett-Rendern 
 *     (renderCanvas & renderSidebarZones) beim Umschalten der Sichtbarkeit 
 *     wurde durch gezieltes CSS-Patching (display: none) ersetzt. 
 *     Vorteil: 0% Sidebar-Flackern und flüssiger Kamera-Zoom (kein Layout-Thrashing).
 * =============================================================================
 */

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Anti-Flicker State & Visibility Sync (CSS !important Override Fix)
 * ERSETZEN IN: app.js (Funktion syncVisibilityToDOM)
 * Zeitstempel: 2026-08-29 20:20:00 CEST
 * Breadcrumbs:
 *   - [2026-08-28 23:55:00 CEST]: Flackern vollständig beseitigt.
 *   - [2026-08-29 20:20:00 CEST]: Fix: Notizen wurden beim Isolieren nicht 
 *     ausgeblendet, da ihr CSS "display: flex !important" normale inline-Styles 
 *     blockiert hat. Lösung: setProperty('display', 'none', 'important').
 * =============================================================================
 */
window.syncVisibilityToDOM = function () {
    // 1. Sidebar Styles anpassen (Striche, Deckkraft)
    const sidebarItems = document.querySelectorAll('.sidebar-zone-item');
    sidebarItems.forEach(el => {
        const zId = el.dataset.zoneId;
        const isHidden = typeof window.isZoneHidden === 'function' ? window.isZoneHidden(zId) : false;

        const textSpan = el.querySelector('span[onclick^="centerViewOnVisible"]');
        if (textSpan) {
            textSpan.style.textDecoration = isHidden ? 'line-through' : 'none';
            textSpan.style.opacity = isHidden ? '0.45' : '1';
        }

        const btns = el.querySelectorAll('button');
        btns.forEach(btn => {
            btn.style.opacity = isHidden ? '0.35' : '1';
        });
    });

    // 2. Canvas Rahmen anpassen
    (currentZones || []).forEach(z => {
        const el = document.getElementById(z.id);
        if (el) {
            if (window.isZoneHidden(z.id)) {
                el.style.setProperty('display', 'none', 'important');
            } else {
                el.style.display = '';
            }
        }
    });

    // 3. Canvas Blöcke & Notizen anpassen
    (currentNodes || []).forEach(n => {
        const el = document.getElementById(n.id);
        if (el) {
            const zoneHidden = n.zone_id && window.isZoneHidden(n.zone_id);
            const treeHidden = typeof isNodeHiddenByAncestor === 'function' && isNodeHiddenByAncestor(n.id);

            if (zoneHidden || treeHidden) {
                // Erzwingt das Ausblenden gegen das !important in der style.css
                el.style.setProperty('display', 'none', 'important');
            } else {
                // Leerer String lässt den Browser auf die CSS-Klassen zurückfallen
                el.style.display = '';
            }
        }
    });

    // 4. SVG Verbindungen neu zeichnen
    if (typeof renderConnections === 'function') renderConnections();
};

window.toggleZoneVisibility = function (zoneId) {
    if (!window.hiddenTopZoneIds) window.hiddenTopZoneIds = new Set();

    if (window.hiddenTopZoneIds.has(zoneId)) {
        window.hiddenTopZoneIds.delete(zoneId);
    } else {
        window.hiddenTopZoneIds.add(zoneId);
    }

    window.syncVisibilityToDOM();
};

window.toggleIsolateZone = function (zoneId) {
    if (!window.hiddenTopZoneIds) window.hiddenTopZoneIds = new Set();

    const targetZone = (currentZones || []).find(z => z.id === zoneId);
    if (!targetZone) return;

    // Vorfahren ermitteln
    const ancestors = new Set();
    let curr = targetZone;
    while (curr.parent_zone_id) {
        ancestors.add(curr.parent_zone_id);
        curr = (currentZones || []).find(z => z.id === curr.parent_zone_id);
        if (!curr) break;
    }

    // Nachkommen ermitteln
    const descendants = new Set();
    const getDescendants = (parentId) => {
        (currentZones || []).filter(z => z.parent_zone_id === parentId).forEach(child => {
            descendants.add(child.id);
            getDescendants(child.id);
        });
    };
    getDescendants(zoneId);

    const keepVisible = new Set([zoneId, ...ancestors, ...descendants]);

    let currentlyIsolated = true;
    (currentZones || []).forEach(z => {
        if (keepVisible.has(z.id)) {
            if (window.hiddenTopZoneIds.has(z.id)) currentlyIsolated = false;
        } else {
            if (!window.hiddenTopZoneIds.has(z.id)) currentlyIsolated = false;
        }
    });

    window.hiddenTopZoneIds.clear();

    if (!currentlyIsolated) {
        (currentZones || []).forEach(z => {
            if (!keepVisible.has(z.id)) window.hiddenTopZoneIds.add(z.id);
        });
    }

    window.syncVisibilityToDOM();

    // Sofortige Ausrichtung ohne CSS-Animation (verhindert das Ruckeln/Flackern)
    if (typeof window.centerViewOnVisible === 'function') {
        window.centerViewOnVisible(currentlyIsolated ? null : zoneId);
    }
};

window.isolateZone = window.toggleIsolateZone;