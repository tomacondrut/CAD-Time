/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: NATIVE Canvas Engine, 4-Seiten Handles & Flow-Arrows
 * ERSETZEN IN: canvas.js (Gesamte Datei)
 * Zeitstempel: 2026-08-23 19:50:00 CEST
 * Breadcrumbs:
 *   - [2026-08-23 10:00:00 CEST]: Native CSS-Transform Canvas Engine.
 *   - [2026-08-23 15:15:00 CEST]: Instanz-Duplizierung & Kontextmenü.
 *   - [2026-08-23 19:40:00 CEST]: 4 Handles pro Block, Materialfluss-Pfeile 
 *     zwischen Rahmen und flüssige Spline-Verbindungen.
 * =============================================================================
 */

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: NATIVE Canvas Engine & Viewport Caching
 * ERSETZEN IN: canvas.js (Kopfbereich & Initialisierung)
 * Zeitstempel: 2026-08-26 20:15:00 CEST
 * Breadcrumbs:
 *   - [2026-08-26] Globale Pan/Zoom-Variablen lesen initial direkt aus localStorage,
 *     damit die Position vor dem ersten Frame korrekt sitzt.
 * =============================================================================
 */

// Globale State-Variablen für das native Panning/Zooming (aus localStorage oder Fallback)
window.currentScale = parseFloat(localStorage.getItem('cad_tm_scale')) || 1;
window.currentPanX = parseFloat(localStorage.getItem('cad_tm_panX')) || 100;
window.currentPanY = parseFloat(localStorage.getItem('cad_tm_panY')) || 100;
window.hoveredNodeId = null;
window.copiedNodeIds = [];

// Dummy-Proxy, damit bestehender Drag&Drop Code kompatibel bleibt
window.panzoomInstance = { getScale: () => window.currentScale };

let connectingFirstNodeId = null;
let connectingFirstPoint = null;
let connectingFlowZoneId = null;
let contextMenuCoords = { x: 100, y: 100 };
let contextTargetNodeId = null;

/**
 * Wendet Zoom- und Pan-Werte nativ an und synchronisiert das Viewport-Punktraster
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: NATIVE Canvas Engine, 4-Seiten Handles & Flow-Arrows
 * ERSETZEN IN: canvas.js (Funktion applyCanvasTransform)
 * Breadcrumbs:
 *   - [2026-08-26] LOD-Logik entfernt (verursachte visuelle Artefakte und Flickern).
 *     GPU-Beschleunigung über CSS "will-change" ist ausreichend performant.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: NATIVE Canvas Engine & Viewport Caching
 * ERSETZEN IN: canvas.js (Funktion applyCanvasTransform)
 * Zeitstempel: 2026-08-26 20:10:00 CEST
 * Breadcrumbs:
 *   - [2026-08-26] Position (PanX, PanY) und Zoom (Scale) im localStorage sichern.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: NATIVE Canvas Engine (Zero-Flicker GPU Transform)
 * ERSETZEN IN: canvas.js (Funktion applyCanvasTransform)
 * =============================================================================
 */
function applyCanvasTransform(animate = false) {
    const canvasEl = document.getElementById('canvas');
    const viewportEl = document.getElementById('viewport');
    if (!canvasEl || !viewportEl) return;

    if (animate) {
        canvasEl.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
        viewportEl.style.transition = 'background-position 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-size 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
        setTimeout(() => {
            canvasEl.style.transition = 'none';
            viewportEl.style.transition = 'none';
        }, 200);
    } else {
        canvasEl.style.transition = 'none';
        viewportEl.style.transition = 'none';
    }

    canvasEl.style.transformOrigin = '0 0';
    // GPU-Beschleunigung erzwingen (translate3d)
    canvasEl.style.transform = `translate3d(${window.currentPanX}px, ${window.currentPanY}px, 0) scale(${window.currentScale})`;

    // Viewport-Raster nur über Position/Größe schieben (KEIN neu zeichnen des radial-gradients!)
    const scaledGridSize = 24 * window.currentScale;
    viewportEl.style.backgroundSize = `${scaledGridSize}px ${scaledGridSize}px`;
    viewportEl.style.backgroundPosition = `${window.currentPanX}px ${window.currentPanY}px`;

    // Viewport-Zustand im Cache sichern
    localStorage.setItem('cad_tm_panX', window.currentPanX);
    localStorage.setItem('cad_tm_panY', window.currentPanY);
    localStorage.setItem('cad_tm_scale', window.currentScale);
}

window.handleLiveSplineMove = function (e) {
    if (connectingFirstNodeId) {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        renderConnections(coords);
    }
};

// Schaltet Notizen zwischen "zugeklappt (Icon)" und "offen" um
window.toggleNoteCollapse = async function (e, nodeId) {
    if (e) e.stopPropagation();
    const node = currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    // Status wechseln
    node.completion_status = node.completion_status === 'collapsed' ? 'open' : 'collapsed';

    // UI sofort aktualisieren
    if (typeof renderCanvas === 'function') renderCanvas();

    // In der Datenbank speichern
    await db.from('project_nodes').update({ completion_status: node.completion_status }).eq('id', nodeId);
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Canvas Kontextmenü (Rechtsklick Handling inkl. Notizen)
 * Breadcrumb: [2026-08-25 17:45:00 CEST] Notiz-Menüpunkt in Kontext-Steuerung integriert
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Canvas Kontextmenü (Löschschutz 1 Stunde)
 * ERSETZEN IN: canvas.js (Funktionen handleCanvasContextMenu & handleContextMenuAction)
 * Zeitstempel: 2026-08-27 18:30:00 CEST
 * Breadcrumbs:
 *   - [2026-08-27 18:30:00 CEST]: 60-Minuten-Zeitfenster auch im Kontextmenü 
 *     für Rechtsklick-Löschungen integriert.
 * =============================================================================
 */
window.handleCanvasContextMenu = function (e) {
    e.preventDefault();
    if (e.target.closest('button, input, select, .sidebar')) return;

    const menu = document.getElementById('canvasContextMenu');
    const itemDuplicate = document.getElementById('ctxMenuDuplicateNode');
    const itemDelete = document.getElementById('ctxMenuDeleteNode');
    const itemAddBlock = document.getElementById('ctxMenuAddBlock');
    const itemAddZone = document.getElementById('ctxMenuAddZone');
    const itemAddNote = document.getElementById('ctxMenuAddNote');

    const cardEl = e.target.closest('.assembly-card, .note-card');
    if (cardEl) {
        contextTargetNodeId = cardEl.id;
        const targetNode = currentNodes.find(n => n.id === contextTargetNodeId);

        if (targetNode) {
            const nodeLogs = currentTimeLogs.filter(l => l.node_id === targetNode.id);
            const isCreator = (activeUserCode && activeUserCode === targetNode.created_by);
            const createdAtTime = targetNode.created_at ? new Date(targetNode.created_at).getTime() : 0;
            const isWithinOneHour = (Date.now() - createdAtTime) <= (60 * 60 * 1000);

            const canDelete = isAdmin || (isCreator && nodeLogs.length === 0 && isWithinOneHour);

            if (itemDuplicate) itemDuplicate.style.display = targetNode.block_type === 'note' ? 'none' : 'flex';
            if (itemDelete) itemDelete.style.display = canDelete ? 'flex' : 'none';
        }

        if (itemAddBlock) itemAddBlock.style.display = 'none';
        if (itemAddZone) itemAddZone.style.display = 'none';
        if (itemAddNote) itemAddNote.style.display = 'none';
    } else {
        contextTargetNodeId = null;
        if (itemDuplicate) itemDuplicate.style.display = 'none';
        if (itemDelete) itemDelete.style.display = 'none';
        if (itemAddBlock) itemAddBlock.style.display = 'flex';
        if (itemAddZone) itemAddZone.style.display = 'flex';
        if (itemAddNote) itemAddNote.style.display = 'flex';
    }

    if (menu) {
        menu.style.display = 'block';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
    }

    contextMenuCoords = getCanvasCoords(e.clientX, e.clientY);
};

window.cancelConnectionMode = function () {
    connectingFirstNodeId = null;
    connectingFirstPoint = null;
    renderConnections();
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Panzoom & Touch-Navigation
 * ERSETZEN IN: canvas.js (Funktion initPanzoom komplett ersetzen)
 * Breadcrumbs:
 *   - [2026-08-25] Touch-Support ergänzt: Single-Finger Panning, Pinch-to-Zoom 
 *     und Long-Press (600ms) als Ersatz für den Rechtsklick (Kontextmenü).
 * =============================================================================
 */
function initPanzoom() {
    const viewport = document.getElementById('viewport');
    applyCanvasTransform();

    // =========================================================================
    // 1. BESTEHENDER MAUS-CODE (Wheel & Drag)
    // =========================================================================
    viewport.addEventListener('wheel', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        e.preventDefault();

        const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
        const newScale = Math.min(Math.max(window.currentScale * zoomFactor, 0.05), 5.0);

        const rect = viewport.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        const pivotX = (clientX - window.currentPanX) / window.currentScale;
        const pivotY = (clientY - window.currentPanY) / window.currentScale;

        window.currentPanX = window.currentPanX - (pivotX * (newScale - window.currentScale));
        window.currentPanY = window.currentPanY - (pivotY * (newScale - window.currentScale));
        window.currentScale = newScale;

        applyCanvasTransform();
    }, { passive: false });

    let isDraggingCanvas = false;
    let startMouseX = 0, startMouseY = 0;

    /**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Panzoom Drag Controller (Button & Zone Action Guard)
 * ERSETZEN IN: canvas.js (Im mousedown-Listener von initPanzoom)
 * Zeitstempel: 2026-08-29 20:58:00 CEST
 * Breadcrumbs:
 *   - [2026-08-29 20:58:00 CEST]: .zone-btn, .zone-actions und .zone-body explizit 
 *     vom Viewport-Canvas-Drag ausgeschlossen, damit Klicks zuverlässig feuern.
 * =============================================================================
 */
    /**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Panzoom & Global Zonen-Log Auto-Close
 * ERSETZEN IN: canvas.js (Im mousedown-Listener von initPanzoom)
 * Zeitstempel: 2026-08-29 20:42:00 CEST
 * Breadcrumbs:
 *   - [2026-08-27 17:50:00 CEST]: Single-Expanded-Log Prinzip.
 *   - [2026-08-29 20:42:00 CEST]: Zuverlässiger Auto-Close für offene Zonen-Logs
 *     über globalen mousedown-Listener implementiert (umgeht pointer-events & Drag-Locks).
 * =============================================================================
 */
    /**
     * =============================================================================
     * Projekt: CAD Time Manager
     * Domain: Panzoom & Gezielter Zonen-Auto-Close (Outside-Zone-Click)
     * ERSETZEN IN: canvas.js (Im mousedown-Listener von initPanzoom)
     * Zeitstempel: 2026-08-29 20:46:00 CEST
     * Breadcrumbs:
     *   - [2026-08-29 20:42:00 CEST]: Globaler Auto-Close.
     *   - [2026-08-29 20:46:00 CEST]: Bounding-Box-Prüfung integriert. Klicks 
     *     innerhalb des aktiven Rahmens lassen das Log-Panel offen (Panning möglich), 
     *     Klicks außerhalb schließen das Panel sofort.
     * =============================================================================
     */
    viewport.addEventListener('mousedown', (e) => {
        // 1. Auto-Close nur wenn AUSSERHALB des geöffneten Rahmens geklickt wird
        if (window.expandedZones && window.expandedZones.size > 0) {
            const isInsideLogBody = e.target.closest('.zone-body');
            const isTimesBtn = e.target.closest('.btn-toggle-zone-times');

            if (!isInsideLogBody && !isTimesBtn) {
                const canvasCoords = getCanvasCoords(e.clientX, e.clientY);
                let clickedInsideActiveZone = false;

                for (const zoneId of window.expandedZones) {
                    const activeZone = (currentZones || []).find(z => z.id === zoneId);
                    if (activeZone) {
                        const zX = parseFloat(activeZone.pos_x) || 0;
                        const zY = parseFloat(activeZone.pos_y) || 0;
                        const zW = parseFloat(activeZone.width) || 0;
                        const zH = parseFloat(activeZone.height) || 0;

                        if (
                            canvasCoords.x >= zX && canvasCoords.x <= (zX + zW) &&
                            canvasCoords.y >= zY && canvasCoords.y <= (zY + zH)
                        ) {
                            clickedInsideActiveZone = true;
                            break;
                        }
                    }
                }

                if (!clickedInsideActiveZone) {
                    window.expandedZones.clear();
                    renderCanvas();
                }
            }
        }

        if (e.target.id === 'canvas' || e.target.id === 'viewport' || e.target.id === 'connections-layer') {
            if (selectedNodeIds.size > 0) {
                selectedNodeIds.clear();
                renderCanvas();
            }
        }

        const isControl = e.target.closest('button, input, select, .assembly-card, .note-card, .project-zone-header, .zone-resize-handle, .zone-actions, .zone-body, .zone-btn');
        if (!isControl || e.target.id === 'canvas' || e.target.id === 'viewport' || e.target.id === 'connections-layer') {
            isDraggingCanvas = true;
            startMouseX = e.clientX - window.currentPanX;
            startMouseY = e.clientY - window.currentPanY;
            viewport.style.cursor = 'grabbing';
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isDraggingCanvas) {
            window.currentPanX = e.clientX - startMouseX;
            window.currentPanY = e.clientY - startMouseY;
            applyCanvasTransform();
        }
    });

    window.addEventListener('mouseup', () => {
        isDraggingCanvas = false;
        viewport.style.cursor = 'grab';
    });

    viewport.addEventListener('mousemove', handleLiveSplineMove);
    viewport.addEventListener('contextmenu', handleCanvasContextMenu);

    // =========================================================================
    // 2. NEUER TOUCH-CODE (Pan, Zoom, Long-Press)
    // =========================================================================
    let isDraggingCanvasTouch = false;
    let startTouchX = 0, startTouchY = 0;
    let initialPinchDist = null;
    let initialPinchScale = 1;
    let longPressTimer = null;
    let touchHasMoved = false;

    const getPinchDistance = (touches) => {
        return Math.hypot(
            touches[0].clientX - touches[1].clientX,
            touches[0].clientY - touches[1].clientY
        );
    };

    const getPinchCenter = (touches) => {
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
    };

    viewport.addEventListener('touchstart', (e) => {
        if (e.target.closest('button, input, select')) return;
        touchHasMoved = false;

        if (e.touches.length === 1) {
            const touch = e.touches[0];

            // Long-Press Timer starten (600ms) für das Kontextmenü
            longPressTimer = setTimeout(() => {
                if (!touchHasMoved) {
                    const fakeEvent = {
                        preventDefault: () => { },
                        target: e.target,
                        clientX: touch.clientX,
                        clientY: touch.clientY
                    };
                    handleCanvasContextMenu(fakeEvent);
                }
            }, 600);

            // Klick ins Leere hebt die Auswahl auf
            if (e.target.id === 'canvas' || e.target.id === 'viewport' || e.target.id === 'connections-layer') {
                if (selectedNodeIds.size > 0) {
                    selectedNodeIds.clear();
                    renderCanvas();
                }
            }

            const isControl = e.target.closest('.assembly-card, .note-card, .project-zone-header, .zone-resize-handle, .ep-handle');
            if (!isControl || e.target.id === 'canvas' || e.target.id === 'viewport' || e.target.id === 'connections-layer') {
                isDraggingCanvasTouch = true;
                startTouchX = touch.clientX - window.currentPanX;
                startTouchY = touch.clientY - window.currentPanY;
            }
        } else if (e.touches.length === 2) {
            clearTimeout(longPressTimer);
            isDraggingCanvasTouch = false;
            initialPinchDist = getPinchDistance(e.touches);
            initialPinchScale = window.currentScale;
        }
    }, { passive: false });

    viewport.addEventListener('touchmove', (e) => {
        if (e.target.closest('button, input, select')) return;

        touchHasMoved = true;
        clearTimeout(longPressTimer);

        if (e.touches.length === 1 && isDraggingCanvasTouch) {
            e.preventDefault(); // Verhindert mobiles Pull-to-Refresh
            window.currentPanX = e.touches[0].clientX - startTouchX;
            window.currentPanY = e.touches[0].clientY - startTouchY;
            applyCanvasTransform();
        } else if (e.touches.length === 2 && initialPinchDist) {
            e.preventDefault();
            const currentPinchDist = getPinchDistance(e.touches);
            const scaleFactor = currentPinchDist / initialPinchDist;

            let newScale = Math.min(Math.max(initialPinchScale * scaleFactor, 0.05), 5.0);

            const center = getPinchCenter(e.touches);
            const rect = viewport.getBoundingClientRect();
            const clientX = center.x - rect.left;
            const clientY = center.y - rect.top;

            const pivotX = (clientX - window.currentPanX) / window.currentScale;
            const pivotY = (clientY - window.currentPanY) / window.currentScale;

            window.currentPanX = window.currentPanX - (pivotX * (newScale - window.currentScale));
            window.currentPanY = window.currentPanY - (pivotY * (newScale - window.currentScale));
            window.currentScale = newScale;

            initialPinchDist = currentPinchDist;
            initialPinchScale = window.currentScale;

            applyCanvasTransform();
        }
    }, { passive: false });

    viewport.addEventListener('touchend', (e) => {
        clearTimeout(longPressTimer);
        if (e.touches.length < 2) initialPinchDist = null;
        if (e.touches.length === 0) isDraggingCanvasTouch = false;
    });

    viewport.addEventListener('touchcancel', () => {
        clearTimeout(longPressTimer);
        isDraggingCanvasTouch = false;
        initialPinchDist = null;
    });

    // =========================================================================
    // 3. TASTATUR-EVENTS & BUTTONS
    // =========================================================================
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

        if (e.key === 'Escape') {
            if (connectingFirstNodeId) {
                cancelConnectionMode();
                showToast('Verbindungsvorgang abgebrochen', 'info');
            }
            if (typeof connectingFlowZoneId !== 'undefined' && connectingFlowZoneId) {
                connectingFlowZoneId = null;
                showToast('Materialfluss abgebrochen', 'info');
            }
            if (selectedNodeIds.size > 0) {
                selectedNodeIds.clear();
                renderCanvas();
            }
        }

        if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'c' || e.code === 'KeyC')) {
            if (selectedNodeIds.size > 0) {
                window.copiedNodeIds = Array.from(selectedNodeIds);
                showToast(`${window.copiedNodeIds.length} Block(s) kopiert`, 'info');
            } else if (window.hoveredNodeId) {
                window.copiedNodeIds = [window.hoveredNodeId];
                const n = currentNodes.find(x => x.id === window.hoveredNodeId);
                showToast(`"${n ? n.name : 'Block'}" kopiert`, 'info');
            }
        }

        if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'v' || e.code === 'KeyV')) {
            if (window.copiedNodeIds && window.copiedNodeIds.length > 0) {
                if (typeof window.handlePasteNodes === 'function') window.handlePasteNodes();
            }
        }
    });

    document.getElementById('btnZoomIn').addEventListener('click', () => {
        const newScale = Math.min(window.currentScale * 1.2, 5.0);
        const rect = viewport.getBoundingClientRect();
        const pivotX = (rect.width / 2 - window.currentPanX) / window.currentScale;
        const pivotY = (rect.height / 2 - window.currentPanY) / window.currentScale;
        window.currentPanX = window.currentPanX - (pivotX * (newScale - window.currentScale));
        window.currentPanY = window.currentPanY - (pivotY * (newScale - window.currentScale));
        window.currentScale = newScale;
        applyCanvasTransform(true);
    });

    document.getElementById('btnZoomOut').addEventListener('click', () => {
        const newScale = Math.max(window.currentScale * 0.8, 0.05);
        const rect = viewport.getBoundingClientRect();
        const pivotX = (rect.width / 2 - window.currentPanX) / window.currentScale;
        const pivotY = (rect.height / 2 - window.currentPanY) / window.currentScale;
        window.currentPanX = window.currentPanX - (pivotX * (newScale - window.currentScale));
        window.currentPanY = window.currentPanY - (pivotY * (newScale - window.currentScale));
        window.currentScale = newScale;
        applyCanvasTransform(true);
    });

    document.getElementById('btnZoomReset').addEventListener('click', () => {
        if (window.centerViewOnVisible) window.centerViewOnVisible();
    });
}

