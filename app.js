/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Haupt-Bootstrap, Sidebar Zonen-Rendering & Visibility Engine
 * Datei: app.js
 * Zeitstempel: 2026-10-03 16:50:00 CEST
 * =============================================================================
 * FUNKTIONSBESCHREIBUNG (EXTENSIV):
 * Diese Datei fungiert als Haupt-Einsprungspunkt (Application Orchestrator)
 * und Visibility-Manager des CAD Time Managers. Sie initialisiert die Anwendung,
 * registriert globale Ereignis-Listener und synchronisiert die Baumstruktur der
 * linken Sidebar mit den sichtbaren Elementen auf dem Canvas.
 *
 * KERNFUNKTIONALITÄTEN & ARCHITEKTUR:
 * 1. Application Lifecycle & Bootstrap (initApp):
 *    - Initialisiert globale Farbwähler-Presets für Baugruppen und Rahmen.
 *    - Bindet zentrale Formular-Submit-Listener (neue Blöcke, Rahmen, Notizen, Konfiguration).
 *    - Reaktiviert gespeicherte Benutzersitzungen (Auto-Login via localStorage).
 *    - Führt den initialen, parallelen Datenabruf durch (fetchUsers, fetchProjects).
 *    - Abonniert PostgreSQL-Echtzeit-Änderungen über Supabase-Realtime (postgres_changes).
 *
 * 2. Sidebar Zonen- & Hierarchie-Engine (renderSidebarZones):
 *    - CAD-Konstruktionsmodus: Rendert den verschachtelten Zonenbaum (Haupthallen,
 *      Unterrahmen). Unterstützt interaktives Drag-and-Drop zur Umsortierung der
 *      Bereiche mit dauerhafter Speicherung der Sortierreihenfolge (sort_order).
 *    - Bietet Schnellaktionen:
 *      * 👁️ (Sichtbarkeit umschalten): Blendet gezielt Teilbäume auf dem Canvas aus.
 *      * 🎯 (Bereich isolieren): Blendet alle anderen Bereiche aus und zentriert die
 *        Kamera exakt auf den gewählten Hallenrahmen.
 *    - Manager-Status-Board-Modus: Rendert die Rahmenstruktur des Fortschritts-Boards
 *      sowie den einklappbaren Komponenten-Pool für unplatzierte Baugruppen mit
 *      Drag-to-Canvas-Funktionalität.
 *
 * 3. DOM-Sichtbarkeits-Synchronisation (syncVisibilityToDOM):
 *    - Synchronisiert Canvas-Karten, Rahmen und SVG-Verbindungslinien performant
 *      mit den in der Sidebar aktivierten Sichtbarkeits- und Isolationsfiltern.
 *    - Entkoppelt ausgeblendete Elemente vollständig von Reflow- und Hit-Test-Zyklen
 *      (display: none !important).
 * =============================================================================
 * Breadcrumbs:
 *   - [2026-08-30 22:30:00 CEST]: Basis-Bootstrap & Realtime-Sync.
 *   - [2026-09-26 11:45:00 CEST]: Manager-Board Zonen-Hierarchie & Pool-Akkordeon.
 *   - [2026-09-26 12:15:00 CEST]: Bereinigung verschachtelter Deklarationen.
 *   - [2026-10-03 16:50:00 CEST]: 1. Bereinigung legacy initPanzoom Aufruf.
 *     2. DOM-Sichtbarkeitssynchronisation weiter optimiert. 3. Extensiver Funktionsheader ergänzt.
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
    addListenerIfEx('newNoteForm', 'submit', handleAddNote);
    addListenerIfEx('editNoteForm', 'submit', handleSaveNote);

    // Auto-Login Vorab-Prüfung
    const cachedUser = localStorage.getItem('cad_tm_user');
    const cachedProject = localStorage.getItem('cad_tm_project');

    if (cachedUser && cachedProject) {
        const overlay = document.getElementById('userLoginOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    // Initialer Datenabruf
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

// Start-Mechanismus
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// =============================================================================
// SIDEBAR ZONEN-RENDERING & HIERARCHISCHE ISOLATION (CAD & MANAGER)
// =============================================================================
if (!window.collapsedZoneIds) window.collapsedZoneIds = new Set();
if (!window.hiddenTopZoneIds) window.hiddenTopZoneIds = new Set();
if (!window.collapsedMgrZoneIds) window.collapsedMgrZoneIds = new Set();
if (!window.hiddenMgrZoneIds) window.hiddenMgrZoneIds = new Set();

// Toggle CAD-Konstruktionsplan
window.toggleSidebarZoneCollapse = function (e, zoneId) {
    if (e) e.stopPropagation();
    if (window.collapsedZoneIds.has(zoneId)) {
        window.collapsedZoneIds.delete(zoneId);
    } else {
        window.collapsedZoneIds.add(zoneId);
    }
    if (typeof window.renderSidebarZones === 'function') window.renderSidebarZones();
};

// Toggle Manager-Board (Übersichts-Rahmen aufklappen / zuklappen)
window.toggleSidebarMgrZoneCollapse = function (e, zoneId) {
    if (e) e.stopPropagation();
    if (!window.collapsedMgrZoneIds) window.collapsedMgrZoneIds = new Set();
    if (window.collapsedMgrZoneIds.has(zoneId)) {
        window.collapsedMgrZoneIds.delete(zoneId);
    } else {
        window.collapsedMgrZoneIds.add(zoneId);
    }
    if (typeof window.renderSidebarZones === 'function') window.renderSidebarZones();
};

// Prüft, ob ein Manager-Rahmen (oder ein Elternrahmen) verborgen ist
window.isMgrZoneHidden = function (zoneId, zones) {
    if (!zoneId || !window.hiddenMgrZoneIds || window.hiddenMgrZoneIds.size === 0) return false;
    if (window.hiddenMgrZoneIds.has(zoneId)) return true;

    const zList = zones || ((typeof getManagerLayout === 'function') ? getManagerLayout().zones : []);
    let current = (zList || []).find(x => x.id === zoneId);
    let depthGuard = 0;
    while (current && current.parent_zone_id && depthGuard < 10) {
        if (window.hiddenMgrZoneIds.has(current.parent_zone_id)) return true;
        current = (zList || []).find(x => x.id === current.parent_zone_id);
        depthGuard++;
    }
    return false;
};

window.toggleMgrZoneVisibility = function (zoneId) {
    if (!window.hiddenMgrZoneIds) window.hiddenMgrZoneIds = new Set();
    if (window.hiddenMgrZoneIds.has(zoneId)) {
        window.hiddenMgrZoneIds.delete(zoneId);
    } else {
        window.hiddenMgrZoneIds.add(zoneId);
    }
    window.syncVisibilityToDOM();
};

window.toggleIsolateMgrZone = function (zoneId) {
    if (!window.hiddenMgrZoneIds) window.hiddenMgrZoneIds = new Set();
    const layout = (typeof getManagerLayout === 'function') ? getManagerLayout() : { zones: [] };
    const zones = layout.zones || [];
    const targetZone = zones.find(z => z.id === zoneId);
    if (!targetZone) return;

    const ancestors = new Set();
    let curr = targetZone;
    while (curr && curr.parent_zone_id) {
        ancestors.add(curr.parent_zone_id);
        curr = zones.find(z => z.id === curr.parent_zone_id);
    }

    const descendants = new Set();
    const getDesc = (pId) => {
        zones.filter(z => z.parent_zone_id === pId).forEach(c => {
            descendants.add(c.id);
            getDesc(c.id);
        });
    };
    getDesc(zoneId);

    const keepVisible = new Set([zoneId, ...ancestors, ...descendants]);

    let currentlyIsolated = true;
    zones.forEach(z => {
        if (keepVisible.has(z.id)) {
            if (window.hiddenMgrZoneIds.has(z.id)) currentlyIsolated = false;
        } else {
            if (!window.hiddenMgrZoneIds.has(z.id)) currentlyIsolated = false;
        }
    });

    window.hiddenMgrZoneIds.clear();
    if (!currentlyIsolated) {
        zones.forEach(z => {
            if (!keepVisible.has(z.id)) window.hiddenMgrZoneIds.add(z.id);
        });
    }

    window.syncVisibilityToDOM();
    if (typeof window.centerOnManagerZone === 'function') {
        window.centerOnManagerZone(zoneId);
    }
};

window.renderSidebarZones = function () {
    const container = document.getElementById('sidebarZonesContainer');
    if (!container) return;

    const sectionTitleEl = container.previousElementSibling;
    const isMgr = (window.activeCanvasMode === 'manager');

    if (sectionTitleEl && sectionTitleEl.classList.contains('sidebar-section-title')) {
        sectionTitleEl.textContent = isMgr ? 'Übersichts-Bereiche (Board)' : 'Top-Bereiche (Ansicht)';
    }

    // =========================================================================
    // MODUS A: MANAGER-COCKPIT -> HIERARCHISCHE ÜBERSICHTS-RAHMEN & POOL
    // =========================================================================
    if (isMgr) {
        const mgrLayout = (typeof getManagerLayout === 'function') ? getManagerLayout() : { zones: [], placements: {} };
        const rawNodes = (currentNodes || []).filter(n => n.block_type !== 'note');
        const fragment = document.createDocumentFragment();

        // 1. Übersichts-Rahmen mit Aufklapp-Hierarchie
        const zonesHeader = document.createElement('div');
        zonesHeader.className = 'sidebar-section-title';
        zonesHeader.style.cssText = 'margin-top: 4px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;';
        zonesHeader.innerHTML = `
            <span>Übersichts-Rahmen (${(mgrLayout.zones || []).length})</span>
            <button type="button" class="sb-details-toggle" onclick="centerViewOnVisible()" title="Alle sichtbaren Rahmen ins Bild setzen">⟲ Alle</button>
        `;
        fragment.appendChild(zonesHeader);

        const zonesContainer = document.createElement('div');
        zonesContainer.style.cssText = 'display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px;';

        const topMgrZones = (mgrLayout.zones || []).filter(z => !z.parent_zone_id);

        if (topMgrZones.length === 0) {
            zonesContainer.innerHTML = '<div style="font-size: 11px; color: #718096; padding-left: 6px;">Keine Übersichts-Rahmen angelegt.</div>';
        } else {
            const renderMgrZoneTree = (zone, isSubZone, parentContainer) => {
                const isHidden = window.isMgrZoneHidden(zone.id, mgrLayout.zones);
                const childZones = !isSubZone ? (mgrLayout.zones || []).filter(z => z.parent_zone_id === zone.id) : [];
                const hasChildren = childZones.length > 0;
                const isCollapsed = window.collapsedMgrZoneIds.has(zone.id);

                const el = document.createElement('div');
                el.className = `sidebar-zone-item ${isSubZone ? 'sub-zone' : 'top-zone'}`;
                el.dataset.zoneId = zone.id;
                el.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: ${isSubZone ? '6px 10px 6px 0' : '6px 8px'}; background: ${isSubZone ? 'transparent' : '#2d3748'}; border-radius: ${isSubZone ? '0' : '4px'}; font-size: 12px; color: ${isHidden ? '#718096' : '#e2e8f0'}; margin-bottom: ${isSubZone ? '0' : '3px'}; transition: background 0.15s ease;`;

                let toggleBtnHtml = '';
                if (hasChildren && !isSubZone) {
                    toggleBtnHtml = `<span onclick="window.toggleSidebarMgrZoneCollapse(event, '${zone.id}')" style="cursor:pointer; font-size:10px; padding:0 3px; user-select:none; opacity:0.8; width: 16px; display:inline-block; text-align:center;" title="${isCollapsed ? 'Unterrahmen aufklappen' : 'Unterrahmen einklappen'}">${isCollapsed ? '▶' : '▼'}</span>`;
                } else if (!isSubZone) {
                    toggleBtnHtml = `<span style="width: 16px; display:inline-block;"></span>`;
                }

                const docBadge = zone.doc_number ? `<span style="font-family:monospace; font-size:9px; background:#1a202c; color:#cbd5e0; padding:1px 4px; border-radius:2px; margin-right:4px;">${escapeHtml(zone.doc_number)}</span>` : '';

                el.innerHTML = `
                    <div style="display:flex; align-items:center; overflow:hidden; flex:1; cursor:pointer;" onclick="window.centerOnManagerZone('${zone.id}')" title="Kamera zentrieren: ${escapeHtml(zone.title)}">
                        ${toggleBtnHtml}
                        <span style="color:${zone.color_hex || '#2b6cb0'}; font-size: 14px; margin-right: 6px;">📁</span>
                        <div style="display:flex; flex-direction:column; overflow:hidden; white-space:nowrap;">
                            <span style="overflow:hidden; text-overflow:ellipsis; font-weight:600; color:${isHidden ? '#718096' : '#fff'}; ${isHidden ? 'text-decoration:line-through; opacity:0.5;' : ''}">${escapeHtml(zone.title)}</span>
                            <div>${docBadge}</div>
                        </div>
                    </div>
                    <div style="display:flex; gap:4px; flex-shrink:0;">
                        <button type="button" title="Sichtbarkeit umschalten" onclick="window.toggleMgrZoneVisibility('${zone.id}')" style="background:none; border:none; cursor:pointer; opacity: ${isHidden ? '0.4' : '1'}; font-size:12px;">👁️</button>
                        <button type="button" title="Nur diesen Rahmen isolieren" onclick="window.toggleIsolateMgrZone('${zone.id}')" style="background:none; border:none; cursor:pointer; opacity: ${isHidden ? '0.4' : '1'}; font-size:12px;">🎯</button>
                        <button type="button" title="Rahmen sperren/entsperren" onclick="window.toggleManagerZoneLock(event, '${zone.id}')" style="background:none; border:none; cursor:pointer; font-size:11px;">${zone.is_locked ? '🔒' : '🔓'}</button>
                    </div>
                `;

                if (!isSubZone) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'top-zone-wrapper';
                    wrapper.style.display = 'flex';
                    wrapper.style.flexDirection = 'column';
                    wrapper.appendChild(el);

                    if (hasChildren && !isCollapsed) {
                        const childrenContainer = document.createElement('div');
                        childrenContainer.className = 'sub-zones-container';
                        childZones.forEach(child => renderMgrZoneTree(child, true, childrenContainer));
                        wrapper.appendChild(childrenContainer);
                    }
                    parentContainer.appendChild(wrapper);
                } else {
                    parentContainer.appendChild(el);
                }
            };

            topMgrZones.forEach(z => renderMgrZoneTree(z, false, zonesContainer));
        }
        fragment.appendChild(zonesContainer);

        // 2. Einklappbarer Komponenten-Pool
        const isPoolCollapsed = localStorage.getItem('cad_tm_pool_collapsed') === 'true';

        const poolToggleHeader = document.createElement('div');
        poolToggleHeader.className = 'sb-pool-collapsible-header';
        poolToggleHeader.innerHTML = `
            <div style="display:flex; align-items:center; gap:6px;">
                <span class="pool-toggle-icon">${isPoolCollapsed ? '▶' : '▼'}</span>
                <span class="sidebar-section-title" style="margin: 0; color: #e2e8f0;">Komponenten-Pool (${rawNodes.length})</span>
            </div>
            <span style="font-size:10px; color:#a0aec0;">${isPoolCollapsed ? 'Ausklappen' : 'Einklappen'}</span>
        `;
        poolToggleHeader.onclick = () => {
            const nextState = !isPoolCollapsed;
            localStorage.setItem('cad_tm_pool_collapsed', nextState ? 'true' : 'false');
            renderSidebarZones();
        };
        fragment.appendChild(poolToggleHeader);

        if (!isPoolCollapsed) {
            const poolBody = document.createElement('div');
            poolBody.style.cssText = 'display: flex; flex-direction: column; gap: 4px; margin-top: 6px;';

            if (rawNodes.length === 0) {
                poolBody.innerHTML = '<div style="font-size: 11px; color: #718096; padding-left: 6px;">Keine Komponenten im Plan vorhanden.</div>';
            } else {
                const colorOrder = (window.COLOR_PRESETS || []).map(c => c.hex.toLowerCase());
                const sortedNodes = [...rawNodes].sort((a, b) => {
                    const colA = (a.color_hex || '#2b6cb0').toLowerCase();
                    const colB = (b.color_hex || '#2b6cb0').toLowerCase();
                    const idxA = colorOrder.indexOf(colA);
                    const idxB = colorOrder.indexOf(colB);
                    if (idxA !== idxB) return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
                    return (a.name || '').localeCompare(b.name || '');
                });

                sortedNodes.forEach(node => {
                    const isPlaced = !!(mgrLayout.placements && mgrLayout.placements[node.id]);
                    const nodeColor = node.color_hex || '#2b6cb0';
                    const iconSvg = node.block_type === 'part' ? (window.CAD_ICONS ? CAD_ICONS.part : '⚙️') : (window.CAD_ICONS ? CAD_ICONS.assembly : '📦');
                    const docText = node.doc_number || (node.article_number ? `ART-${node.article_number}` : '');

                    const item = document.createElement('div');
                    item.className = `sidebar-zone-item sb-pool-item ${isPlaced ? 'is-placed' : ''}`;
                    item.dataset.nodeId = node.id;
                    item.draggable = true;
                    item.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding:6px 8px; background:${isPlaced ? 'rgba(45, 55, 72, 0.45)' : '#2d3748'}; border-radius:4px; font-size:12px; margin-bottom:3px; border-left:3px solid ${nodeColor}; cursor:grab; transition:all 0.15s ease;`;

                    const docBadgeHtml = docText ? `<span style="font-family:monospace; font-size:9px; background:#1a202c; color:#cbd5e0; padding:1px 4px; border-radius:2px; margin-right:4px;">${escapeHtml(docText)}</span>` : '';

                    item.innerHTML = `
                        <div style="display:flex; align-items:center; overflow:hidden; flex:1; gap: 5px;" title="${escapeHtml(node.name)}">
                            <span style="font-size: 13px; line-height: 1;">${iconSvg}</span>
                            <div style="display:flex; flex-direction:column; overflow:hidden; white-space:nowrap;">
                                <span style="overflow:hidden; text-overflow:ellipsis; color: ${isPlaced ? '#a0aec0' : '#fff'}; font-weight: 600;">${escapeHtml(node.name)}</span>
                                <div style="display:flex; align-items:center; margin-top: 1px;">
                                    ${docBadgeHtml}
                                </div>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
                            ${isPlaced
                            ? `<button type="button" class="btn-pool-action focus" onclick="window.centerOnManagerBlock('${node.id}')" title="Kamera auf Bauteil zentrieren">🎯</button>
                                   <button type="button" class="btn-pool-action remove" onclick="window.removeBlockFromManagerCanvas('${node.id}')" title="Vom Manager-Board entfernen">✕</button>`
                            : `<button type="button" class="btn-pool-action add" onclick="window.addBlockToManagerCanvas('${node.id}')" title="Auf Manager-Board einfügen">➕</button>`
                        }
                        </div>
                    `;

                    item.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('text/plain', node.id);
                        e.dataTransfer.effectAllowed = 'copyMove';
                    });

                    poolBody.appendChild(item);
                });
            }
            fragment.appendChild(poolBody);
        }

        container.innerHTML = '';
        container.appendChild(fragment);
        return;
    }

    // =========================================================================
    // MODUS B: HAUPT-CANVAS (CAD) -> REGULÄRER ZONEN-BAUM
    // =========================================================================
    if (!window.collapsedZonesInitialized && currentZones && currentZones.length > 0) {
        currentZones.forEach(z => {
            const hasChildren = currentZones.some(child => child.parent_zone_id === z.id);
            if (hasChildren) window.collapsedZoneIds.add(z.id);
        });
        window.collapsedZonesInitialized = true;
    }

    const fragment = document.createDocumentFragment();
    const isLocalProject = !!(window.activeProjectId && window.activeProjectId.startsWith('local_'));
    const canReorderZones = isAdmin || isLocalProject;

    const sortZonesByOrder = (zones) => {
        return [...zones].sort((a, b) => {
            const ordA = (a.sort_order !== null && a.sort_order !== undefined) ? a.sort_order : 9999;
            const ordB = (b.sort_order !== null && b.sort_order !== undefined) ? b.sort_order : 9999;
            return ordA - ordB;
        });
    };

    const topZones = sortZonesByOrder((currentZones || []).filter(z => !z.parent_zone_id));

    if (topZones.length === 0) {
        container.innerHTML = '<div style="font-size: 11px; color: #718096; padding-left: 10px;">Keine Bereiche definiert.</div>';
        return;
    }

    let draggedEl = null;

    const saveDatabaseZoneOrder = async (targetParentEl) => {
        if (!canReorderZones || !targetParentEl) return;
        const itemEls = Array.from(targetParentEl.children)
            .map(child => child.classList.contains('sidebar-zone-item') ? child : child.querySelector('.sidebar-zone-item'))
            .filter(Boolean);

        const updates = [];
        itemEls.forEach((el, index) => {
            const zId = el.dataset.zoneId;
            const targetZone = (currentZones || []).find(z => z.id === zId);
            if (targetZone && targetZone.sort_order !== index) {
                targetZone.sort_order = index;
                updates.push(db.from('project_zones').update({ sort_order: index }).eq('id', zId));
            }
        });

        if (updates.length > 0) {
            await Promise.all(updates);
            showToast('Rahmen-Reihenfolge aktualisiert', 'success');
        }
    };

    const renderZoneTree = (zone, isSubZone, parentContainer) => {
        const isHidden = typeof window.isZoneHidden === 'function' ? window.isZoneHidden(zone.id) : false;
        const childZones = !isSubZone ? sortZonesByOrder((currentZones || []).filter(z => z.parent_zone_id === zone.id)) : [];
        const hasChildren = childZones.length > 0;
        const isCollapsed = window.collapsedZoneIds.has(zone.id);

        const el = document.createElement('div');
        el.className = `sidebar-zone-item ${isSubZone ? 'sub-zone' : 'top-zone'}`;
        el.dataset.zoneId = zone.id;
        el.dataset.parentId = zone.parent_zone_id || 'root';
        el.draggable = canReorderZones;

        el.style.display = 'flex';
        el.style.justifyContent = 'space-between';
        el.style.alignItems = 'center';
        el.style.padding = isSubZone ? '6px 10px 6px 0' : '6px 10px';
        el.style.background = isSubZone ? 'transparent' : '#2d3748';
        el.style.borderRadius = isSubZone ? '0' : '4px';
        el.style.fontSize = '12px';
        el.style.color = isHidden ? '#718096' : '#e2e8f0';
        el.style.marginBottom = isSubZone ? '0' : '4px';
        el.style.cursor = canReorderZones ? 'grab' : 'default';
        el.style.transition = 'background 0.15s ease';

        let toggleBtnHtml = '';
        if (hasChildren && !isSubZone) {
            toggleBtnHtml = `<span onclick="toggleSidebarZoneCollapse(event, '${zone.id}')" style="cursor:pointer; font-size:10px; padding:0 3px; user-select:none; opacity:0.8; width: 16px; display:inline-block; text-align:center;" title="${isCollapsed ? 'Unterrahmen aufklappen' : 'Unterrahmen einklappen'}">${isCollapsed ? '▶' : '▼'}</span>`;
        } else if (!isSubZone) {
            toggleBtnHtml = `<span style="width: 16px; display:inline-block;"></span>`;
        }

        const dragHandleHtml = canReorderZones
            ? `<span style="color:#718096; font-size:12px; cursor:grab; user-select:none; margin-right: 4px;" title="Ziehen zum Neuanordnen">⋮⋮</span>`
            : '';

        const nodeIconHtml = `<span style="color:${zone.color_hex || '#a0aec0'}; font-size: 14px; margin-right: 6px;">■</span>`;

        el.innerHTML = `
            <div style="display:flex; align-items:center; overflow:hidden; flex:1; position: relative; height: 100%;">
                ${dragHandleHtml}
                ${toggleBtnHtml}
                ${nodeIconHtml}
                <span style="cursor:pointer; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; ${isHidden ? 'text-decoration:line-through; opacity:0.5;' : ''}" onclick="centerViewOnVisible('${zone.id}')" title="${escapeHtml(zone.title)}">${escapeHtml(zone.title)}</span>
            </div>
            <div style="display:flex; gap:6px; flex-shrink:0;">
                <button title="Sichtbarkeit umschalten" onclick="toggleZoneVisibility('${zone.id}')" style="background:none; border:none; cursor:pointer; opacity: ${isHidden ? '0.4' : '1'};">👁️</button>
                <button title="Nur diesen Bereich isolieren" onclick="toggleIsolateZone('${zone.id}')" style="background:none; border:none; cursor:pointer; opacity: ${isHidden ? '0.4' : '1'};">🎯</button>
            </div>
        `;

        if (canReorderZones) {
            el.addEventListener('dragstart', (e) => {
                draggedEl = !isSubZone ? el.closest('.top-zone-wrapper') || el : el;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', zone.id);
                setTimeout(() => { if (draggedEl) draggedEl.style.opacity = '0.4'; }, 0);
            });

            el.addEventListener('dragend', () => {
                if (draggedEl) draggedEl.style.opacity = '1';
                draggedEl = null;
                document.querySelectorAll('.sidebar-zone-item').forEach(item => {
                    item.style.borderTop = '';
                    item.style.borderBottom = '';
                });
            });

            el.addEventListener('dragover', (e) => {
                e.preventDefault();
                const dropTarget = !isSubZone ? el.closest('.top-zone-wrapper') || el : el;
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

                const dropTarget = !isSubZone ? el.closest('.top-zone-wrapper') || el : el;
                if (!draggedEl || draggedEl === dropTarget || draggedEl.parentElement !== dropTarget.parentElement) return;

                const liveParent = dropTarget.parentElement;
                const rect = dropTarget.getBoundingClientRect();
                const relY = e.clientY - rect.top;

                if (relY < rect.height / 2) {
                    liveParent.insertBefore(draggedEl, dropTarget);
                } else {
                    liveParent.insertBefore(draggedEl, dropTarget.nextSibling);
                }

                await saveDatabaseZoneOrder(liveParent);
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

window.syncVisibilityToDOM = function () {
    // A. Manager-Modus
    if (window.activeCanvasMode === 'manager') {
        const svgLayer = document.getElementById('connections-layer');
        if (svgLayer) svgLayer.innerHTML = '';

        const mgrLayout = (typeof getManagerLayout === 'function') ? getManagerLayout() : { zones: [], placements: {} };

        const sidebarItems = document.querySelectorAll('#sidebarZonesContainer .sidebar-zone-item');
        sidebarItems.forEach(el => {
            const zId = el.dataset.zoneId;
            if (!zId) return;
            const isHidden = (typeof window.isMgrZoneHidden === 'function') ? window.isMgrZoneHidden(zId, mgrLayout.zones) : false;

            const textSpan = el.querySelector('span[style*="overflow:hidden"]');
            if (textSpan) {
                textSpan.style.textDecoration = isHidden ? 'line-through' : 'none';
                textSpan.style.opacity = isHidden ? '0.45' : '1';
            }

            el.querySelectorAll('button').forEach(btn => {
                btn.style.opacity = isHidden ? '0.35' : '1';
            });
        });

        (mgrLayout.zones || []).forEach(z => {
            const el = document.getElementById(z.id);
            if (el) {
                const isHidden = (typeof window.isMgrZoneHidden === 'function') ? window.isMgrZoneHidden(z.id, mgrLayout.zones) : false;
                if (isHidden) {
                    el.style.setProperty('display', 'none', 'important');
                } else {
                    el.style.display = '';
                }
            }
        });

        Object.keys(mgrLayout.placements || {}).forEach(nodeId => {
            const pl = mgrLayout.placements[nodeId];
            const el = document.getElementById(nodeId);
            if (el) {
                const isZoneHidden = pl && pl.zone_id && (typeof window.isMgrZoneHidden === 'function') && window.isMgrZoneHidden(pl.zone_id, mgrLayout.zones);
                const isBlockFramed = !!(pl && pl.zone_id && (mgrLayout.zones || []).some(z => z.id === pl.zone_id));
                const isUnframedHidden = window.managerFramedOnlyActive && !isBlockFramed && !window.isManagerSortHelperActive;

                if (isZoneHidden || isUnframedHidden) {
                    el.style.setProperty('display', 'none', 'important');
                } else {
                    el.style.display = '';
                }
            }
        });
        return;
    }

    // B. CAD-Modus
    const sidebarItems = document.querySelectorAll('.sidebar-zone-item');
    sidebarItems.forEach(el => {
        const zId = el.dataset.zoneId;
        const isHidden = typeof window.isZoneHidden === 'function' ? window.isZoneHidden(zId) : false;

        const textSpan = el.querySelector('span[onclick^="centerViewOnVisible"]');
        if (textSpan) {
            textSpan.style.textDecoration = isHidden ? 'line-through' : 'none';
            textSpan.style.opacity = isHidden ? '0.45' : '1';
        }

        el.querySelectorAll('button').forEach(btn => {
            btn.style.opacity = isHidden ? '0.35' : '1';
        });
    });

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

    (currentNodes || []).forEach(n => {
        const el = document.getElementById(n.id);
        if (el) {
            const zoneHidden = n.zone_id && window.isZoneHidden(n.zone_id);
            const treeHidden = typeof isNodeHiddenByAncestor === 'function' && isNodeHiddenByAncestor(n.id);

            if (zoneHidden || treeHidden) {
                el.style.setProperty('display', 'none', 'important');
            } else {
                el.style.display = '';
            }
        }
    });

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

    const ancestors = new Set();
    let curr = targetZone;
    while (curr.parent_zone_id) {
        ancestors.add(curr.parent_zone_id);
        curr = (currentZones || []).find(z => z.id === curr.parent_zone_id);
        if (!curr) break;
    }

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
    if (typeof window.centerViewOnVisible === 'function') {
        window.centerViewOnVisible(currentlyIsolated ? null : zoneId);
    }
};

window.isolateZone = window.toggleIsolateZone;