function getCanvasCoords(clientX, clientY) {
    const viewport = document.getElementById('viewport');
    const rect = viewport.getBoundingClientRect();
    return {
        x: (clientX - rect.left - window.currentPanX) / window.currentScale,
        y: (clientY - rect.top - window.currentPanY) / window.currentScale
    };
}

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Canvas Kontextmenü Aktionen
 * ERSETZEN IN: canvas.js (Funktion handleContextMenuAction)
 * Breadcrumb: [2026-08-24 20:05:00 CEST] doc_number bei Instanz-Duplizierung ergänzt
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Canvas Kontextmenü (Notiz-Titel Parsing beim Löschen)
 * ERSETZEN IN: canvas.js (Funktion handleContextMenuAction)
 * Zeitstempel: 2026-08-31 17:35:00 CEST
 * Breadcrumbs:
 *   - [2026-08-27 18:30:00 CEST]: 60-Minuten-Zeitfenster für Löschung.
 *   - [2026-08-31 17:35:00 CEST]: parseNotePayload bei Notizen/To-Dos integriert,
 *     damit im Lösch-Dialog der Text statt des JSON-Strings erscheint.
 * =============================================================================
 */
window.handleContextMenuAction = async function (type) {
    const menu = document.getElementById('canvasContextMenu');
    if (menu) menu.style.display = 'none';

    if (type === 'toggle_handles') {
        if (typeof toggleHandles === 'function') toggleHandles();
        return;
    }

    if (type === 'block') {
        handleOpenAddBlockModal(contextMenuCoords.x - 160, contextMenuCoords.y - 50);
    } else if (type === 'zone') {
        handleOpenAddZoneModal(contextMenuCoords.x, contextMenuCoords.y);
    } else if (type === 'note') {
        if (typeof handleOpenAddNoteModal === 'function') handleOpenAddNoteModal(contextMenuCoords.x, contextMenuCoords.y);
    } else if (type === 'duplicate' && contextTargetNodeId) {
        const originalNode = currentNodes.find(n => n.id === contextTargetNodeId);
        if (!originalNode) return;

        let linkedId = originalNode.linked_id;
        if (!linkedId) {
            linkedId = 'inst_' + crypto.randomUUID();
            originalNode.linked_id = linkedId;
            const { error: updateErr } = await db.from('project_nodes').update({ linked_id: linkedId }).eq('id', originalNode.id);
            if (updateErr) {
                console.error("Fehler beim Verknüpfen der Instanz:", updateErr);
                showToast('Fehler beim Verknüpfen der Instanz', 'error');
                return;
            }
        }

        const newPosX = Math.round(originalNode.pos_x + 50);
        const newPosY = Math.round(originalNode.pos_y + 50);

        const targetZone = (typeof getDeepestZoneAt === 'function')
            ? getDeepestZoneAt(newPosX + 160, newPosY + 100)
            : null;
        const targetZoneId = targetZone ? targetZone.id : null;

        const { error } = await db.from('project_nodes').insert([{
            project_id: activeProjectId,
            name: originalNode.name,
            doc_number: originalNode.doc_number || null,
            article_number: originalNode.article_number || null,
            block_type: originalNode.block_type || 'assembly',
            budget_design_hours: originalNode.budget_design_hours || 0,
            budget_drafting_hours: originalNode.budget_drafting_hours || 0,
            color_hex: originalNode.color_hex || '#2b6cb0',
            created_by: activeUserCode || 'COT',
            assigned_design_user: originalNode.assigned_design_user || null,
            assigned_drafting_user: originalNode.assigned_drafting_user || null,
            pos_x: newPosX,
            pos_y: newPosY,
            linked_id: linkedId,
            zone_id: targetZoneId
        }]).select();

        if (error) {
            console.error("Fehler beim Duplizieren:", error);
            showToast('Fehler beim Duplizieren: ' + error.message, 'error');
            return;
        }

        showToast(`Verknüpfte Instanz von "${originalNode.name}" erstellt`, 'success');
        await fetchCanvasData();
    } else if (type === 'delete' && contextTargetNodeId) {
        const nodeToDelete = currentNodes.find(n => n.id === contextTargetNodeId);
        if (!nodeToDelete) return;

        const isNote = (nodeToDelete.block_type === 'note' || nodeToDelete.doc_number === 'NOTE' || nodeToDelete.doc_number === 'TODO');
        const nodeLogs = currentTimeLogs.filter(l => l.node_id === nodeToDelete.id);
        const isCreator = (activeUserCode && activeUserCode === nodeToDelete.created_by);
        const createdAtTime = nodeToDelete.created_at ? new Date(nodeToDelete.created_at).getTime() : 0;
        const isWithinOneHour = (Date.now() - createdAtTime) <= (60 * 60 * 1000);

        const canDelete = isAdmin || (isCreator && nodeLogs.length === 0 && isWithinOneHour);

        if (!canDelete) {
            showToast('Löschen nur innerhalb 60 Min. nach Erstellung oder durch Admin.', 'error');
            return;
        }

        let displayName = nodeToDelete.name;
        if (isNote) {
            const parsed = (typeof parseNotePayload === 'function')
                ? parseNotePayload(nodeToDelete.name)
                : { text: nodeToDelete.name };
            displayName = parsed.text ? (parsed.text.length > 30 ? parsed.text.substring(0, 30) + '...' : parsed.text) : 'Notiz';
        }

        const confirmed = await customConfirm(isNote ? 'Notiz löschen' : 'Block löschen', `Möchtest du "${displayName}" wirklich entfernen?`);
        if (confirmed) {
            await db.from('project_nodes').delete().eq('id', nodeToDelete.id);
            showToast(isNote ? 'Notiz gelöscht' : 'Block gelöscht', 'success');
            await fetchCanvasData();
        }
    }
};
function getNodeHandleCoords(node, handleType) {
    const nodeEl = document.getElementById(node.id);
    const w = nodeEl ? nodeEl.offsetWidth : 320;
    const h = nodeEl ? nodeEl.offsetHeight : 200;

    switch (handleType) {
        case 'top': return { x: node.pos_x + w / 2, y: node.pos_y };
        case 'bottom': return { x: node.pos_x + w / 2, y: node.pos_y + h };
        case 'left': return { x: node.pos_x, y: node.pos_y + h / 2 };
        case 'right': return { x: node.pos_x + w, y: node.pos_y + h / 2 };
        default: return { x: node.pos_x + w / 2, y: node.pos_y + h };
    }
}

window.handleEndpointClick = async function (e, nodeId, pointType) {
    e.stopPropagation();
    const node = currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    const pt = getNodeHandleCoords(node, pointType);

    if (!connectingFirstNodeId) {
        connectingFirstNodeId = nodeId;
        connectingFirstPoint = { x: pt.x, y: pt.y, handle: pointType };
        showToast(`Verbindungspunkt [${pointType.toUpperCase()}] gewählt. Ziel anklicken.`, 'info');
        renderCanvas();
    } else {
        if (connectingFirstNodeId === nodeId) {
            showToast('Ein Block kann nicht mit sich selbst verbunden werden.', 'error');
            cancelConnectionMode();
            return;
        }

        const firstNode = currentNodes.find(n => n.id === connectingFirstNodeId);
        const secondNode = node;
        const firstHandle = connectingFirstPoint.handle;
        const secondHandle = pointType;

        cancelConnectionMode();

        let parentNode = firstNode, childNode = secondNode;
        let sHandle = firstHandle, tHandle = secondHandle;

        if (firstHandle === 'top' || (firstHandle === 'left' && secondHandle === 'right')) {
            parentNode = secondNode; childNode = firstNode;
            sHandle = secondHandle; tHandle = firstHandle;
        }

        const exists = currentEdges.some(edge =>
            (edge.source === parentNode.id && edge.target === childNode.id) ||
            (edge.source === childNode.id && edge.target === parentNode.id)
        );

        if (!exists) {
            const newEdge = {
                project_id: activeProjectId,
                source: parentNode.id,
                target: childNode.id,
                source_handle: sHandle,
                target_handle: tHandle,
                created_by: activeUserCode || 'COT'
            };
            currentEdges.push(newEdge);
            await db.from('project_edges').insert([newEdge]);
            showToast(`Verknüpfung erstellt (${parentNode.name} ➔ ${childNode.name})`, 'success');
            renderCanvas();
        } else {
            showToast('Diese Verbindung existiert bereits.', 'info');
        }
    }
};

window.handleStartZoneFlow = function (e, zoneId) {
    e.stopPropagation();
    if (!connectingFlowZoneId) {
        connectingFlowZoneId = zoneId;
        const z = currentZones.find(item => item.id === zoneId);
        showToast(`Materialfluss von "${z ? z.title : ''}" gewählt. Klicke Ziel-Rahmen ➔ an.`, 'info');
    } else {
        if (connectingFlowZoneId === zoneId) {
            connectingFlowZoneId = null;
            showToast('Materialfluss abgebrochen', 'info');
            return;
        }
        createZoneFlowArrow(connectingFlowZoneId, zoneId);
        connectingFlowZoneId = null;
    }
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Materialfluss-Pfeile Rendering & Typen-Fix
 * ERSETZEN IN: canvas.js
 * Breadcrumbs:
 *   - [2026-08-23 20:00:00 CEST]: ID-Vergleich (String-Cast) korrigiert, Pfeilspitzen-Marker
 *     sicher initialisiert und Koordinaten-Parsing auf Float abgesichert.
 * =============================================================================
 */
async function createZoneFlowArrow(sourceId, targetId) {
    const srcZone = currentZones.find(z => String(z.id) === String(sourceId));
    const tgtZone = currentZones.find(z => String(z.id) === String(targetId));
    if (!srcZone || !tgtZone) return;

    const newArrow = {
        project_id: activeProjectId,
        source_zone_id: String(sourceId),
        target_zone_id: String(targetId),
        source_side: 'right',
        source_ratio: 0.5,
        target_side: 'left',
        target_ratio: 0.5,
        created_by: activeUserCode || 'COT'
    };

    const { data, error } = await db.from('zone_flow_arrows').insert([newArrow]).select().single();
    if (error) {
        console.error("Fehler beim Speichern des Pfeils:", error);
        showToast('Fehler beim Speichern des Pfeils', 'error');
        return;
    }

    if (!window.currentFlowArrows) window.currentFlowArrows = [];
    if (data) window.currentFlowArrows.push(data);

    showToast(`Materialfluss: ${srcZone.title} ➔ ${tgtZone.title}`, 'success');
    renderConnections();
}

window.handleDeleteFlowArrow = async function (arrowId) {
    const confirmed = await customConfirm('Materialfluss löschen', 'Möchtest du diesen Materialfluss-Pfeil entfernen?');
    if (confirmed) {
        await db.from('zone_flow_arrows').delete().eq('id', arrowId);
        if (window.currentFlowArrows) {
            window.currentFlowArrows = window.currentFlowArrows.filter(a => String(a.id) !== String(arrowId));
        }
        showToast('Pfeil entfernt', 'info');
        renderConnections();
    }
};

window.handleDisconnectClick = async function (sourceId, targetId) {
    const edge = currentEdges.find(e => e.source === sourceId && e.target === targetId);
    const edgeCreator = edge ? (edge.created_by || 'COT') : 'COT';
    const canDeleteEdge = isAdmin || (activeUserCode && activeUserCode === edgeCreator);

    if (!canDeleteEdge) {
        showToast(`Keine Berechtigung. Löschung nur durch ${edgeCreator} oder Admin.`, 'error');
        return;
    }

    const confirmed = await customConfirm('Verknüpfung trennen', 'Hierarchische Verbindung wirklich lösen?');
    if (confirmed) {
        await db.from('project_edges').delete().match({ source: sourceId, target: targetId, project_id: activeProjectId });
        currentEdges = currentEdges.filter(e => !(e.source === sourceId && e.target === targetId));
        showToast('Verbindung getrennt', 'success');
        renderCanvas();
    }
};

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

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: NATIVE Canvas Engine (Exklusives Log-Ausklappen für Blöcke)
 * ERSETZEN IN: canvas.js (Funktion toggleInlineLogs)
 * Zeitstempel: 2026-08-27 17:50:00 CEST
 * Breadcrumbs:
 *   - [2026-08-27 17:50:00 CEST]: Exklusiver Log-Modus: Schließt andere geöffnete
 *     Blöcke und Zonen vor dem Öffnen.
 * =============================================================================
 */
window.toggleInlineLogs = function (nodeId) {
    if (!window.expandedNodes) window.expandedNodes = new Set();
    if (!window.expandedZones) window.expandedZones = new Set();

    const isCurrentlyOpen = window.expandedNodes.has(nodeId);

    // Alle anderen Blöcke und Zonen schließen
    window.expandedNodes.clear();
    window.expandedZones.clear();

    if (!isCurrentlyOpen) {
        window.expandedNodes.add(nodeId);
    }
    renderCanvas();
};

function getZoneDepth(zoneId) {
    let depth = 0;
    let current = currentZones.find(z => z.id === zoneId);
    while (current && current.parent_zone_id) {
        depth++;
        current = currentZones.find(z => z.id === current.parent_zone_id);
        if (depth > 10) break;
    }
    return depth;
}

function getAllDescendantZones(zoneId) {
    const descendants = [];
    const queue = [zoneId];
    while (queue.length > 0) {
        const currentId = queue.shift();
        const children = currentZones.filter(z => z.parent_zone_id === currentId);
        children.forEach(c => {
            descendants.push(c.id);
            queue.push(c.id);
        });
    }
    return descendants;
}

function getDeepestZoneAt(x, y, excludeZoneIds = []) {
    let deepestZone = null;
    let maxDepth = -1;

    for (const z of currentZones) {
        if (excludeZoneIds.includes(z.id)) continue;
        if (x >= z.pos_x && x <= z.pos_x + z.width &&
            y >= z.pos_y && y <= z.pos_y + z.height) {
            const depth = getZoneDepth(z.id);
            if (depth > maxDepth) {
                maxDepth = depth;
                deepestZone = z;
            }
        }
    }
    return deepestZone;
}

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: NATIVE Canvas Engine (Zonen- und Node-Sichtbarkeits-Guard)
 * ERSETZEN IN: canvas.js (Funktion window.isZoneHidden)
 * Zeitstempel: 2026-08-27 18:20:00 CEST
 * Breadcrumbs:
 *   - [2026-08-27 18:20:00 CEST]: isZoneHidden gegen fehlerhafte Sets abgesichert.
 * =============================================================================
 */
window.isZoneHidden = function (zoneId) {
    if (!zoneId || !window.hiddenTopZoneIds || window.hiddenTopZoneIds.size === 0) return false;
    if (window.hiddenTopZoneIds.has(zoneId)) return true;

    let current = currentZones.find(x => x.id === zoneId);
    let depthGuard = 0;

    while (current && current.parent_zone_id && depthGuard < 10) {
        if (window.hiddenTopZoneIds.has(current.parent_zone_id)) return true;
        current = currentZones.find(x => x.id === current.parent_zone_id);
        depthGuard++;
    }

    return false;
};

window.centerViewOnVisible = function (targetZoneId = null) {
    if (!window.hiddenTopZoneIds) window.hiddenTopZoneIds = new Set();

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasElements = false;

    const updateBounds = (x, y, w, h) => {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x + w > maxX) maxX = x + w;
        if (y + h > maxY) maxY = y + h;
        hasElements = true;
    };

    if (targetZoneId) {
        const specific = currentZones.find(z => z.id === targetZoneId);
        if (specific) {
            updateBounds(parseFloat(specific.pos_x) || 0, parseFloat(specific.pos_y) || 0, parseFloat(specific.width) || 400, parseFloat(specific.height) || 300);
        }
    } else {
        const visibleZones = currentZones.filter(z => !window.isZoneHidden(z.id));
        visibleZones.forEach(z => {
            updateBounds(parseFloat(z.pos_x) || 0, parseFloat(z.pos_y) || 0, parseFloat(z.width) || 400, parseFloat(z.height) || 300);
        });

        const visibleNodes = currentNodes.filter(n => !isNodeHiddenByAncestor(n.id) && !(n.zone_id && window.isZoneHidden(n.zone_id)));
        visibleNodes.forEach(n => {
            updateBounds(parseFloat(n.pos_x) || 0, parseFloat(n.pos_y) || 0, 320, 200);
        });
    }

    /**
  * =============================================================================
  * Projekt: CAD Time Manager
  * Domain: Viewport & Kamera-Fokus
  * AUSTAUSCH IN: canvas.js (Funktion window.centerViewOnVisible - Letzte Zeilen)
  * =============================================================================
  */
    // ... (Der obere Teil von centerViewOnVisible bleibt gleich) ...

    if (!hasElements || !isFinite(minX) || !isFinite(minY)) {
        window.currentScale = 1;
        window.currentPanX = 50;
        window.currentPanY = 50;
        applyCanvasTransform(false); // <--- HIER AUF FALSE
        return;
    }

    const viewportEl = document.getElementById('viewport');
    const vw = viewportEl.clientWidth;
    const vh = viewportEl.clientHeight;

    const padding = 100;
    const bboxW = maxX - minX;
    const bboxH = maxY - minY;

    const centerX = minX + bboxW / 2;
    const centerY = minY + bboxH / 2;

    const scaleX = (vw - padding * 2) / Math.max(bboxW, 100);
    const scaleY = (vh - padding * 2) / Math.max(bboxH, 100);

    let targetScale = Math.min(scaleX, scaleY);
    targetScale = Math.max(0.05, Math.min(targetScale, 2.5));

    window.currentScale = targetScale;
    window.currentPanX = (vw / 2) - (centerX * window.currentScale);
    window.currentPanY = (vh / 2) - (centerY * window.currentScale);

    applyCanvasTransform(false); // <--- UND HIER AUF FALSE
};

window.toggleZoneLock = async function (e, zoneId) {
    e.stopPropagation();
    const zone = currentZones.find(z => z.id === zoneId);
    if (!zone) return;

    const newLock = !zone.is_locked;
    zone.is_locked = newLock;
    await db.from('project_zones').update({ is_locked: newLock }).eq('id', zoneId);
    showToast(`Bereich ${newLock ? 'gesperrt (Panzoom aktiv)' : 'entsperrt'}`, 'info');
    renderCanvas();
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: NATIVE Canvas Engine & Rendering
 * ERSETZEN IN: canvas.js (Funktion renderCanvas)
 * Zeitstempel: 2026-08-27 17:55:00 CEST
 * Breadcrumbs:
 *   - [2026-08-27 17:55:00 CEST]: Syntax-Fix: isZoneExpanded vor z-index deklariert,
 *     doppelten Drag-Block bereinigt und Z-Index Priorisierung für offene Logs gesetzt.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: NATIVE Canvas Engine & Rendering (Z-Index / Overlap Fix)
 * ERSETZEN IN: canvas.js (Funktion renderCanvas)
 * Zeitstempel: 2026-08-27 18:15:00 CEST
 * Breadcrumbs:
 *   - [2026-08-27 18:15:00 CEST]: Z-Index Architektur komplett überarbeitet.
 *     Rahmen-Hintergründe liegen nun immer ganz unten (auto), Blöcke auf Ebene 100, 
 *     und geöffnete Logs brechen aus der Hierarchie aus (Ebene 2000 bzw. 2500).
 *     Kein Element verdeckt mehr fälschlicherweise andere Blöcke.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: NATIVE Canvas Engine & Rendering (Crash-Proof Block Render)
 * ERSETZEN IN: canvas.js (Funktion renderCanvas)
 * Zeitstempel: 2026-08-27 18:25:00 CEST
 * Breadcrumbs:
 *   - [2026-08-27 18:25:00 CEST]: Defensives Null- & Set-Guarding eingefügt,
 *     um JS-Crashes beim Rendern von Blöcken (innen & außen) zuverlässig abzufangen.
 * =============================================================================
 */
function renderCanvas() {
    const canvas = document.getElementById('canvas');
    const svgLayer = document.getElementById('connections-layer');
    if (!canvas || !svgLayer) return;

    // Globale Sets und Arrays absichern
    if (!window.selectedNodeIds) window.selectedNodeIds = new Set();
    if (!window.expandedNodes) window.expandedNodes = new Set();
    if (!window.expandedZones) window.expandedZones = new Set();
    if (!window.collapsedParents) window.collapsedParents = new Set();
    if (!window.hiddenTopZoneIds) window.hiddenTopZoneIds = new Set();

    const existingCards = canvas.querySelectorAll('.assembly-card, .project-zone, .note-card');
    existingCards.forEach(c => c.remove());
    svgLayer.innerHTML = '';

    const rollups = (typeof calculateRollups === 'function') ? calculateRollups() : {};

    const nodeDirectStats = {};
    (currentNodes || []).forEach(n => {
        const logs = (currentTimeLogs || []).filter(l => l.node_id === n.id);
        let dSpent = 0, drSpent = 0;
        logs.forEach(l => {
            if (l.task_type === 'design') dSpent += parseFloat(l.hours) || 0;
            if (l.task_type === 'drafting') drSpent += parseFloat(l.hours) || 0;
        });
        nodeDirectStats[n.id] = {
            dBudg: parseFloat(n.budget_design_hours) || 0,
            drBudg: parseFloat(n.budget_drafting_hours) || 0,
            dSpent,
            drSpent
        };
    });

    const zoneRollups = {};
    (currentZones || []).forEach(z => {
        const zLogs = (currentTimeLogs || []).filter(l => l.zone_id === z.id || l.node_id === z.id);
        let dSpentDirect = 0, drSpentDirect = 0;
        zLogs.forEach(l => {
            if (l.task_type === 'design') dSpentDirect += parseFloat(l.hours) || 0;
            if (l.task_type === 'drafting') drSpentDirect += parseFloat(l.hours) || 0;
        });

        zoneRollups[z.id] = {
            dBudg: parseFloat(z.budget_design_hours) || 0,
            drBudg: parseFloat(z.budget_drafting_hours) || 0,
            dSpent: dSpentDirect,
            drSpent: drSpentDirect,
            directLogs: zLogs
        };
    });

    (currentNodes || []).forEach(n => {
        if (n.block_type === 'note' || n.doc_number === 'NOTE') return;

        const relatedIds = n.linked_id ? currentNodes.filter(x => x.linked_id === n.linked_id).map(x => x.id) : [n.id];
        const isEffectivelyLinked = relatedIds.length > 1;
        const masterObj = isEffectivelyLinked ? currentNodes.find(x => x.linked_id === n.linked_id) : n;
        const isMaster = !isEffectivelyLinked || (masterObj && masterObj.id === n.id);

        if (isMaster && n.zone_id && zoneRollups[n.zone_id] && nodeDirectStats[n.id]) {
            zoneRollups[n.zone_id].dBudg += nodeDirectStats[n.id].dBudg;
            zoneRollups[n.zone_id].drBudg += nodeDirectStats[n.id].drBudg;

            relatedIds.forEach(relId => {
                if (nodeDirectStats[relId]) {
                    zoneRollups[n.zone_id].dSpent += nodeDirectStats[relId].dSpent;
                    zoneRollups[n.zone_id].drSpent += nodeDirectStats[relId].drSpent;
                }
            });
        }
    });

    const zonesByDepthDesc = [...(currentZones || [])].sort((a, b) => getZoneDepth(b.id) - getZoneDepth(a.id));
    zonesByDepthDesc.forEach(z => {
        if (z.parent_zone_id && zoneRollups[z.parent_zone_id] && zoneRollups[z.id]) {
            zoneRollups[z.parent_zone_id].dBudg += zoneRollups[z.id].dBudg;
            zoneRollups[z.parent_zone_id].drBudg += zoneRollups[z.id].drBudg;
            zoneRollups[z.parent_zone_id].dSpent += zoneRollups[z.id].dSpent;
            zoneRollups[z.parent_zone_id].drSpent += zoneRollups[z.id].drSpent;
        }
    });

    const sortedZones = [...(currentZones || [])].sort((a, b) => getZoneDepth(a.id) - getZoneDepth(b.id));


    /**
         * =============================================================================
         * Projekt: CAD Time Manager
         * Domain: NATIVE Canvas Engine & Rendering (Visibility DOM Fix)
         * ERSETZEN IN: canvas.js (Funktion renderCanvas -> 1. ZONEN RENDERN)
         * Zeitstempel: 2026-08-29 20:30:00 CEST
         * Breadcrumbs:
         *   - [2026-08-29 20:30:00 CEST]: Zerstörerische 'return'-Abbrüche bei versteckten 
         *     Zonen und Blöcken entfernt. Alle Elemente müssen zwingend ins DOM gerendert 
         *     werden, damit die CSS-Isolation (syncVisibilityToDOM) nach einem Datenbank-Refresh 
         *     (z.B. Rename) nicht ins Leere greift.
         * =============================================================================
         */
    /**
     * =============================================================================
     * Projekt: CAD Time Manager
     * Domain: NATIVE Canvas Engine & Rendering (Z-Index Fix für Zonen-Logs)
     * ERSETZEN IN: canvas.js (Funktion renderCanvas -> 1. ZONEN RENDERN)
     * Zeitstempel: 2026-08-29 20:45:00 CEST
     * Breadcrumbs:
     *   - [2026-08-27 18:15:00 CEST]: Z-Index Architektur überarbeitet.
     *   - [2026-08-29 20:45:00 CEST]: Fix: Der Z-Index des gesamten Rahmens wird beim 
     *     Ausklappen der Zonen-Logs temporär auf 2500 angehoben, damit das 
     *     Log-Fenster nicht hinter Baugruppen (Z-Index 100) verschwindet.
     * =============================================================================
     */
    /**
  * =============================================================================
  * Projekt: CAD Time Manager
  * Domain: NATIVE Canvas Engine & Rendering (Zonen Header & Auto-Close Fix)
  * ERSETZEN IN: canvas.js (Funktion renderCanvas -> 1. ZONEN RENDERN)
  * Zeitstempel: 2026-08-29 20:45:00 CEST
  * Breadcrumbs:
  *   - [2026-08-29 20:30:00 CEST]: Visibility DOM Fix & Z-Index Korrektur.
  *   - [2026-08-29 20:45:00 CEST]: 
  *     1. Header-Layout: Buttons direkt neben den Budgets verankert (flex-wrap ohne 100% Stretch).
  *     2. Auto-Close: Bubble-Schutz für .zone-actions & .zone-btn eingebaut, damit Klick auf '⏱️ Zeiten' nicht sofort wieder schließt.
  * =============================================================================
  */
    /**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: NATIVE Canvas Engine & Rendering (Zonen-Logs Fix & Auto-Close)
 * ERSETZEN IN: canvas.js (Funktion renderCanvas -> 1. ZONEN RENDERN)
 * Zeitstempel: 2026-08-29 20:52:00 CEST
 * Breadcrumbs:
 *   - [2026-08-29 20:52:00 CEST]: 
 *     1. mousedown auf .zone-actions stoppt sofortige Drag-Initiierung.
 *     2. Kompaktes 420px Log-Panel auf der linken Seite fixiert.
 *     3. Auto-Close: Klick in freie Rahmenfläche schließt offene Logs zuverlässig.
 * =============================================================================
 */
    /**
   * =============================================================================
   * Projekt: CAD Time Manager
   * Domain: NATIVE Canvas Engine & Rendering (Robuste DOM-Event Anbindung)
   * ERSETZEN IN: canvas.js (Funktion renderCanvas -> 1. ZONEN RENDERN)
   * Zeitstempel: 2026-08-29 21:00:00 CEST
   * Breadcrumbs:
   *   - [2026-08-29 21:00:00 CEST]: Direkte EventListener-Bindung für '⏱️ Zeiten' 
   *     und den Zonen-Hintergrund (Auto-Close) statt Inline-HTML-Attributen.
   * =============================================================================
   */
    /**
  * =============================================================================
  * Projekt: CAD Time Manager
  * Domain: NATIVE Canvas Engine & Rendering (Zonen Header 1-Line Layout Fix)
  * ERSETZEN IN: canvas.js (Funktion renderCanvas -> 1. ZONEN RENDERN)
  * Zeitstempel: 2026-08-29 20:55:00 CEST
  * Breadcrumbs:
  *   - [2026-08-29 20:52:00 CEST]: Direct Event-Binding & Auto-Close.
  *   - [2026-08-29 20:55:00 CEST]: Header auf eine einheitliche Zeile ausgerichtet:
  *     Titelbereich (260px) -> Budgets -> Zeiten-Button. Aktionen oben rechts verankert.
  * =============================================================================
  */
    // 1. ZONEN RENDERN
    /**
  * =============================================================================
  * Projekt: CAD Time Manager
  * Domain: NATIVE Canvas Engine & Rendering (Zonen-Header 2-Zeilen-Layout)
  * ERSETZEN IN: canvas.js (Funktion renderCanvas -> 1. ZONEN RENDERN)
  * Zeitstempel: 2026-08-29 21:10:00 CEST
  * Breadcrumbs:
  *   - [2026-08-29 20:55:00 CEST]: 1-Zeilen Layout.
  *   - [2026-08-29 21:10:00 CEST]: Header-Layout auf 2 Zeilen umgestellt:
  *     Zeile 1: Titel & Zuweisungskürzel
  *     Zeile 2: Pie Charts (CAD & Zeichnung) direkt unterhalb + "⏱️ Zeiten"-Button daneben.
  *     Top-Right: Aktionen (Fluss, Sperren, Edit, Löschen) oben rechts verankert.
  * =============================================================================
  */
    // 1. ZONEN RENDERN
    sortedZones.forEach(zone => {
        const zoneEl = document.createElement('div');
        zoneEl.id = zone.id;
        const canMoveZone = (isAdmin || (activeUserCode && activeUserCode === zone.created_by)) && !zone.is_locked;
        const isZoneExpanded = window.expandedZones && window.expandedZones.has(zone.id);

        zoneEl.className = `project-zone ${zone.is_locked ? 'zone-locked' : 'no-pan'} ${canMoveZone ? 'draggable-enabled' : ''}`;
        zoneEl.style.left = `${zone.pos_x}px`;
        zoneEl.style.top = `${zone.pos_y}px`;
        zoneEl.style.width = `${zone.width}px`;
        zoneEl.style.height = `${zone.height}px`;
        zoneEl.style.borderColor = zone.color_hex || '#a0aec0';
        zoneEl.style.zIndex = isZoneExpanded ? '2500' : 'auto';

        const zStats = zoneRollups[zone.id] || { dSpent: 0, dBudg: 0, drSpent: 0, drBudg: 0, directLogs: [] };
        const zdPieStyle = generatePieStyle(zStats.dSpent, zStats.dBudg, zone.color_hex || '#a0aec0');
        const zdrPieStyle = generatePieStyle(zStats.drSpent, zStats.drBudg, '#38a169');

        // Aggregierter Rahmenfortschritt
        const childBlocks = (currentNodes || []).filter(n => n.zone_id === zone.id && n.block_type !== 'note');
        let zoneProgress = 0;
        if (childBlocks.length > 0) {
            let totalWeightedScore = 0;
            let totalWeights = 0;

            childBlocks.forEach(bn => {
                const pD = (bn.progress_design !== null && bn.progress_design !== undefined) ? bn.progress_design : (bn.completion_status === 'completed' ? 100 : 0);
                const pDr = (bn.progress_drafting !== null && bn.progress_drafting !== undefined) ? bn.progress_drafting : (bn.completion_status === 'completed' ? 100 : 0);
                const bTotalProg = (pD * 0.5) + (pDr * 0.5);

                const bWeight = (parseFloat(bn.budget_design_hours) || 0) + (parseFloat(bn.budget_drafting_hours) || 0) || 1;
                totalWeightedScore += (bTotalProg * bWeight);
                totalWeights += bWeight;
            });

            zoneProgress = Math.round(totalWeightedScore / totalWeights);
        }

        const identifier = zone.article_number || zone.doc_number || '';
        let badgeHtml = '';
        if (identifier || childBlocks.length > 0) {
            const docLabel = identifier ? `<span class="badge-doc-text">${escapeHtml(identifier)}</span>` : '';
            const barHtml = childBlocks.length > 0 ? `
                <div class="zone-progress-track" title="Fortschritt Rahmen: ${zoneProgress}%">
                    <div class="zone-progress-fill" style="width: ${zoneProgress}%; background: ${zoneProgress === 100 ? '#38a169' : (zoneProgress > 50 ? '#3182ce' : '#dd6b20')};"></div>
                    <span class="zone-progress-label">${zoneProgress}%</span>
                </div>
            ` : '';

            badgeHtml = `
              <div class="assembly-id-badge zone-badge-container" style="border-color: ${zone.color_hex || '#a0aec0'};">
                ${docLabel}
                ${barHtml}
              </div>
            `;
        }

        const zLogs = zStats.directLogs || [];
        let inlineZoneLogsHtml = '';

        if (isZoneExpanded) {
            if (zLogs.length === 0) {
                inlineZoneLogsHtml = `<div style="font-size:10px; color:#718096; text-align:center; padding: 6px 0;">Keine Zeiten direkt auf diesen Rahmen gebucht.</div>`;
            } else {
                let tableRows = '';
                zLogs.forEach(log => {
                    const d = new Date(log.logged_at);
                    const dateStr = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                    const kat = log.task_type === 'design' ? 'CAD' : 'Zeichn.';
                    const badge = log.status === 'approved' ? '<span class="badge-approved">OK</span>' : '<span class="badge-pending">Wartend</span>';
                    const canDel = isAdmin || (log.status === 'pending' && log.user_code === activeUserCode);
                    const delHtml = canDel ? `<span class="btn-delete-log" title="Löschen" onclick="handleDeleteLog('${log.id}')">✕</span>` : '';
                    const noteHtml = log.note ? `<span class="info-tooltip-trigger" style="font-size:10px;">ℹ️<span class="tooltip-overlay">${escapeHtml(log.note)}</span></span>` : '';

                    tableRows += `
                      <tr>
                        <td><strong>${escapeHtml(log.user_code)}</strong></td>
                        <td>${dateStr}</td>
                        <td>${kat}</td>
                        <td>${formatHoursToHM(log.hours)} ${noteHtml}</td>
                        <td>${badge} ${delHtml}</td>
                      </tr>`;
                });
                inlineZoneLogsHtml = `
                  <table class="log-table" style="background:#fff; border-radius:4px; margin-top:6px;">
                    <thead><tr><th>Kürzel</th><th>Datum</th><th>Kat.</th><th>Zeit</th><th>Status</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                  </table>`;
            }
        }

        /**
         * =============================================================================
         * Projekt: CAD Time Manager
         * Domain: Canvas Engine (Container-Kategorie mit strichliertem Icon)
         * ERSETZEN IN: canvas.js (In renderCanvas -> Zonen-Header Icon-Zuweisung)
         * Zeitstempel: 2026-08-31 18:10:00 CEST
         * Breadcrumbs:
         *   - [2026-08-29 21:10:00 CEST]: Zonen-Header Rendering.
         *   - [2026-08-31 18:10:00 CEST]: Typ 'container' mit Strichlinien-Rahmen Icon (⬚) ergänzt.
         * =============================================================================
         */
        let assignedBadgesHtml = '';
        if (zone.assigned_design_user) {
            assignedBadgesHtml += `<span class="author-badge" style="background:#2b6cb0; margin-left:6px; display:inline-flex; align-items:center; gap:3px; font-size:10px; padding:1px 5px;" title="CAD / 3D: ${escapeHtml(zone.assigned_design_user)}"><span style="border:1.5px solid #fff; border-radius:2px; padding:0 2px; font-size:8px; line-height:1; font-weight:bold;">3D</span> <strong>${escapeHtml(zone.assigned_design_user)}</strong></span>`;
        }
        if (zone.assigned_drafting_user) {
            assignedBadgesHtml += `<span class="author-badge" style="background:#38a169; margin-left:4px; display:inline-flex; align-items:center; gap:3px; font-size:10px; padding:1px 5px;" title="Zeichnung: ${escapeHtml(zone.assigned_drafting_user)}">📄 <strong>${escapeHtml(zone.assigned_drafting_user)}</strong></span>`;
        }

        let zIcon = CAD_ICONS ? CAD_ICONS.location : '📍';
        if (zone.zone_type === 'assembly') zIcon = CAD_ICONS ? CAD_ICONS.assembly : '📦';
        else if (zone.zone_type === 'comment') zIcon = CAD_ICONS ? CAD_ICONS.comment : '💬';
        else if (zone.zone_type === 'container') zIcon = CAD_ICONS ? CAD_ICONS.container : '⬚';

        zoneEl.innerHTML = `
      ${badgeHtml}
      <div class="project-zone-header no-pan" style="position: relative; z-index: 50; border-bottom-color: ${zone.color_hex || '#a0aec0'}; padding-right: 140px; display: flex; flex-direction: column; gap: 5px; align-items: flex-start; padding: 8px 12px;">
        
        <!-- Zeile 1: Titel & Zuweisungen -->
        <div style="display:flex; align-items:center; overflow: hidden; white-space: nowrap; max-width: 100%;">
          <span style="font-weight: bold; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(zone.title)}">${zIcon} ${escapeHtml(zone.title)}</span>
          ${assignedBadgesHtml}
        </div>

        <!-- Zeile 2: Pie Charts direkt unterhalb + Button -->
        <div style="display:flex; gap: 24px; align-items: center; margin-top: 1px;">
            <div style="display:flex; align-items: center; gap: 6px;" title="CAD Budget">
                <div class="pie-chart" style="${zdPieStyle}; width: 22px; height: 22px;">
                    <div class="pie-inner" style="width: 14px; height: 14px;"></div>
                </div>
                <div style="display:flex; flex-direction:column; font-size: 10px; line-height: 1.15;">
                    <span style="color: #4a5568; font-weight: 800;">CAD</span>
                    <span style="color: #718096; font-family: monospace;">${formatHoursToHM(zStats.dSpent)} / ${formatHoursToHM(zStats.dBudg)}</span>
                </div>
            </div>
            <div style="display:flex; align-items: center; gap: 6px;" title="Zeichnung Budget">
                <div class="pie-chart" style="${zdrPieStyle}; width: 22px; height: 22px;">
                    <div class="pie-inner" style="width: 14px; height: 14px;"></div>
                </div>
                <div style="display:flex; flex-direction:column; font-size: 10px; line-height: 1.15;">
                    <span style="color: #4a5568; font-weight: 800;">Zeichnung</span>
                    <span style="color: #718096; font-family: monospace;">${formatHoursToHM(zStats.drSpent)} / ${formatHoursToHM(zStats.drBudg)}</span>
                </div>
            </div>
            <button type="button" class="zone-btn btn-toggle-zone-times" title="Zeiten auf Rahmen buchen & Details" style="padding: 2px 7px; font-weight: bold; border: 1px solid #cbd5e0; border-radius: 4px; background: #fff; flex-shrink: 0; font-size: 11px;">⏱️ Zeiten</button>
        </div>

        <!-- Aktionen in der rechten oberen Ecke -->
        <div class="zone-actions" style="position: absolute; right: 10px; top: 8px; display: flex; gap: 6px; align-items: center; z-index: 60;">
          <button type="button" class="zone-flow-btn" title="Materialfluss-Pfeil ziehen" onclick="handleStartZoneFlow(event, '${zone.id}')">➔ Fluss</button>
          <button type="button" class="zone-btn" title="Position sperren/entsperren" onclick="toggleZoneLock(event, '${zone.id}')">${zone.is_locked ? '🔒' : '🔓'}</button>
          <button type="button" class="zone-btn" title="Bearbeiten" onclick="openEditZoneModal('${zone.id}')">✏️</button>
          ${isAdmin || (activeUserCode && activeUserCode === zone.created_by) ? `
            <button type="button" class="zone-btn" style="color:#e53e3e;" title="Löschen" onclick="handleDeleteZone('${zone.id}')">✕</button>
          ` : ''}
        </div>
      </div>

      ${isZoneExpanded ? `
      <div class="zone-body no-pan" style="position: absolute; top: 56px; left: 10px; z-index: 2500; background: rgba(255, 255, 255, 0.98); padding: 10px; border: 1px solid #cbd5e0; border-radius: 6px; pointer-events: auto; box-shadow: 0 6px 16px rgba(0,0,0,0.18); width: 420px; max-width: 420px;">
        <form class="log-form" onsubmit="handleZoneLog(event, '${zone.id}')">
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
            <input type="number" class="log-input input-mins" min="0" step="5" value="30" style="width: 44px;" title="Minuten (Mausrad: +/- 5m)" onwheel="handleTimeWheel(event, 'min')" required />
            <span>m</span>
          </div>
          <div style="display: flex; gap: 4px; margin-top: 6px;">
            <input type="text" class="log-input" placeholder="Kommentar (optional)..." style="flex: 1;" />
            <button type="submit" class="btn-log" style="background: ${zone.color_hex || '#2b6cb0'};">+ Log</button>
          </div>
        </form>
        ${inlineZoneLogsHtml}
      </div>
      ` : ''}

      <div class="zone-resize-handle no-pan" style="position: absolute; z-index: 50;" title="Größe anpassen"></div>
    `;

        // Direkte Event-Bindung für '⏱️ Zeiten'
        const btnTimes = zoneEl.querySelector('.btn-toggle-zone-times');
        if (btnTimes) {
            btnTimes.addEventListener('mousedown', (e) => e.stopPropagation());
            btnTimes.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof window.toggleZoneLogs === 'function') {
                    window.toggleZoneLogs(e, zone.id);
                }
            });
        }

        // Klicks innerhalb der offenen Log-Maske isolieren
        const zoneBody = zoneEl.querySelector('.zone-body');
        if (zoneBody) {
            zoneBody.addEventListener('mousedown', (e) => e.stopPropagation());
            zoneBody.addEventListener('click', (e) => e.stopPropagation());
        }

        if (canMoveZone) {
            let isDragging = false;
            let startX = 0, startY = 0;
            let initLeft = 0, initTop = 0;
            let childStartPos = [];
            let childZonesStartPos = [];
            let descendantZoneIds = [];
            let allMovedZoneIds = [];
            let descendantZones = [];
            let childNodes = [];

            const startZoneDrag = (e) => {
                if (e.target.closest('.zone-actions, .zone-resize-handle, .zone-body, input, select, button')) return;
                if (e.type === 'touchstart' && e.touches.length > 1) return;

                window.isDraggingAnything = true;
                isDragging = true;
                const scale = window.currentScale || 1;

                startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

                initLeft = zone.pos_x;
                initTop = zone.pos_y;

                descendantZoneIds = getAllDescendantZones(zone.id);
                allMovedZoneIds = [zone.id, ...descendantZoneIds];
                descendantZones = currentZones.filter(z => descendantZoneIds.includes(z.id));
                childNodes = currentNodes.filter(n => allMovedZoneIds.includes(n.zone_id));

                childStartPos = childNodes.map(n => ({ id: n.id, x: n.pos_x, y: n.pos_y }));
                childZonesStartPos = descendantZones.map(z => ({ id: z.id, x: z.pos_x, y: z.pos_y }));

                if (e.cancelable) e.stopPropagation();

                const onMouseMove = (moveEvent) => {
                    if (!isDragging) return;
                    if (moveEvent.type === 'touchmove' && moveEvent.cancelable) moveEvent.preventDefault();

                    const clientX = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientX : moveEvent.clientX;
                    const clientY = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientY : moveEvent.clientY;

                    const dx = (clientX - startX) / scale;
                    const dy = (clientY - startY) / scale;

                    const newParentX = Math.max(10, Math.round(initLeft + dx));
                    const newParentY = Math.max(10, Math.round(initTop + dy));
                    const actualDx = newParentX - initLeft;
                    const actualDy = newParentY - initTop;

                    zone.pos_x = newParentX;
                    zone.pos_y = newParentY;
                    zoneEl.style.left = `${zone.pos_x}px`;
                    zoneEl.style.top = `${zone.pos_y}px`;

                    descendantZones.forEach((z, idx) => {
                        z.pos_x = childZonesStartPos[idx].x + actualDx;
                        z.pos_y = childZonesStartPos[idx].y + actualDy;
                        const zEl = document.getElementById(z.id);
                        if (zEl) {
                            zEl.style.left = `${z.pos_x}px`;
                            zEl.style.top = `${z.pos_y}px`;
                        }
                    });

                    childNodes.forEach((n, idx) => {
                        n.pos_x = childStartPos[idx].x + actualDx;
                        n.pos_y = childStartPos[idx].y + actualDy;
                        const nEl = document.getElementById(n.id);
                        if (nEl) {
                            nEl.style.left = `${n.pos_x}px`;
                            nEl.style.top = `${n.pos_y}px`;
                        }
                    });

                    const headerCenterX = zone.pos_x + (zone.width / 2);
                    const headerCenterY = zone.pos_y + 20;
                    const targetZone = getDeepestZoneAt(headerCenterX, headerCenterY, allMovedZoneIds);

                    currentZones.forEach(z => {
                        const zEl = document.getElementById(z.id);
                        if (zEl) {
                            if (targetZone && z.id === targetZone.id) zEl.classList.add('zone-hover-highlight');
                            else zEl.classList.remove('zone-hover-highlight');
                        }
                    });

                    renderConnections();
                };

                /**
                 * =============================================================================
                 * Projekt: CAD Time Manager
                 * Domain: NATIVE Canvas Engine & Rendering (Zonen-Drag Sidebar Sync)
                 * ERSETZEN IN: canvas.js (In renderCanvas -> startZoneDrag -> onMouseUp)
                 * Zeitstempel: 2026-08-31 17:55:00 CEST
                 * Breadcrumbs:
                 *   - [2026-08-29 21:10:00 CEST]: Zonen-Drag & Drop Hierarchie-Zuordnung.
                 *   - [2026-08-31 17:55:00 CEST]: renderSidebarZones() nach dem Verschieben von
                 *     Rahmen direkt aufgerufen, damit Hierarchie-Wechsel sofort in der Sidebar sichtbar sind.
                 * =============================================================================
                 */
                const onMouseUp = async () => {
                    if (!isDragging) return;
                    isDragging = false;

                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                    window.removeEventListener('touchmove', onMouseMove);
                    window.removeEventListener('touchend', onMouseUp);
                    window.removeEventListener('touchcancel', onMouseUp);

                    const headerCenterX = zone.pos_x + (zone.width / 2);
                    const headerCenterY = zone.pos_y + 20;
                    const targetZone = getDeepestZoneAt(headerCenterX, headerCenterY, allMovedZoneIds);
                    const newParentId = targetZone ? targetZone.id : null;

                    if (newParentId) {
                        const parentDepth = getZoneDepth(newParentId);
                        let maxChildRelativeDepth = 0;
                        descendantZoneIds.forEach(id => {
                            let d = getZoneDepth(id) - getZoneDepth(zone.id);
                            if (d > maxChildRelativeDepth) maxChildRelativeDepth = d;
                        });

                        if (parentDepth + 1 + maxChildRelativeDepth >= 5) {
                            showToast('Maximale Verschachtelung von 5 Ebenen erreicht!', 'error');
                        } else {
                            zone.parent_zone_id = newParentId;
                        }
                    } else {
                        zone.parent_zone_id = null;
                    }

                    currentZones.forEach(z => {
                        const zEl = document.getElementById(z.id);
                        if (zEl) zEl.classList.remove('zone-hover-highlight');
                    });

                    const updates = childNodes.map(n => db.from('project_nodes').update({ pos_x: n.pos_x, pos_y: n.pos_y }).eq('id', n.id));
                    descendantZones.forEach(z => {
                        updates.push(db.from('project_zones').update({ pos_x: z.pos_x, pos_y: z.pos_y }).eq('id', z.id));
                    });
                    updates.push(db.from('project_zones').update({
                        pos_x: zone.pos_x,
                        pos_y: zone.pos_y,
                        parent_zone_id: zone.parent_zone_id
                    }).eq('id', zone.id));

                    await Promise.all(updates);

                    window.isDraggingAnything = false;
                    if (window.pendingCanvasUpdate) {
                        window.pendingCanvasUpdate = false;
                        if (typeof fetchCanvasData === 'function') fetchCanvasData();
                    } else {
                        if (typeof renderCanvas === 'function') renderCanvas();
                        // NEU: Sidebar sofort nach dem Umhängen des Rahmens synchronisieren
                        if (typeof window.renderSidebarZones === 'function') window.renderSidebarZones();
                    }
                };

                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
                window.addEventListener('touchmove', onMouseMove, { passive: false });
                window.addEventListener('touchend', onMouseUp);
                window.addEventListener('touchcancel', onMouseUp);
            };

            zoneEl.addEventListener('mousedown', startZoneDrag);
            zoneEl.addEventListener('touchstart', startZoneDrag, { passive: false });
        }

        const resizeHandle = zoneEl.querySelector('.zone-resize-handle');
        if (resizeHandle && (isAdmin || (activeUserCode && activeUserCode === zone.created_by))) {
            const startZoneResize = (e) => {
                if (e.type === 'touchstart' && e.touches.length > 1) return;
                if (e.cancelable) e.stopPropagation();

                window.isDraggingAnything = true;
                let isResizing = true;
                const scale = window.currentScale || 1;
                const startW = zone.width;
                const startH = zone.height;

                const startMouseX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                const startMouseY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

                const onResizeMove = (moveEvent) => {
                    if (!isResizing) return;
                    if (moveEvent.type === 'touchmove' && moveEvent.cancelable) moveEvent.preventDefault();

                    const clientX = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientX : moveEvent.clientX;
                    const clientY = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientY : moveEvent.clientY;

                    const dw = (clientX - startMouseX) / scale;
                    const dh = (clientY - startMouseY) / scale;
                    const newW = Math.max(200, Math.round(startW + dw));
                    const newH = Math.max(150, Math.round(startH + dh));
                    zoneEl.style.width = `${newW}px`;
                    zoneEl.style.height = `${newH}px`;
                    zone.width = newW;
                    zone.height = newH;
                };

                const onResizeUp = async () => {
                    if (!isResizing) return;
                    isResizing = false;

                    window.removeEventListener('mousemove', onResizeMove);
                    window.removeEventListener('mouseup', onResizeUp);
                    window.removeEventListener('touchmove', onResizeMove);
                    window.removeEventListener('touchend', onResizeUp);
                    window.removeEventListener('touchcancel', onResizeUp);

                    await db.from('project_zones').update({ width: zone.width, height: zone.height }).eq('id', zone.id);

                    window.isDraggingAnything = false;
                    if (window.pendingCanvasUpdate) {
                        window.pendingCanvasUpdate = false;
                        fetchCanvasData();
                    }
                };

                window.addEventListener('mousemove', onResizeMove);
                window.addEventListener('mouseup', onResizeUp);
                window.addEventListener('touchmove', onResizeMove, { passive: false });
                window.addEventListener('touchend', onResizeUp);
                window.addEventListener('touchcancel', onResizeUp);
            };

            resizeHandle.addEventListener('mousedown', startZoneResize);
            resizeHandle.addEventListener('touchstart', startZoneResize, { passive: false });
        }

        canvas.appendChild(zoneEl);
    });

    // 2. KNOTEN / BLÖCKE / NOTIZEN RENDERN
    const originalNodes = currentNodes || [];
    const sortedNodes = originalNodes.map((n, idx) => ({ node: n, originalIdx: idx })).sort((a, b) => {
        const aIsExpanded = window.expandedNodes && window.expandedNodes.has(a.node.id);
        const bIsExpanded = window.expandedNodes && window.expandedNodes.has(b.node.id);
        const aIsTop = (window.topNodeId === a.node.id) || (window.selectedNodeIds && window.selectedNodeIds.has(a.node.id));
        const bIsTop = (window.topNodeId === b.node.id) || (window.selectedNodeIds && window.selectedNodeIds.has(b.node.id));

        const aTier = aIsExpanded ? 3 : (aIsTop ? 2 : 1);
        const bTier = bIsExpanded ? 3 : (bIsTop ? 2 : 1);

        if (aTier !== bTier) return aTier - bTier;
        return a.originalIdx - b.originalIdx;
    }).map(wrapper => wrapper.node);

    sortedNodes.forEach(node => {
        // HIER ENTFERNT: Die "Defensive Sichtbarkeitsprüfung" mit 'return' wurde gelöscht


        // 2a. STICKY NOTES & TO-DO CARDS
        // =============================================================================
        // Projekt: CAD Time Manager
        // Domain: NATIVE Canvas Engine (Persönlicher Filter & Rotes Pulsieren bei Überfälligkeit)
        // ERSETZEN IN: canvas.js (Abschnitt 2a in renderCanvas)
        // Zeitstempel: 2026-08-27 20:45:00 CEST
        // Breadcrumbs:
        //   - [2026-08-27 20:30:00 CEST]: Notizen & To-Do Rendering.
        //   - [2026-08-27 20:45:00 CEST]: Filter-Logik geschärft (Dimmen wenn nicht
        //     zugewiesen) & Klasse 'note-overdue' für pulsierende rote Warnung ergänzt.
        // =============================================================================
        if (node.block_type === 'note' || node.doc_number === 'NOTE' || node.doc_number === 'TODO') {
            const isPrivate = node.article_number === 'private';
            const isTodo = node.doc_number === 'TODO';
            const userCode = (activeUserCode || '').toUpperCase();
            const noteCreator = (node.created_by || '').toUpperCase();

            if (isPrivate && noteCreator !== userCode && !isAdmin) return;

            const isCollapsed = node.completion_status === 'collapsed';
            let noteW = parseFloat(node.budget_design_hours) || 220;
            let noteH = parseFloat(node.budget_drafting_hours) || (isTodo ? 140 : 90);
            if (noteW < 120) noteW = 220;
            if (noteH < 60) noteH = isTodo ? 140 : 90;

            // Daten parsen (JSON oder Legacy String)
            const noteData = (typeof parseNotePayload === 'function')
                ? parseNotePayload(node.name)
                : { text: node.name || '', dueDate: null, items: [] };

            const totalItems = noteData.items ? noteData.items.length : 0;
            const doneItems = noteData.items ? noteData.items.filter(i => i.done).length : 0;
            const isAllCompleted = isTodo && totalItems > 0 && doneItems === totalItems;

            // Überfälligkeits-Prüfung (nur aktiv wenn noch nicht alle Punkte abgehakt sind)
            let isOverdue = false;
            let isDueToday = false;
            if (isTodo && noteData.dueDate && !isAllCompleted) {
                const todayStr = new Date().toISOString().split('T')[0];
                isOverdue = noteData.dueDate < todayStr;
                isDueToday = noteData.dueDate === todayStr;
            }

            // Persönlicher Filter: Nur aktiv zugewiesene Notizen/To-Dos hervorheben, andere ausgrauen
            const isAssignedToMe = (node.assigned_design_user && node.assigned_design_user.toUpperCase() === userCode);
            const isCreatedByMe = (noteCreator === userCode);
            // Kriterium: Zugewiesen an mich ODER (falls keine Zuweisung existiert) von mir erstellt
            const matchesFilter = node.assigned_design_user ? isAssignedToMe : isCreatedByMe;
            const isDimmed = window.personalFilterActive && !matchesFilter;

            const el = document.createElement('div');
            el.id = node.id;
            const canDrag = isAdmin || (userCode === noteCreator);

            // =============================================================================
            // Projekt: CAD Time Manager
            // Domain: NATIVE Canvas Engine (Voll-Puls Inline-Bereinigung)
            // ERSETZEN IN: canvas.js (Im Bereich der Style-Zuweisung von el)
            // Zeitstempel: 2026-08-27 21:12:00 CEST
            // Breadcrumb: [2026-08-27 21:12:00 CEST] backgroundColor und border bei überfälligen
            // Notizen freigegeben, damit CSS-Keyframes vollflächig animieren.
            // =============================================================================
            el.className = `note-card no-pan ${canDrag ? 'draggable-enabled' : 'draggable-disabled'} ${isDimmed ? 'node-dimmed' : ''} ${isOverdue ? 'note-overdue' : ''}`;
            el.style.left = `${node.pos_x}px`;
            el.style.top = `${node.pos_y}px`;

            if (isOverdue) {
                // Keine fixen inline Farben, damit CSS overdueFullPulse steuern kann
                el.style.backgroundColor = '';
                el.style.border = '';
            } else {
                el.style.backgroundColor = node.color_hex || '#fefcbf';
                el.style.border = '1px solid rgba(0, 0, 0, 0.12)';
            }

            el.style.zIndex = isOverdue ? '180' : '150';

            el.style.width = isCollapsed ? '42px' : `${noteW}px`;
            el.style.height = isCollapsed ? '42px' : `${noteH}px`;
            el.style.minHeight = isCollapsed ? '42px' : (isTodo ? '90px' : '60px');
            el.style.padding = isCollapsed ? '0' : '8px 10px';
            el.style.justifyContent = isCollapsed ? 'center' : 'flex-start';
            el.style.alignItems = isCollapsed ? 'center' : 'stretch';

            const typeIcon = isTodo ? '☑️' : '📝';
            const progressBadge = (isTodo && totalItems > 0) ? `<span style="font-size:9px; font-weight:normal; opacity:0.8;">(${doneItems}/${totalItems})</span>` : '';
            const lockIcon = isPrivate ? '<span style="font-size:11px;" title="Private Notiz">🔒</span>' : '';

            let assignedHtml = '';
            if (node.assigned_design_user) {
                assignedHtml = `<span class="author-badge" style="background:#2b6cb0; font-size:8px; padding:0 3px;" title="Zugewiesen an: ${escapeHtml(node.assigned_design_user)}">👤 <strong>${escapeHtml(node.assigned_design_user)}</strong></span>`;
            }

            let dueBadgeHtml = '';
            if (isTodo && noteData.dueDate) {
                const dFormatted = new Date(noteData.dueDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
                let badgeClass = 'note-due-badge';
                if (isOverdue) badgeClass += ' overdue';
                else if (isDueToday) badgeClass += ' due-today';

                dueBadgeHtml = `<span class="${badgeClass}" title="Fällig am ${noteData.dueDate}">📅 ${dFormatted}</span>`;
            }

            if (isCollapsed) {
                el.innerHTML = `<div style="font-size:18px; line-height:1; pointer-events:none; user-select:none;" title="${escapeHtml(noteData.text || 'Notiz')}">${typeIcon}</div>`;
            } else {
                let checklistHtml = '';
                if (isTodo && noteData.items && noteData.items.length > 0) {
                    checklistHtml = `<div style="display:flex; flex-direction:column; gap:2px; margin-top:6px; max-height:120px; overflow-y:auto; pointer-events:auto;">`;
                    noteData.items.forEach((item, idx) => {
                        checklistHtml += `
                            <div class="note-todo-item ${item.done ? 'done' : ''}">
                                <input type="checkbox" ${item.done ? 'checked' : ''} onchange="handleToggleTodoItem(event, '${node.id}', ${idx})" />
                                <span style="word-break: break-word;">${escapeHtml(item.text)}</span>
                            </div>
                        `;
                    });
                    checklistHtml += `</div>`;
                }

                el.innerHTML = `
                    <div style="pointer-events: none; display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; font-size:10px; font-weight:bold; color:#4a5568; border-bottom:1px solid rgba(0,0,0,0.08); padding-bottom:3px;">
                        <div style="display:flex; align-items:center; gap:4px; overflow:hidden;">
                            <span title="${isTodo ? 'To-Do Liste' : 'Reine Notiz'}">${typeIcon}</span>
                            <span>${escapeHtml(node.created_by || 'COT')}</span>
                            ${assignedHtml}
                            ${progressBadge}
                            ${dueBadgeHtml}
                        </div>
                        <div style="pointer-events:auto; display:flex; gap:4px; align-items:center; flex-shrink:0;">
                            ${lockIcon}
                            <span onclick="toggleNoteCollapse(event, '${node.id}')" style="cursor:pointer; opacity:0.6; font-size:10px; border:1px solid rgba(0,0,0,0.1); border-radius:3px; padding:0 3px;" title="Zuklappen">−</span>
                        </div>
                    </div>
                    <div style="pointer-events: none; white-space: pre-wrap; word-break: break-word; font-size:11px; color:#2d3748; flex-shrink: 0;">${escapeHtml(noteData.text)}</div>
                    ${checklistHtml}
                    ${canDrag ? '<div class="note-resize-handle no-pan" title="Größe anpassen"></div>' : ''}
                `;
            }

            el.addEventListener('mouseenter', () => { window.hoveredNodeId = node.id; });
            el.addEventListener('mouseleave', () => { window.hoveredNodeId = null; });

            el.addEventListener('dblclick', (e) => {
                if (e.target.tagName === 'INPUT') return;
                e.stopPropagation();
                if (canDrag && typeof openEditNoteModal === 'function') openEditNoteModal(node.id);
            });

            if (canDrag) {
                let isDragging = false;
                let didDrag = false;
                let startClientX = 0, startClientY = 0;
                let initX = 0, initY = 0;

                /**
                           * =============================================================================
                           * Projekt: CAD Time Manager
                           * Domain: NATIVE Canvas Engine (Zonen-Highlighting für Notizen)
                           * ERSETZEN IN: canvas.js (Funktion startNoteDrag innerhalb von renderCanvas)
                           * Zeitstempel: 2026-08-29 20:15:00 CEST
                           * Breadcrumbs:
                           *   - [2026-08-27 20:45:00 CEST]: Filter-Logik geschärft & 'note-overdue' ergänzt.
                           *   - [2026-08-29 20:15:00 CEST]: Zonen-Hover-Highlighting beim Draggen 
                           *     von Notizen (analog zu Blöcken) hinzugefügt.
                           * =============================================================================
                           */
                const startNoteDrag = (e) => {
                    if (e.target.closest('.note-resize-handle, span[title="Zuklappen"], input[type="checkbox"]')) return;
                    if (e.type === 'mousedown' && e.button !== 0) return;
                    if (e.type === 'touchstart' && e.touches.length > 1) return;

                    window.isDraggingAnything = true;
                    isDragging = true;
                    didDrag = false;

                    startClientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                    startClientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

                    initX = node.pos_x;
                    initY = node.pos_y;
                    if (e.cancelable) e.stopPropagation();

                    const onMouseMove = (moveEvent) => {
                        if (!isDragging) return;
                        if (moveEvent.type === 'touchmove' && moveEvent.cancelable) moveEvent.preventDefault();

                        const clientX = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientX : moveEvent.clientX;
                        const clientY = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientY : moveEvent.clientY;

                        const scale = window.currentScale || 1;
                        const dx = (clientX - startClientX) / scale;
                        const dy = (clientY - startClientY) / scale;

                        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDrag = true;

                        node.pos_x = Math.round(initX + dx);
                        node.pos_y = Math.round(initY + dy);
                        el.style.left = `${node.pos_x}px`;
                        el.style.top = `${node.pos_y}px`;

                        // Zonen-Highlighting während des Verschiebens
                        const targetZone = (typeof getDeepestZoneAt === 'function')
                            ? getDeepestZoneAt(node.pos_x + 95, node.pos_y + 40)
                            : null;

                        (currentZones || []).forEach(z => {
                            const zEl = document.getElementById(z.id);
                            if (zEl) {
                                if (targetZone && z.id === targetZone.id) zEl.classList.add('zone-hover-highlight');
                                else zEl.classList.remove('zone-hover-highlight');
                            }
                        });
                    };

                    const onMouseUp = async () => {
                        if (!isDragging) return;
                        isDragging = false;

                        window.removeEventListener('mousemove', onMouseMove);
                        window.removeEventListener('mouseup', onMouseUp);
                        window.removeEventListener('touchmove', onMouseMove);
                        window.removeEventListener('touchend', onMouseUp);
                        window.removeEventListener('touchcancel', onMouseUp);

                        // Highlights beim Loslassen entfernen
                        (currentZones || []).forEach(z => {
                            const zEl = document.getElementById(z.id);
                            if (zEl) zEl.classList.remove('zone-hover-highlight');
                        });

                        const targetZone = (typeof getDeepestZoneAt === 'function')
                            ? getDeepestZoneAt(node.pos_x + 95, node.pos_y + 40)
                            : null;
                        const targetZoneId = targetZone ? targetZone.id : null;
                        node.zone_id = targetZoneId;

                        await db.from('project_nodes').update({
                            pos_x: node.pos_x,
                            pos_y: node.pos_y,
                            zone_id: targetZoneId
                        }).eq('id', node.id);

                        window.isDraggingAnything = false;
                        if (typeof renderCanvas === 'function') renderCanvas();
                        if (window.pendingCanvasUpdate && typeof fetchCanvasData === 'function') {
                            window.pendingCanvasUpdate = false;
                            fetchCanvasData();
                        }
                    };

                    window.addEventListener('mousemove', onMouseMove);
                    window.addEventListener('mouseup', onMouseUp);
                    window.addEventListener('touchmove', onMouseMove, { passive: false });
                    window.addEventListener('touchend', onMouseUp);
                    window.addEventListener('touchcancel', onMouseUp);
                };

                el.addEventListener('mousedown', startNoteDrag);
                el.addEventListener('touchstart', startNoteDrag, { passive: false });

                el.addEventListener('click', (e) => {
                    if (didDrag) { didDrag = false; return; }
                    if (isCollapsed) toggleNoteCollapse(e, node.id);
                });

                if (!isCollapsed) {
                    const resizeHandle = el.querySelector('.note-resize-handle');
                    if (resizeHandle) {
                        const startNoteResize = (e) => {
                            if (e.type === 'touchstart' && e.touches.length > 1) return;
                            if (e.cancelable) e.stopPropagation();

                            window.isDraggingAnything = true;
                            let isResizing = true;
                            const scale = window.currentScale || 1;
                            const startW = noteW;
                            const startH = noteH;

                            const startMouseX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                            const startMouseY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

                            const onResizeMove = (moveEvent) => {
                                if (!isResizing) return;
                                if (moveEvent.type === 'touchmove' && moveEvent.cancelable) moveEvent.preventDefault();

                                const clientX = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientX : moveEvent.clientX;
                                const clientY = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientY : moveEvent.clientY;

                                const dw = (clientX - startMouseX) / scale;
                                const dh = (clientY - startMouseY) / scale;

                                const newW = Math.max(140, Math.round(startW + dw));
                                const newH = Math.max(70, Math.round(startH + dh));

                                el.style.width = `${newW}px`;
                                el.style.height = `${newH}px`;
                                node.budget_design_hours = newW;
                                node.budget_drafting_hours = newH;
                            };

                            const onResizeUp = async () => {
                                if (!isResizing) return;
                                isResizing = false;

                                window.removeEventListener('mousemove', onResizeMove);
                                window.removeEventListener('mouseup', onResizeUp);
                                window.removeEventListener('touchmove', onResizeMove);
                                window.removeEventListener('touchend', onResizeUp);
                                window.removeEventListener('touchcancel', onResizeUp);

                                await db.from('project_nodes').update({
                                    budget_design_hours: node.budget_design_hours,
                                    budget_drafting_hours: node.budget_drafting_hours
                                }).eq('id', node.id);

                                window.isDraggingAnything = false;
                            };

                            window.addEventListener('mousemove', onResizeMove);
                            window.addEventListener('mouseup', onResizeUp);
                            window.addEventListener('touchmove', onResizeMove, { passive: false });
                            window.addEventListener('touchend', onResizeUp);
                            window.addEventListener('touchcancel', onResizeUp);
                        };

                        resizeHandle.addEventListener('mousedown', startNoteResize);
                        resizeHandle.addEventListener('touchstart', startNoteResize, { passive: false });
                    }
                }
            }

            canvas.appendChild(el);
            return;
        }

        // 2b. REGULÄRE BAUGRUPPEN / BAUTEILE
        // HIER ENTFERNT: Die isNodeHiddenByAncestor Abfrage mit 'return' wurde gelöscht

        const relatedNodeIds = node.linked_id
            ? currentNodes.filter(n => n.linked_id === node.linked_id).map(n => n.id)
            : [node.id];

        const isEffectivelyLinked = relatedNodeIds.length > 1;
        const masterNode = isEffectivelyLinked ? (currentNodes.find(n => n.linked_id === node.linked_id) || node) : node;
        const isMaster = !isEffectivelyLinked || (masterNode.id === node.id);

        let dSpentAgg = 0;
        let drSpentAgg = 0;
        relatedNodeIds.forEach(id => {
            const st = rollups[id] || { totalDesign: 0, totalDrafting: 0, logs: [] };
            dSpentAgg += st.totalDesign || 0;
            drSpentAgg += st.totalDrafting || 0;
        });

        const nodeLogs = (currentTimeLogs || []).filter(l => relatedNodeIds.includes(l.node_id));
        const nodeColor = node.color_hex || '#2b6cb0';
        const creator = node.created_by || 'COT';
        const bType = node.block_type || 'assembly';
        const typeLabel = bType === 'part' ? 'Bauteil' : 'Baugruppe';

        const canDrag = isAdmin || (activeUserCode && activeUserCode === creator);

        const dBudg = Math.max(0, parseFloat(masterNode.budget_design_hours) || 0);
        const dPct = dBudg > 0 ? Math.round((dSpentAgg / dBudg) * 100) : 0;
        const dPieStyle = generatePieStyle(dSpentAgg, dBudg, nodeColor);

        const drBudg = Math.max(0, parseFloat(masterNode.budget_drafting_hours) || 0);
        const drPct = drBudg > 0 ? Math.round((drSpentAgg / drBudg) * 100) : 0;
        const drPieStyle = generatePieStyle(drSpentAgg, drBudg, '#38a169');

        const dStr = isMaster ? `${formatHoursToHM(dSpentAgg)} / ${formatHoursToHM(dBudg)}` : `(${formatHoursToHM(dSpentAgg)} / ${formatHoursToHM(dBudg)})`;
        const drStr = isMaster ? `${formatHoursToHM(drSpentAgg)} / ${formatHoursToHM(drBudg)}` : `(${formatHoursToHM(drSpentAgg)} / ${formatHoursToHM(drBudg)})`;

        const isExpanded = window.expandedNodes.has(node.id);
        const hasChildren = (currentEdges || []).some(e => e.source === node.id);
        const isSubtreeCollapsed = window.collapsedParents.has(node.id);

        let subtreeBtnHtml = '';
        if (hasChildren) {
            subtreeBtnHtml = `
        <button type="button" class="btn-tree-toggle" title="${isSubtreeCollapsed ? 'Untergeordnete Blöcke einblenden' : 'Untergeordnete Blöcke ausblenden'}" onclick="toggleSubtreeCollapse(event, '${node.id}')">
          ${isSubtreeCollapsed ? '＋' : '－'}
        </button>
      `;
        }

        let completionBtnHtml = '';
        let statusIcon = '';
        if (node.completion_status === 'completed') {
            statusIcon = ' <span title="Erledigt">✅</span>';
            completionBtnHtml = `<span style="font-size: 10px; color: #38a169; font-weight: bold;">✅ Erledigt</span>`;
            if (isAdmin) {
                completionBtnHtml += ` <button type="button" style="margin-left:6px; background:none; border:1px solid #e53e3e; color:#e53e3e; border-radius:3px; font-size:9px; cursor:pointer; padding:1px 4px;" onclick="handleRevokeCompletion('${node.id}')">↺ Revision</button>`;
            }
        } else if (node.completion_status === 'pending_approval') {
            statusIcon = ' <span title="Wartet auf Freigabe">⏳</span>';
            completionBtnHtml = `<span style="font-size: 10px; color: #d69e2e; font-weight: bold;">⏳ Freigabe...</span>`;
            if (isAdmin) {
                completionBtnHtml += ` <button type="button" style="margin-left:6px; background:none; border:1px solid #e53e3e; color:#e53e3e; border-radius:3px; font-size:9px; cursor:pointer; padding:1px 4px;" onclick="handleRevokeCompletion('${node.id}')">✖ Ablehnen</button>`;
            }
        } else {
            completionBtnHtml = `<button type="button" style="background:none; border:none; color:#38a169; cursor:pointer; font-size:11px; font-weight:bold;" onclick="handleRequestCompletion('${node.id}')">✔ Fertigmelden</button>`;
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
                    const kat = log.task_type === 'design' ? 'CAD' : (log.task_type === 'drafting' ? 'Zeichn.' : 'Status');
                    const badge = log.status === 'approved' ? '<span class="badge-approved">OK</span>' : '<span class="badge-pending">Wartend</span>';

                    let timeFormatted = formatHoursToHM(log.hours);
                    if (log.task_type === 'completion') {
                        timeFormatted = log.note.includes('Revision') || log.note.includes('Ablehnen') ? '↺' : '✔';
                    }

                    let noteIconHtml = '';
                    if (log.note && log.note.trim() !== '') {
                        noteIconHtml = `
              <span class="info-tooltip-trigger">ℹ️
                <span class="tooltip-overlay">${escapeHtml(log.note)}</span>
              </span>
            `;
                    }

                    let deleteActionHtml = '';
                    const canDeleteLog = isAdmin || (log.status === 'pending' && log.user_code === activeUserCode);
                    if (canDeleteLog) {
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

        const isUserAssigned = (node.assigned_design_user === activeUserCode) || (node.assigned_drafting_user === activeUserCode);
        const isDimmed = window.personalFilterActive && !isUserAssigned;

        const identifier = node.article_number || node.doc_number || '';
        let badgeHtml = '';
        if (identifier) {
            badgeHtml = `<div class="assembly-id-badge" style="border-color: ${nodeColor};" title="${node.article_number ? 'Artikelnummer' : 'Vault DOC-Nummer'}">${escapeHtml(identifier)}</div>`;
        }

        const isConnectingThisNode = (connectingFirstNodeId === node.id);
        const isSelected = window.selectedNodeIds.has(node.id);

        const el = document.createElement('div');
        el.id = node.id;
        if (isEffectivelyLinked) el.dataset.linkedId = node.linked_id;

        el.className = `assembly-card no-pan ${canDrag ? 'draggable-enabled' : 'draggable-disabled'} ${isSelected ? 'selected-node' : ''} ${isDimmed ? 'node-dimmed' : ''}`;
        el.style.left = `${node.pos_x}px`;
        el.style.top = `${node.pos_y}px`;
        el.style.borderColor = nodeColor;
        el.style.borderStyle = (isEffectivelyLinked && !isMaster) ? 'dashed' : 'solid';
        el.style.zIndex = isExpanded ? 2000 : 100;

        const linkedIconHtml = isEffectivelyLinked
            ? `<span class="linked-icon" title="${isMaster ? 'Master-Instanz (Zeiten synchron)' : 'Referenz-Instanz (loggt auf Master)'}">🔗${isMaster ? '' : ' Ref'}</span>`
            : '';

        let assignedBadgesHtml = '';
        if (node.assigned_design_user) {
            assignedBadgesHtml += `<span class="author-badge" style="background:#2b6cb0; margin-left:3px; display:inline-flex; align-items:center; gap:3px;" title="CAD / 3D: ${escapeHtml(node.assigned_design_user)}"><span style="border:1.5px solid #fff; border-radius:2px; padding:0 2px; font-size:8px; line-height:1; font-weight:bold;">3D</span> <strong>${escapeHtml(node.assigned_design_user)}</strong></span>`;
        }
        if (node.assigned_drafting_user) {
            assignedBadgesHtml += `<span class="author-badge" style="background:#38a169; margin-left:3px; display:inline-flex; align-items:center; gap:3px;" title="Zeichnung: ${escapeHtml(node.assigned_drafting_user)}">📄 <strong>${escapeHtml(node.assigned_drafting_user)}</strong></span>`;
        }

        const typeIconSvg = bType === 'part' ? (window.CAD_ICONS ? CAD_ICONS.part : '⚙️') : (window.CAD_ICONS ? CAD_ICONS.assembly : '📦');

        // 50/50 Ladebalken-Werte
        const pDesign = (masterNode.progress_design !== null && masterNode.progress_design !== undefined) ? masterNode.progress_design : (masterNode.completion_status === 'completed' ? 100 : 0);
        const pDrafting = (masterNode.progress_drafting !== null && masterNode.progress_drafting !== undefined) ? masterNode.progress_drafting : (masterNode.completion_status === 'completed' ? 100 : 0);
        const pTotal = Math.round((pDesign * 0.5) + (pDrafting * 0.5));
        const cadSegmentWidth = Math.round(pDesign * 0.5);
        const drSegmentWidth = Math.round(pDrafting * 0.5);

        const progressBarHtml = `
            <div class="block-progress-wrapper" title="CAD: ${pDesign}% (50% Gewicht) | Zeichn: ${pDrafting}% (50% Gewicht)">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 3px; font-size: 10px; font-weight: bold;">
                    <span style="color:#4a5568;">Fortschritt</span>
                    <span style="color: ${pTotal === 100 ? '#22543d' : '#2b6cb0'};">${pTotal}%</span>
                </div>
                <div class="block-progress-track">
                    <div class="block-progress-segment cad" style="width: ${cadSegmentWidth}%;"></div>
                    <div class="block-progress-segment dr" style="width: ${drSegmentWidth}%;"></div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size: 8px; color: #718096; margin-top: 2px;">
                    <span>3D: ${pDesign}%</span>
                    <span>2D: ${pDrafting}%</span>
                </div>
            </div>
        `;

        el.innerHTML = `
      ${badgeHtml}
      <div id="ep-top-${node.id}" class="ep-handle ep-top ${isConnectingThisNode ? 'active-source' : ''}" title="Knotenpunkt oben" onclick="handleEndpointClick(event, '${node.id}', 'top')"></div>
      <div id="ep-bottom-${node.id}" class="ep-handle ep-bottom ${isConnectingThisNode ? 'active-source' : ''}" title="Knotenpunkt unten" onclick="handleEndpointClick(event, '${node.id}', 'bottom')"></div>
      <div id="ep-left-${node.id}" class="ep-handle ep-left ${isConnectingThisNode ? 'active-source' : ''}" title="Knotenpunkt links" onclick="handleEndpointClick(event, '${node.id}', 'left')"></div>
      <div id="ep-right-${node.id}" class="ep-handle ep-right ${isConnectingThisNode ? 'active-source' : ''}" title="Knotenpunkt rechts" onclick="handleEndpointClick(event, '${node.id}', 'right')"></div>

      <div class="assembly-header" style="background: ${nodeColor}; flex-direction: column; align-items: stretch; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div style="display: flex; align-items: center; overflow: hidden; white-space: nowrap; flex: 1;">
            ${subtreeBtnHtml}
            <span style="overflow: hidden; text-overflow: ellipsis; font-size: 14px; display: inline-flex; align-items: center; gap: 5px;" title="${escapeHtml(node.name)}">
              ${typeIconSvg} <strong>${escapeHtml(node.name)}</strong>
            </span>
          </div>
          <div style="flex-shrink: 0; margin-left: 6px; display: flex; align-items: center; gap: 4px;">
            ${statusIcon}${linkedIconHtml}
          </div>
        </div>
        <div class="header-meta" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div style="display: flex; gap: 4px; overflow: hidden;">
            ${assignedBadgesHtml}
          </div>
          <span class="author-badge" style="flex-shrink: 0;" title="Typ: ${typeLabel} | Ersteller: ${escapeHtml(creator)}">${escapeHtml(typeLabel)} [${escapeHtml(creator)}]</span>
        </div>
      </div>

      <div class="assembly-body">
        ${progressBarHtml}
        <div class="charts-grid">
          <div class="chart-box">
            <div class="pie-chart" style="${dPieStyle}">
              <div class="pie-inner">${dPct}%</div>
            </div>
            <div class="chart-label">CAD</div>
            <div class="chart-sub">${dStr}</div>
          </div>
          <div class="chart-box">
            <div class="pie-chart" style="${drPieStyle}">
              <div class="pie-inner">${drPct}%</div>
            </div>
            <div class="chart-label">Zeichnung</div>
            <div class="chart-sub">${drStr}</div>
          </div>
        </div>

        <hr class="divider" />
        <form class="log-form" onsubmit="handleLog(event, '${masterNode.id}')">
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
            <input type="number" class="log-input input-mins" min="0" step="5" value="30" style="width: 44px;" title="Minuten (Mausrad: +/- 5m)" onwheel="handleTimeWheel(event, 'min')" required />
            <span>m</span>
          </div>

          <div style="display: flex; gap: 4px;">
            <input type="text" class="log-input" placeholder="Kommentar (optional)..." style="flex: 1;" />
            <button type="submit" class="btn-log" style="background: ${nodeColor};">+ Log</button>
          </div>
        </form>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
            <button class="btn-expand-toggle" onclick="toggleInlineLogs('${node.id}')">
            ${isExpanded ? '▲ Logs ausblenden' : '▼ Details & Logs (' + nodeLogs.length + ')'}
            </button>
            ${completionBtnHtml}
        </div>

        ${inlineLogsHtml}
      </div>
    `;

        el.addEventListener('mouseenter', () => {
            window.hoveredNodeId = node.id;
            if (node.linked_id) {
                document.querySelectorAll(`.assembly-card[data-linked-id="${node.linked_id}"]`).forEach(card => card.classList.add('linked-highlight'));
            }
        });

        el.addEventListener('mouseleave', () => {
            window.hoveredNodeId = null;
            if (node.linked_id) {
                document.querySelectorAll(`.assembly-card[data-linked-id="${node.linked_id}"]`).forEach(card => card.classList.remove('linked-highlight'));
            }
        });

        el.addEventListener('click', (e) => {
            if (e.target.closest('button, input, select, .ep-handle')) return;
            e.stopPropagation();
            if (e.ctrlKey || e.metaKey || e.shiftKey) {
                if (window.selectedNodeIds.has(node.id)) window.selectedNodeIds.delete(node.id);
                else window.selectedNodeIds.add(node.id);
            } else {
                window.selectedNodeIds.clear();
                window.selectedNodeIds.add(node.id);
            }
            renderCanvas();
        });

        el.addEventListener('dblclick', (e) => {
            if (!e.target.closest('.ep-handle') && !e.target.closest('.btn-delete-log') && !e.target.closest('.btn-tree-toggle') && !e.target.closest('button')) {
                openConfigModal(node.id);
            }
        });

        if (canDrag) {
            let isDragging = false;
            let startClientX = 0, startClientY = 0;
            let initialNodePositions = new Map();

            const startBlockDrag = (e) => {
                if (e.target.closest('input, select, button, .ep-handle, .btn-delete-log, .btn-tree-toggle')) return;
                if (e.type === 'mousedown' && (e.ctrlKey || e.shiftKey || e.metaKey)) return;
                if (e.type === 'touchstart' && e.touches.length > 1) return;

                window.isDraggingAnything = true;
                isDragging = true;

                startClientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                startClientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

                if (e.cancelable) e.stopPropagation();

                const nodesToMove = (window.selectedNodeIds.has(node.id))
                    ? Array.from(window.selectedNodeIds).map(id => currentNodes.find(n => n.id === id)).filter(Boolean)
                    : [node];

                initialNodePositions.clear();
                nodesToMove.forEach(n => {
                    initialNodePositions.set(n.id, { x: n.pos_x, y: n.pos_y });
                });

                const onMouseMove = (moveEvent) => {
                    if (!isDragging) return;
                    if (moveEvent.type === 'touchmove' && moveEvent.cancelable) moveEvent.preventDefault();

                    const clientX = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientX : moveEvent.clientX;
                    const clientY = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientY : moveEvent.clientY;

                    const scale = window.currentScale || 1;
                    const dx = (clientX - startClientX) / scale;
                    const dy = (clientY - startClientY) / scale;

                    nodesToMove.forEach(n => {
                        const initPos = initialNodePositions.get(n.id);
                        if (!initPos) return;

                        const curX = Math.round(initPos.x + dx);
                        const curY = Math.round(initPos.y + dy);

                        n.pos_x = curX;
                        n.pos_y = curY;

                        const nodeEl = document.getElementById(n.id);
                        if (nodeEl) {
                            nodeEl.style.left = `${curX}px`;
                            nodeEl.style.top = `${curY}px`;
                        }
                    });

                    const primaryInit = initialNodePositions.get(nodesToMove[0].id);
                    if (primaryInit) {
                        const centerX = (primaryInit.x + dx) + 160;
                        const centerY = (primaryInit.y + dy) + 100;
                        const targetZone = getDeepestZoneAt(centerX, centerY);

                        (currentZones || []).forEach(z => {
                            const zEl = document.getElementById(z.id);
                            if (zEl) {
                                if (targetZone && z.id === targetZone.id) zEl.classList.add('zone-hover-highlight');
                                else zEl.classList.remove('zone-hover-highlight');
                            }
                        });
                    }

                    renderConnections();
                };

                const onMouseUp = async () => {
                    if (!isDragging) return;
                    isDragging = false;

                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                    window.removeEventListener('touchmove', onMouseMove);
                    window.removeEventListener('touchend', onMouseUp);
                    window.removeEventListener('touchcancel', onMouseUp);

                    let targetZoneId = null;
                    const primaryInit = initialNodePositions.get(nodesToMove[0].id);

                    if (primaryInit) {
                        const centerX = nodesToMove[0].pos_x + 160;
                        const centerY = nodesToMove[0].pos_y + 100;
                        const targetZone = getDeepestZoneAt(centerX, centerY);
                        targetZoneId = targetZone ? targetZone.id : null;
                    }

                    (currentZones || []).forEach(z => {
                        const zEl = document.getElementById(z.id);
                        if (zEl) zEl.classList.remove('zone-hover-highlight');
                    });

                    const updates = nodesToMove.map(n => {
                        n.zone_id = targetZoneId;
                        return db.from('project_nodes').update({
                            pos_x: n.pos_x,
                            pos_y: n.pos_y,
                            zone_id: targetZoneId
                        }).eq('id', n.id);
                    });

                    await Promise.all(updates);

                    window.isDraggingAnything = false;
                    if (window.pendingCanvasUpdate) {
                        window.pendingCanvasUpdate = false;
                        fetchCanvasData();
                    }
                };

                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
                window.addEventListener('touchmove', onMouseMove, { passive: false });
                window.addEventListener('touchend', onMouseUp);
                window.addEventListener('touchcancel', onMouseUp);
            };

            el.addEventListener('mousedown', startBlockDrag);
            el.addEventListener('touchstart', startBlockDrag, { passive: false });
        }

        canvas.appendChild(el);
    });

    if (typeof window.adjustCanvasBounds === 'function') window.adjustCanvasBounds();
    renderConnections();

    // NEU: Nachdem alles lückenlos ins DOM geladen wurde, übergeben wir an 
    // unsere Anti-Flacker-Engine, die isolierte Elemente per CSS versteckt.
    if (typeof window.syncVisibilityToDOM === 'function') window.syncVisibilityToDOM();
}
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Materialfluss (Automatische Kantenwahl Vertikal / Horizontal)
 * ERSETZEN IN: canvas.js (Funktion renderConnections)
 * Breadcrumbs:
 *   - [2026-08-23 20:25:00 CEST]: Automatische Wahl der optimalen Kanten
 *     (Top, Bottom, Left, Right) anhand der relativen Rahmenposition.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Splines & Flow-Arrows (Direkte Linienführung & kleine Pfeilspitze)
 * ERSETZEN IN: canvas.js (Funktion renderConnections)
 * Breadcrumbs:
 *   - [2026-08-23 20:30:00 CEST]: 
 *     1. Pfeilspitze auf 6x4 px verkleinert.
 *     2. Strikte Kantenwahl anhand der Box-Abstände (Bounding-Boxes).
 *     3. Tangentenhebel stark gekürzt für dezente, direkte Bögen.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Materialfluss Splines (Tangentiale Kurvenführung)
 * ERSETZEN IN: canvas.js (Funktion renderConnections)
 * Breadcrumbs:
 *   - [2026-08-23 20:45:00 CEST]: Tangenten-Hebel von 20px auf 80px erhöht. 
 *     Dadurch treten die Linien orthogonal aus den Kanten aus und der Pfeil 
 *     sitzt sauber im 90-Grad-Winkel auf der Zielkante.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Materialfluss Splines (Gerade Stutzen für perfekte Pfeilspitzen)
 * ERSETZEN IN: canvas.js (Funktion renderConnections)
 * Breadcrumbs:
 *   - [2026-08-23 20:55:00 CEST]: "Stub"-Logik (gerade Linienstücke) eingebaut.
 *     Jede Linie tritt nun exakt 10px gerade aus dem Kasten aus und 10px gerade
 *     in die Pfeilspitze ein, bevor der Spline-Bogen gerechnet wird. 
 *     Das verhindert schiefe Pfeilspitzen bei sehr knappen Abständen.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Materialfluss & Splines (Anti-Layout-Thrashing Fix)
 * ERSETZEN IN: canvas.js (Funktion renderConnections)
 * =============================================================================
 */
function renderConnections(mouseCoords = null) {
    const svgLayer = document.getElementById('connections-layer');
    if (!svgLayer) return;

    // 1. SVG-Layer leeren
    svgLayer.innerHTML = `
        <defs>
            <marker id="arrowhead" markerWidth="7" markerHeight="5" refX="1.5" refY="2.5" orient="auto">
                <polygon points="0 0, 7 2.5, 0 5" fill="#dd6b20" />
            </marker>
        </defs>
    `;

    // 2. BATCH-DOM-READS: Alle Breiten auf einmal lesen (Verhindert Layout-Thrashing)
    const nodeRects = {};
    currentEdges.forEach(edge => {
        if (!nodeRects[edge.source]) {
            const el = document.getElementById(edge.source);
            nodeRects[edge.source] = { w: el ? el.offsetWidth : 320, h: el ? el.offsetHeight : 200 };
        }
        if (!nodeRects[edge.target]) {
            const el = document.getElementById(edge.target);
            nodeRects[edge.target] = { w: el ? el.offsetWidth : 320, h: el ? el.offsetHeight : 200 };
        }
    });

    const getFastCoords = (node, handleType) => {
        const rect = nodeRects[node.id] || { w: 320, h: 200 };
        const w = rect.w;
        const h = rect.h;
        switch (handleType) {
            case 'top': return { x: node.pos_x + w / 2, y: node.pos_y };
            case 'bottom': return { x: node.pos_x + w / 2, y: node.pos_y + h };
            case 'left': return { x: node.pos_x, y: node.pos_y + h / 2 };
            case 'right': return { x: node.pos_x + w, y: node.pos_y + h / 2 };
            default: return { x: node.pos_x + w / 2, y: node.pos_y + h };
        }
    };

    // 3. FRAGMENT ERSTELLEN FÜR BATCH-DOM-WRITES
    const fragment = document.createDocumentFragment();

    // 4. Hierarchische Kanten generieren
    currentEdges.forEach(edge => {
        const srcNode = currentNodes.find(n => n.id === edge.source);
        const tgtNode = currentNodes.find(n => n.id === edge.target);

        const srcHidden = isNodeHiddenByAncestor(edge.source) || (srcNode && srcNode.zone_id && window.isZoneHidden(srcNode.zone_id));
        const tgtHidden = isNodeHiddenByAncestor(edge.target) || (tgtNode && tgtNode.zone_id && window.isZoneHidden(tgtNode.zone_id));

        if (srcHidden || tgtHidden || collapsedParents.has(edge.source)) return;

        if (srcNode && tgtNode) {
            const p1 = getFastCoords(srcNode, edge.source_handle || 'bottom');
            const p2 = getFastCoords(tgtNode, edge.target_handle || 'top');

            const isHorizontal = (edge.source_handle === 'right' || edge.source_handle === 'left') &&
                (edge.target_handle === 'right' || edge.target_handle === 'left');

            let pathD = '';
            if (isHorizontal) {
                const dx = Math.max(30, Math.abs(p2.x - p1.x) * 0.4);
                pathD = `M ${p1.x} ${p1.y} C ${p1.x + (p2.x >= p1.x ? dx : -dx)} ${p1.y}, ${p2.x + (p2.x >= p1.x ? -dx : dx)} ${p2.y}, ${p2.x} ${p2.y}`;
            } else {
                const dy = Math.max(30, Math.abs(p2.y - p1.y) * 0.4);
                pathD = `M ${p1.x} ${p1.y} C ${p1.x} ${p1.y + (p2.y >= p1.y ? dy : -dy)}, ${p2.x} ${p2.y + (p2.y >= p1.y ? -dy : dy)}, ${p2.x} ${p2.y}`;
            }

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathD);
            path.setAttribute('class', 'connection-line');
            path.setAttribute('title', `Verbindung (${srcNode.name} ➔ ${tgtNode.name}) - Klick zum Trennen`);
            path.addEventListener('click', () => handleDisconnectClick(edge.source, edge.target));

            fragment.appendChild(path);
        }
    });

    // 5. Materialfluss-Pfeile generieren (Ohne DOM Reads)
    const arrowsToRender = window.currentFlowArrows || [];
    arrowsToRender.forEach(arrow => {
        const srcZone = currentZones.find(z => String(z.id) === String(arrow.source_zone_id));
        const tgtZone = currentZones.find(z => String(z.id) === String(arrow.target_zone_id));

        if (!srcZone || !tgtZone || window.isZoneHidden(srcZone.id) || window.isZoneHidden(tgtZone.id)) return;

        const srcX1 = parseFloat(srcZone.pos_x) || 0;
        const srcY1 = parseFloat(srcZone.pos_y) || 0;
        const srcW = parseFloat(srcZone.width) || 400;
        const srcH = parseFloat(srcZone.height) || 300;
        const srcX2 = srcX1 + srcW;
        const srcY2 = srcY1 + srcH;

        const tgtX1 = parseFloat(tgtZone.pos_x) || 0;
        const tgtY1 = parseFloat(tgtZone.pos_y) || 0;
        const tgtW = parseFloat(tgtZone.width) || 400;
        const tgtH = parseFloat(tgtZone.height) || 300;
        const tgtX2 = tgtX1 + tgtW;
        const tgtY2 = tgtY1 + tgtH;

        let x1, y1, x2, y2;
        const isTargetBelow = tgtY1 >= srcY2 - 20;
        const isTargetAbove = tgtY2 <= srcY1 + 20;
        const isTargetLeft = tgtX2 <= srcX1 + 20;

        const stub = 10;
        const minTangent = 50;
        let pathD = '';

        if (isTargetBelow) {
            x1 = srcX1 + srcW / 2; y1 = srcY2;
            x2 = tgtX1 + tgtW / 2; y2 = tgtY1;
            const dist = Math.max(minTangent, Math.abs(y2 - y1) * 0.4);
            pathD = `M ${x1} ${y1} L ${x1} ${y1 + stub} C ${x1} ${y1 + stub + dist}, ${x2} ${y2 - stub - dist}, ${x2} ${y2 - stub} L ${x2} ${y2}`;
        } else if (isTargetAbove) {
            x1 = srcX1 + srcW / 2; y1 = srcY1;
            x2 = tgtX1 + tgtW / 2; y2 = tgtY2;
            const dist = Math.max(minTangent, Math.abs(y1 - y2) * 0.4);
            pathD = `M ${x1} ${y1} L ${x1} ${y1 - stub} C ${x1} ${y1 - stub - dist}, ${x2} ${y2 + stub + dist}, ${x2} ${y2 + stub} L ${x2} ${y2}`;
        } else if (isTargetLeft) {
            x1 = srcX1; y1 = srcY1 + srcH / 2;
            x2 = tgtX2; y2 = tgtY1 + tgtH / 2;
            const dist = Math.max(minTangent, Math.abs(x1 - x2) * 0.4);
            pathD = `M ${x1} ${y1} L ${x1 - stub} ${y1} C ${x1 - stub - dist} ${y1}, ${x2 + stub + dist} ${y2}, ${x2 + stub} ${y2} L ${x2} ${y2}`;
        } else {
            x1 = srcX2; y1 = srcY1 + srcH / 2;
            x2 = tgtX1; y2 = tgtY1 + tgtH / 2;
            const dist = Math.max(minTangent, Math.abs(x2 - x1) * 0.4);
            pathD = `M ${x1} ${y1} L ${x1 + stub} ${y1} C ${x1 + stub + dist} ${y1}, ${x2 - stub - dist} ${y2}, ${x2 - stub} ${y2} L ${x2} ${y2}`;
        }

        const flowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        flowPath.setAttribute('d', pathD);
        flowPath.setAttribute('class', 'flow-arrow-line');
        flowPath.setAttribute('marker-end', 'url(#arrowhead)');
        flowPath.setAttribute('title', `Materialfluss: ${srcZone.title} ➔ ${tgtZone.title} (Klick zum Löschen)`);
        flowPath.addEventListener('click', () => handleDeleteFlowArrow(arrow.id));

        fragment.appendChild(flowPath);
    });

    // 6. Live Spline Preview
    if (connectingFirstPoint && mouseCoords) {
        const p1 = connectingFirstPoint;
        const p2 = mouseCoords;
        const dx = Math.max(30, Math.abs(p2.x - p1.x) * 0.4);
        const dy = Math.max(30, Math.abs(p2.y - p1.y) * 0.4);

        const pathD = `M ${p1.x} ${p1.y} C ${p1.x + dy}, ${p2.x - dy}, ${p2.x} ${p2.y}`;
        const preview = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        preview.setAttribute('d', pathD);
        preview.setAttribute('class', 'preview-connection-line');
        fragment.appendChild(preview);
    }

    // 7. Alles auf einen Schlag ins DOM hängen
    svgLayer.appendChild(fragment);
}

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Canvas Bounds (Dynamische Größenanpassung)
 * ERSETZEN IN: canvas.js (Funktion window.adjustCanvasBounds)
 * Breadcrumbs:
 *   - [2026-08-26] Extremen Puffer von 3000px auf 1000px reduziert, um 
 *     VRAM/RAM zu sparen und Render-Performance bei vielen Blöcken zu verbessern.
 * =============================================================================
 */
window.adjustCanvasBounds = function () {
    let maxX = 0, maxY = 0;

    currentZones.forEach(z => {
        if (z.pos_x + z.width > maxX) maxX = z.pos_x + z.width;
        if (z.pos_y + z.height > maxY) maxY = z.pos_y + z.height;
    });

    currentNodes.forEach(n => {
        if (n.pos_x + 350 > maxX) maxX = n.pos_x + 350;
        if (n.pos_y + 250 > maxY) maxY = n.pos_y + 250;
    });

    const canvasEl = document.getElementById('canvas');
    // Startgröße 3000, danach dynamisch den Maximalwert + 1000px Puffer
    canvasEl.style.width = Math.max(3000, maxX + 1000) + 'px';
    canvasEl.style.height = Math.max(3000, maxY + 1000) + 'px';
};

window.lastClientX = 0;
window.lastClientY = 0;
window.addEventListener('mousemove', (e) => {
    window.lastClientX = e.clientX;
    window.lastClientY = e.clientY;
});

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Canvas Copy/Paste
 * ERSETZEN IN: canvas.js (Funktion handlePasteNodes)
 * Breadcrumb: [2026-08-24 20:05:00 CEST] doc_number bei Strg+V Instanz-Einfügen ergänzt
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Canvas Copy/Paste
 * ERSETZEN IN: canvas.js (Funktion handlePasteNodes)
 * Breadcrumb: [2026-08-25] Zonen-Zuweisung bei Paste hinzugefügt & Notizen unterstützt
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Canvas Copy/Paste
 * ERSETZEN IN: canvas.js (Funktion handlePasteNodes)
 * Breadcrumb: [2026-08-25] Zonen-Zuweisung bei Paste & DB-Insert Fehler abfangen
 * =============================================================================
 */
window.handlePasteNodes = async function () {
    if (!window.copiedNodeIds || window.copiedNodeIds.length === 0) return;

    const coords = getCanvasCoords(window.lastClientX, window.lastClientY);
    let offsetX = 0;

    for (const originalId of window.copiedNodeIds) {
        const originalNode = currentNodes.find(n => n.id === originalId);
        if (!originalNode) continue;

        let linkedId = originalNode.linked_id;
        const isNote = (originalNode.block_type === 'note' || originalNode.doc_number === 'NOTE');

        // Notizen werden nicht als verknüpfte Instanzen behandelt, normale Blöcke schon
        if (!linkedId && !isNote) {
            linkedId = 'inst_' + crypto.randomUUID();
            originalNode.linked_id = linkedId;
            await db.from('project_nodes').update({ linked_id: linkedId }).eq('id', originalNode.id);
        }

        const newPosX = Math.round(coords.x + offsetX);
        const newPosY = Math.round(coords.y);

        // Finde die Zone, in die wir am Mauszeiger einfügen
        const targetZone = (typeof getDeepestZoneAt === 'function')
            ? getDeepestZoneAt(newPosX + 160, newPosY + 100)
            : null;

        const { error } = await db.from('project_nodes').insert([{
            project_id: activeProjectId,
            name: originalNode.name,
            doc_number: originalNode.doc_number || null,
            article_number: originalNode.article_number || null,
            block_type: originalNode.block_type,
            budget_design_hours: originalNode.budget_design_hours,
            budget_drafting_hours: originalNode.budget_drafting_hours,
            color_hex: originalNode.color_hex,
            created_by: activeUserCode || 'COT',
            assigned_design_user: originalNode.assigned_design_user || null,
            assigned_drafting_user: originalNode.assigned_drafting_user || null,
            pos_x: newPosX,
            pos_y: newPosY,
            linked_id: isNote ? null : linkedId,
            zone_id: targetZone ? targetZone.id : null
        }]);

        if (error) {
            console.error("Fehler beim Einfügen der Kopie:", error);
            showToast('Fehler beim Einfügen', 'error');
        }

        offsetX += 340; // Versatz, falls mehrere Elemente eingefügt werden
    }

    showToast(`${window.copiedNodeIds.length} Element(e) eingefügt`, 'success');
    fetchCanvasData();
};