/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: NATIVE Canvas Engine, Manager-Verschachtelung & Board-Duplizierung
 * ERSETZEN IN: canvas.js (Gesamte Datei)
 * Zeitstempel: 2026-09-17 22:30:00 CEST
 * =============================================================================
 */

// Globale State-Variablen für das native Panning/Zooming
window.currentScale = parseFloat(localStorage.getItem('cad_tm_scale')) || 1;
window.currentPanX = parseFloat(localStorage.getItem('cad_tm_panX')) || 100;
window.currentPanY = parseFloat(localStorage.getItem('cad_tm_panY')) || 100;
window.hoveredNodeId = null;
window.copiedNodeIds = [];

// Dummy-Proxy für Abwärtskompatibilität
window.panzoomInstance = { getScale: () => window.currentScale };

let connectingFirstNodeId = null;
let connectingFirstPoint = null;
let connectingFlowZoneId = null;
let contextMenuCoords = { x: 100, y: 100 };
let contextTargetNodeId = null;

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
    canvasEl.style.transform = `translate3d(${window.currentPanX}px, ${window.currentPanY}px, 0) scale(${window.currentScale})`;

    const scaledGridSize = 24 * window.currentScale;
    viewportEl.style.backgroundSize = `${scaledGridSize}px ${scaledGridSize}px`;
    viewportEl.style.backgroundPosition = `${window.currentPanX}px ${window.currentPanY}px`;

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

window.toggleNoteCollapse = async function (e, nodeId) {
    if (e) e.stopPropagation();
    const node = currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    node.completion_status = node.completion_status === 'collapsed' ? 'open' : 'collapsed';
    if (typeof renderCanvas === 'function') renderCanvas();
    await db.from('project_nodes').update({ completion_status: node.completion_status }).eq('id', nodeId);
};

window.handleCanvasContextMenu = function (e) {
    e.preventDefault();
    if (e.target.closest('button, input, select, .sidebar')) return;

    const isMgr = (window.activeCanvasMode === 'manager');
    const menu = document.getElementById('canvasContextMenu');

    const itemAddBlock = document.getElementById('ctxMenuAddBlock');
    const itemAddZone = document.getElementById('ctxMenuAddZone');
    const itemAddNote = document.getElementById('ctxMenuAddNote');
    const itemToggleHandles = document.getElementById('ctxMenuToggleHandles');
    const itemDuplicate = document.getElementById('ctxMenuDuplicateNode');
    const itemDelete = document.getElementById('ctxMenuDeleteNode');

    const itemMgrAddExisting = document.getElementById('ctxMenuMgrAddExisting');
    const itemMgrAddZone = document.getElementById('ctxMenuMgrAddZone');
    const itemMgrRemoveNode = document.getElementById('ctxMenuMgrRemoveNode');
    const itemMgrDeleteZone = document.getElementById('ctxMenuMgrDeleteZone');

    const cardEl = e.target.closest('.assembly-card, .note-card');
    const zoneEl = e.target.closest('.project-zone');

    contextTargetNodeId = cardEl ? cardEl.id : null;
    const targetZoneId = zoneEl ? zoneEl.id : null;

    if (isMgr) {
        if (itemAddBlock) itemAddBlock.style.display = 'none';
        if (itemAddZone) itemAddZone.style.display = 'none';
        if (itemAddNote) itemAddNote.style.display = 'none';
        if (itemToggleHandles) itemToggleHandles.style.display = 'none';
        if (itemDelete) itemDelete.style.display = 'none';

        if (cardEl) {
            if (itemMgrAddExisting) itemMgrAddExisting.style.display = 'none';
            if (itemMgrAddZone) itemMgrAddZone.style.display = 'none';
            if (itemMgrRemoveNode) itemMgrRemoveNode.style.display = 'flex';
            if (itemMgrDeleteZone) itemMgrDeleteZone.style.display = 'none';
            if (itemDuplicate) itemDuplicate.style.display = 'flex';
        } else if (zoneEl) {
            window.contextTargetZoneId = targetZoneId;
            if (itemMgrAddExisting) itemMgrAddExisting.style.display = 'none';
            if (itemMgrAddZone) itemMgrAddZone.style.display = 'none';
            if (itemMgrRemoveNode) itemMgrRemoveNode.style.display = 'none';
            if (itemMgrDeleteZone) itemMgrDeleteZone.style.display = 'flex';
            if (itemDuplicate) itemDuplicate.style.display = 'none';
        } else {
            if (itemMgrAddExisting) itemMgrAddExisting.style.display = 'flex';
            if (itemMgrAddZone) itemMgrAddZone.style.display = 'flex';
            if (itemMgrRemoveNode) itemMgrRemoveNode.style.display = 'none';
            if (itemMgrDeleteZone) itemMgrDeleteZone.style.display = 'none';
            if (itemDuplicate) itemDuplicate.style.display = 'none';
        }
    } else {
        if (itemMgrAddExisting) itemMgrAddExisting.style.display = 'none';
        if (itemMgrAddZone) itemMgrAddZone.style.display = 'none';
        if (itemMgrRemoveNode) itemMgrRemoveNode.style.display = 'none';
        if (itemMgrDeleteZone) itemMgrDeleteZone.style.display = 'none';
        if (itemToggleHandles) itemToggleHandles.style.display = 'flex';

        if (cardEl) {
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
            if (itemDuplicate) itemDuplicate.style.display = 'none';
            if (itemDelete) itemDelete.style.display = 'none';
            if (itemAddBlock) itemAddBlock.style.display = 'flex';
            if (itemAddZone) itemAddZone.style.display = 'flex';
            if (itemAddNote) itemAddNote.style.display = 'flex';
        }
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

function initPanzoom() {
    const viewport = document.getElementById('viewport');
    applyCanvasTransform();

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

    viewport.addEventListener('mousedown', (e) => {
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
            e.preventDefault();
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

window.toggleInlineLogs = function (nodeId) {
    if (!window.expandedNodes) window.expandedNodes = new Set();
    if (!window.expandedZones) window.expandedZones = new Set();

    const isCurrentlyOpen = window.expandedNodes.has(nodeId);
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

window.toggleZoneLock = async function (e, zoneId) {
    e.stopPropagation();
    const zone = currentZones.find(z => z.id === zoneId);
    if (!zone) return;

    const newLock = !zone.is_locked;
    zone.is_locked = newLock;
    await db.from('project_zones').update({ is_locked: newLock }).eq('id', zoneId);
    showToast(`Bereich ${newLock ? 'gesperrt' : 'entsperrt'}`, 'info');
    renderCanvas();
};

// =============================================================================
// HILFSFUNKTIONEN FÜR MANAGER-RAHMEN HIERARCHIE
// =============================================================================
function getMgrZoneDepth(zoneId, zones) {
    let depth = 0;
    let cur = (zones || []).find(z => z.id === zoneId);
    while (cur && cur.parent_zone_id && depth < 10) {
        depth++;
        cur = zones.find(z => z.id === cur.parent_zone_id);
    }
    return depth;
}

function getAllDescendantMgrZones(zoneId, zones) {
    const desc = [];
    const queue = [zoneId];
    while (queue.length > 0) {
        const curId = queue.shift();
        const children = (zones || []).filter(z => z.parent_zone_id === curId);
        children.forEach(c => {
            desc.push(c.id);
            queue.push(c.id);
        });
    }
    return desc;
}

function getDeepestMgrZoneAt(x, y, excludeZoneIds = [], zones = []) {
    let deepest = null;
    let maxDepth = -1;
    (zones || []).forEach(z => {
        if (excludeZoneIds.includes(z.id)) return;
        const zX = parseFloat(z.pos_x) || 0;
        const zY = parseFloat(z.pos_y) || 0;
        const zW = parseFloat(z.width) || 620;
        const zH = parseFloat(z.height) || 440;

        if (x >= zX && x <= (zX + zW) && y >= zY && y <= (zY + zH)) {
            const d = getMgrZoneDepth(z.id, zones);
            if (d > maxDepth) {
                maxDepth = d;
                deepest = z;
            }
        }
    });
    return deepest;
}

window.handleManagerProgressInput = function (nodeId, type, val) {
    const num = parseInt(val, 10) || 0;
    const lbl = document.getElementById(type === 'design' ? `mgr-prog-val-d-${nodeId}` : `mgr-prog-val-dr-${nodeId}`);
    if (lbl) lbl.textContent = `${num}%`;

    const otherLbl = document.getElementById(type === 'design' ? `mgr-prog-val-dr-${nodeId}` : `mgr-prog-val-d-${nodeId}`);
    const otherVal = otherLbl ? (parseInt(otherLbl.textContent, 10) || 0) : 0;

    const dVal = type === 'design' ? num : otherVal;
    const drVal = type === 'drafting' ? num : otherVal;
    const tot = Math.round((dVal * 0.5) + (drVal * 0.5));

    const totBadge = document.getElementById(`mgr-tot-badge-${nodeId}`);
    if (totBadge) {
        totBadge.textContent = `${tot}% Gesamt`;
        totBadge.style.background = tot === 100 ? '#c6f6d5' : (tot > 50 ? '#bee3f8' : '#edf2f7');
        totBadge.style.color = tot === 100 ? '#22543d' : (tot > 50 ? '#2b6cb0' : '#4a5568');
    }
};

window.handleManagerProgressChange = async function (nodeId, type, val) {
    const node = currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    const masterNode = node.linked_id
        ? (currentNodes.find(n => n.linked_id === node.linked_id) || node)
        : node;

    const num = Math.min(100, Math.max(0, parseInt(val, 10) || 0));

    if (type === 'design') {
        masterNode.progress_design = num;
    } else {
        masterNode.progress_drafting = num;
    }

    const curD = masterNode.progress_design || 0;
    const curDr = masterNode.progress_drafting || 0;

    let newStatus = masterNode.completion_status || 'open';
    if (curD === 100 && curDr === 100) {
        newStatus = 'completed';
    } else if (newStatus === 'completed') {
        newStatus = 'open';
    }
    masterNode.completion_status = newStatus;

    const updatePayload = {
        progress_design: masterNode.progress_design,
        progress_drafting: masterNode.progress_drafting,
        completion_status: masterNode.completion_status
    };

    if (masterNode.linked_id) {
        const related = currentNodes.filter(n => n.linked_id === masterNode.linked_id);
        related.forEach(rn => Object.assign(rn, updatePayload));
        const updates = related.map(rn => db.from('project_nodes').update(updatePayload).eq('id', rn.id));
        await Promise.all(updates);
    } else {
        Object.assign(node, updatePayload);
        await db.from('project_nodes').update(updatePayload).eq('id', masterNode.id);
    }

    showToast(`Fortschritt "${masterNode.name}" synchronisiert`, 'success');
    renderCanvas();
};

// =============================================================================
// HAUPT-RENDERING (renderCanvas)
// =============================================================================
function renderCanvas() {
    const canvas = document.getElementById('canvas');
    const svgLayer = document.getElementById('connections-layer');
    if (!canvas || !svgLayer) return;

    const isManagerMode = (window.activeCanvasMode === 'manager');
    const mgrLayout = isManagerMode ? (typeof getManagerLayout === 'function' ? getManagerLayout() : { zones: [], placements: {} }) : null;

    if (!window.selectedNodeIds) window.selectedNodeIds = new Set();
    if (!window.expandedNodes) window.expandedNodes = new Set();
    if (!window.expandedZones) window.expandedZones = new Set();
    if (!window.collapsedParents) window.collapsedParents = new Set();
    if (!window.hiddenTopZoneIds) window.hiddenTopZoneIds = new Set();

    const existingCards = canvas.querySelectorAll('.assembly-card, .project-zone, .note-card');
    existingCards.forEach(c => c.remove());
    svgLayer.innerHTML = '';

    const rollups = (typeof calculateRollups === 'function') ? calculateRollups() : {};

    // 1. ZONEN RENDERN
    if (isManagerMode && mgrLayout && Array.isArray(mgrLayout.zones)) {
        const sortedMgrZones = [...mgrLayout.zones].sort((a, b) => {
            return getMgrZoneDepth(a.id, mgrLayout.zones) - getMgrZoneDepth(b.id, mgrLayout.zones);
        });

        sortedMgrZones.forEach(zone => {
            const depth = getMgrZoneDepth(zone.id, mgrLayout.zones);
            const isLocked = !!zone.is_locked;

            const zoneEl = document.createElement('div');
            zoneEl.id = zone.id;
            zoneEl.className = `project-zone ${isLocked ? 'zone-locked' : 'no-pan'} draggable-enabled`;
            zoneEl.style.left = `${zone.pos_x}px`;
            zoneEl.style.top = `${zone.pos_y}px`;
            zoneEl.style.width = `${zone.width}px`;
            zoneEl.style.height = `${zone.height}px`;
            zoneEl.style.borderColor = zone.color_hex || '#2b6cb0';
            zoneEl.style.backgroundColor = depth > 0 ? 'rgba(237, 242, 247, 0.65)' : 'rgba(237, 242, 247, 0.35)';
            zoneEl.style.zIndex = `${10 + (depth * 5)}`;

            const descendantZoneIds = getAllDescendantMgrZones(zone.id, mgrLayout.zones);
            const allIncludedZoneIds = [zone.id, ...descendantZoneIds];

            const containedBlocks = [];
            Object.keys(mgrLayout.placements || {}).forEach(nId => {
                const pl = mgrLayout.placements[nId];
                if (pl && allIncludedZoneIds.includes(pl.zone_id)) {
                    const bNode = (currentNodes || []).find(x => x.id === nId);
                    if (bNode && bNode.block_type !== 'note') containedBlocks.push(bNode);
                }
            });

            let totalWeightedScore = 0;
            let totalWeights = 0;

            containedBlocks.forEach(bn => {
                const masterObj = bn.linked_id ? (currentNodes.find(x => x.linked_id === bn.linked_id) || bn) : bn;
                const isDone = (masterObj.completion_status === 'completed') || (bn.completion_status === 'completed');
                const pD = isDone ? 100 : ((masterObj.progress_design !== null && masterObj.progress_design !== undefined) ? masterObj.progress_design : 0);
                const pDr = isDone ? 100 : ((masterObj.progress_drafting !== null && masterObj.progress_drafting !== undefined) ? masterObj.progress_drafting : 0);
                const bTotalProg = (pD * 0.5) + (pDr * 0.5);

                const bD = parseFloat(masterObj.budget_design_hours) || 0;
                const bDr = parseFloat(masterObj.budget_drafting_hours) || 0;
                const bWeight = (bD + bDr) || 1;

                totalWeightedScore += (bTotalProg * bWeight);
                totalWeights += bWeight;
            });

            const zoneProgress = totalWeights > 0 ? Math.round(totalWeightedScore / totalWeights) : 0;
            const barColor = zoneProgress === 100 ? '#38a169' : (zoneProgress > 50 ? '#3182ce' : '#dd6b20');

            let zoneBudD = 0, zoneBudDr = 0, zoneSpentD = 0, zoneSpentDr = 0;
            const countedBudgetKeys = new Set();

            containedBlocks.forEach(bn => {
                const masterObj = bn.linked_id ? (currentNodes.find(x => x.linked_id === bn.linked_id) || bn) : bn;
                const uniqueKey = masterObj.linked_id || masterObj.id;

                if (!countedBudgetKeys.has(uniqueKey)) {
                    countedBudgetKeys.add(uniqueKey);
                    zoneBudD += parseFloat(masterObj.budget_design_hours) || 0;
                    zoneBudDr += parseFloat(masterObj.budget_drafting_hours) || 0;

                    const relatedIds = masterObj.linked_id
                        ? currentNodes.filter(x => x.linked_id === masterObj.linked_id).map(x => x.id)
                        : [masterObj.id];

                    (currentTimeLogs || []).filter(l => relatedIds.includes(l.node_id)).forEach(l => {
                        if (l.task_type === 'design') zoneSpentD += parseFloat(l.hours) || 0;
                        if (l.task_type === 'drafting') zoneSpentDr += parseFloat(l.hours) || 0;
                    });
                }
            });

            const zdPieStyle = generatePieStyle(zoneSpentD, zoneBudD, zone.color_hex || '#2b6cb0');
            const zdrPieStyle = generatePieStyle(zoneSpentDr, zoneBudDr, '#38a169');
            const docLabel = zone.doc_number ? `<span class="badge-doc-text">${escapeHtml(zone.doc_number)}</span>` : '';

            zoneEl.innerHTML = `
              <div class="assembly-id-badge zone-badge-container" style="border-color: ${zone.color_hex || '#2b6cb0'};">
                ${docLabel}
                <div class="zone-progress-track" title="Fortschritt: ${zoneProgress}%">
                    <div class="zone-progress-fill" style="width: ${zoneProgress}%; background: ${barColor};"></div>
                    <span class="zone-progress-label">${zoneProgress}%</span>
                </div>
              </div>
              <div class="project-zone-header no-pan" style="padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; cursor: ${isLocked ? 'default' : 'move'};">
                <span style="font-weight: bold; font-size: 13px; color: #2d3748;">📁 ${escapeHtml(zone.title)}</span>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <div style="display:flex; align-items: center; gap: 4px;" title="CAD Summe (Dedupliziert)">
                        <div class="pie-chart" style="${zdPieStyle}; width: 20px; height: 20px;"><div class="pie-inner" style="width:12px; height:12px;"></div></div>
                        <span style="font-size: 10px; font-family: monospace; color:#4a5568;">${formatHoursToHM(zoneSpentD)} / ${formatHoursToHM(zoneBudD)}</span>
                    </div>
                    <div style="display:flex; align-items: center; gap: 4px;" title="Zeichnung Summe (Dedupliziert)">
                        <div class="pie-chart" style="${zdrPieStyle}; width: 20px; height: 20px;"><div class="pie-inner" style="width:12px; height:12px;"></div></div>
                        <span style="font-size: 10px; font-family: monospace; color:#4a5568;">${formatHoursToHM(zoneSpentDr)} / ${formatHoursToHM(zoneBudDr)}</span>
                    </div>
                    <div class="zone-actions" style="display:flex; gap:4px; margin-left:6px;">
                        <button type="button" class="zone-btn" title="Position sperren/entsperren" onclick="window.toggleManagerZoneLock(event, '${zone.id}')">${isLocked ? '🔒' : '🔓'}</button>
                        <button type="button" class="zone-btn" style="color:#e53e3e;" title="Rahmen entfernen" onclick="window.deleteManagerZone('${zone.id}')">✕</button>
                    </div>
                </div>
              </div>
              <div class="zone-resize-handle no-pan" title="Größe anpassen"></div>
            `;

            if (!isLocked) {
                let isDragging = false;
                let startClientX = 0, startClientY = 0;
                let initZLeft = 0, initZTop = 0;
                let descZonesStartPos = [];
                let blocksStartPos = [];
                let allMovedZoneIds = [];

                const startMgrZoneDrag = (e) => {
                    if (e.target.closest('.zone-actions, button, input, select')) return;
                    if (e.type === 'touchstart' && e.touches.length > 1) return;
                    if (e.cancelable) e.stopPropagation();

                    window.isDraggingAnything = true;
                    isDragging = true;
                    startClientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                    startClientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
                    initZLeft = zone.pos_x;
                    initZTop = zone.pos_y;

                    const childZoneIds = getAllDescendantMgrZones(zone.id, mgrLayout.zones);
                    allMovedZoneIds = [zone.id, ...childZoneIds];

                    descZonesStartPos = childZoneIds.map(cid => {
                        const cz = mgrLayout.zones.find(z => z.id === cid);
                        return { id: cid, x: cz ? cz.pos_x : 0, y: cz ? cz.pos_y : 0 };
                    });

                    blocksStartPos = [];
                    Object.keys(mgrLayout.placements || {}).forEach(nId => {
                        const pl = mgrLayout.placements[nId];
                        if (pl && allIncludedZoneIds.includes(pl.zone_id)) {
                            blocksStartPos.push({ id: nId, x: pl.pos_x, y: pl.pos_y });
                        }
                    });

                    const onMove = (me) => {
                        if (!isDragging) return;
                        if (me.type === 'touchmove' && me.cancelable) me.preventDefault();

                        const clientX = me.type.includes('touch') ? me.touches[0].clientX : me.clientX;
                        const clientY = me.type.includes('touch') ? me.touches[0].clientY : me.clientY;
                        const scale = window.currentScale || 1;
                        const dx = (clientX - startClientX) / scale;
                        const dy = (clientY - startClientY) / scale;

                        zone.pos_x = Math.round(initZLeft + dx);
                        zone.pos_y = Math.round(initZTop + dy);
                        zoneEl.style.left = `${zone.pos_x}px`;
                        zoneEl.style.top = `${zone.pos_y}px`;

                        descZonesStartPos.forEach(dz => {
                            const zObj = mgrLayout.zones.find(x => x.id === dz.id);
                            const curX = Math.round(dz.x + dx);
                            const curY = Math.round(dz.y + dy);
                            if (zObj) { zObj.pos_x = curX; zObj.pos_y = curY; }
                            const dEl = document.getElementById(dz.id);
                            if (dEl) { dEl.style.left = `${curX}px`; dEl.style.top = `${curY}px`; }
                        });

                        blocksStartPos.forEach(bp => {
                            const curX = Math.round(bp.x + dx);
                            const curY = Math.round(bp.y + dy);
                            if (mgrLayout.placements[bp.id]) {
                                mgrLayout.placements[bp.id].pos_x = curX;
                                mgrLayout.placements[bp.id].pos_y = curY;
                            }
                            const bEl = document.getElementById(bp.id);
                            if (bEl) { bEl.style.left = `${curX}px`; bEl.style.top = `${curY}px`; }
                        });

                        const headerCenterX = zone.pos_x + (zone.width / 2);
                        const headerCenterY = zone.pos_y + 20;
                        const targetDropZone = getDeepestMgrZoneAt(headerCenterX, headerCenterY, allMovedZoneIds, mgrLayout.zones);

                        mgrLayout.zones.forEach(z => {
                            const el = document.getElementById(z.id);
                            if (el) {
                                if (targetDropZone && z.id === targetDropZone.id) el.classList.add('zone-hover-highlight');
                                else el.classList.remove('zone-hover-highlight');
                            }
                        });
                    };

                    const onUp = () => {
                        if (!isDragging) return;
                        isDragging = false;
                        window.isDraggingAnything = false;

                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                        window.removeEventListener('touchmove', onMove);
                        window.removeEventListener('touchend', onUp);
                        window.removeEventListener('touchcancel', onUp);

                        mgrLayout.zones.forEach(z => {
                            const el = document.getElementById(z.id);
                            if (el) el.classList.remove('zone-hover-highlight');
                        });

                        const headerCenterX = zone.pos_x + (zone.width / 2);
                        const headerCenterY = zone.pos_y + 20;
                        const targetDropZone = getDeepestMgrZoneAt(headerCenterX, headerCenterY, allMovedZoneIds, mgrLayout.zones);

                        zone.parent_zone_id = targetDropZone ? targetDropZone.id : null;
                        saveManagerLayout(mgrLayout);
                        renderCanvas();
                    };

                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                    window.addEventListener('touchmove', onMove, { passive: false });
                    window.addEventListener('touchend', onUp);
                    window.addEventListener('touchcancel', onUp);
                };

                const headerEl = zoneEl.querySelector('.project-zone-header');
                if (headerEl) {
                    headerEl.addEventListener('mousedown', startMgrZoneDrag);
                    headerEl.addEventListener('touchstart', startMgrZoneDrag, { passive: false });
                }
            }

            const rHandle = zoneEl.querySelector('.zone-resize-handle');
            if (rHandle) {
                rHandle.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    let isResizing = true;
                    window.isDraggingAnything = true;
                    const scale = window.currentScale || 1;
                    const sW = zone.width;
                    const sH = zone.height;
                    const sX = e.clientX;
                    const sY = e.clientY;

                    const onRMove = (me) => {
                        if (!isResizing) return;
                        zone.width = Math.max(300, Math.round(sW + (me.clientX - sX) / scale));
                        zone.height = Math.max(200, Math.round(sH + (me.clientY - sY) / scale));
                        zoneEl.style.width = `${zone.width}px`;
                        zoneEl.style.height = `${zone.height}px`;
                    };

                    const onRUp = () => {
                        isResizing = false;
                        window.isDraggingAnything = false;
                        window.removeEventListener('mousemove', onRMove);
                        window.removeEventListener('mouseup', onRUp);
                        saveManagerLayout(mgrLayout);
                        renderCanvas();
                    };

                    window.addEventListener('mousemove', onRMove);
                    window.addEventListener('mouseup', onRUp);
                });
            }

            canvas.appendChild(zoneEl);
        });
    } else {
        // HAUPT-CANVAS (CAD)
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

            const allZoneIds = [zone.id, ...(typeof getAllDescendantZones === 'function' ? getAllDescendantZones(zone.id) : [])];
            const childBlocks = (currentNodes || []).filter(n => allZoneIds.includes(n.zone_id) && n.block_type !== 'note');

            let zoneProgress = 0;
            if (childBlocks.length > 0) {
                let totalWeightedScore = 0;
                let totalWeights = 0;
                childBlocks.forEach(bn => {
                    const masterObj = bn.linked_id ? (currentNodes.find(x => x.linked_id === bn.linked_id) || bn) : bn;
                    const isDone = (masterObj.completion_status === 'completed') || (bn.completion_status === 'completed');
                    const pD = isDone ? 100 : ((masterObj.progress_design !== null && masterObj.progress_design !== undefined) ? masterObj.progress_design : 0);
                    const pDr = isDone ? 100 : ((masterObj.progress_drafting !== null && masterObj.progress_drafting !== undefined) ? masterObj.progress_drafting : 0);
                    const bTotalProg = (pD * 0.5) + (pDr * 0.5);
                    const bWeight = (parseFloat(masterObj.budget_design_hours) || 0) + (parseFloat(masterObj.budget_drafting_hours) || 0) || 1;
                    totalWeightedScore += (bTotalProg * bWeight);
                    totalWeights += bWeight;
                });
                zoneProgress = Math.round(totalWeightedScore / totalWeights);
            }

            const identifier = zone.article_number || zone.doc_number || '';
            let badgeHtml = '';
            if (identifier || childBlocks.length > 0) {
                const docLabel = identifier ? `<span class="badge-doc-text">${escapeHtml(identifier)}</span>` : '';
                const barColor = zoneProgress === 100 ? '#38a169' : (zoneProgress > 50 ? '#3182ce' : '#dd6b20');
                badgeHtml = `
                    <div class="assembly-id-badge zone-badge-container" style="border-color: ${zone.color_hex || '#a0aec0'};">
                        ${docLabel}
                        <div class="zone-progress-track" title="Fortschritt: ${zoneProgress}%">
                            <div class="zone-progress-fill" style="width: ${zoneProgress}%; background: ${barColor};"></div>
                            <span class="zone-progress-label">${zoneProgress}%</span>
                        </div>
                    </div>
                `;
            }

            let assignedBadgesHtml = '';
            if (zone.assigned_design_user) {
                assignedBadgesHtml += `<span class="author-badge" style="background:#2b6cb0; margin-left:6px;" title="CAD: ${escapeHtml(zone.assigned_design_user)}">3D <strong>${escapeHtml(zone.assigned_design_user)}</strong></span>`;
            }
            if (zone.assigned_drafting_user) {
                assignedBadgesHtml += `<span class="author-badge" style="background:#38a169; margin-left:4px;" title="Zeichnung: ${escapeHtml(zone.assigned_drafting_user)}">📄 <strong>${escapeHtml(zone.assigned_drafting_user)}</strong></span>`;
            }

            let zIcon = CAD_ICONS ? CAD_ICONS.location : '📍';
            if (zone.zone_type === 'assembly') zIcon = CAD_ICONS ? CAD_ICONS.assembly : '📦';
            else if (zone.zone_type === 'comment') zIcon = CAD_ICONS ? CAD_ICONS.comment : '💬';
            else if (zone.zone_type === 'container') zIcon = CAD_ICONS ? CAD_ICONS.container : '⬚';

            zoneEl.innerHTML = `
              ${badgeHtml}
              <div class="project-zone-header no-pan" style="position: relative; z-index: 50; border-bottom-color: ${zone.color_hex || '#a0aec0'}; padding-right: 140px; display: flex; flex-direction: column; gap: 5px; align-items: flex-start; padding: 8px 12px;">
                <div style="display:flex; align-items:center; overflow: hidden; white-space: nowrap; max-width: 100%;">
                  <span style="font-weight: bold; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(zone.title)}">${zIcon} ${escapeHtml(zone.title)}</span>
                  ${assignedBadgesHtml}
                </div>
                <div style="display:flex; gap: 24px; align-items: center; margin-top: 1px;">
                    <div style="display:flex; align-items: center; gap: 6px;" title="CAD Budget">
                        <div class="pie-chart" style="${zdPieStyle}; width: 22px; height: 22px;"><div class="pie-inner" style="width: 14px; height: 14px;"></div></div>
                        <span style="color: #718096; font-family: monospace; font-size: 10px;">${formatHoursToHM(zStats.dSpent)} / ${formatHoursToHM(zStats.dBudg)}</span>
                    </div>
                    <div style="display:flex; align-items: center; gap: 6px;" title="Zeichnung Budget">
                        <div class="pie-chart" style="${zdrPieStyle}; width: 22px; height: 22px;"><div class="pie-inner" style="width: 14px; height: 14px;"></div></div>
                        <span style="color: #718096; font-family: monospace; font-size: 10px;">${formatHoursToHM(zStats.drSpent)} / ${formatHoursToHM(zStats.drBudg)}</span>
                    </div>
                    <button type="button" class="zone-btn btn-toggle-zone-times" title="Zeiten auf Rahmen buchen & Details" style="padding: 2px 7px; font-weight: bold; border: 1px solid #cbd5e0; border-radius: 4px; background: #fff; flex-shrink: 0; font-size: 11px;">⏱️ Zeiten</button>
                </div>
                <div class="zone-actions" style="position: absolute; right: 10px; top: 8px; display: flex; gap: 6px; align-items: center; z-index: 60;">
                  <button type="button" class="zone-flow-btn" title="Materialfluss-Pfeil ziehen" onclick="handleStartZoneFlow(event, '${zone.id}')">➔ Fluss</button>
                  <button type="button" class="zone-btn" title="Position sperren/entsperren" onclick="toggleZoneLock(event, '${zone.id}')">${zone.is_locked ? '🔒' : '🔓'}</button>
                  <button type="button" class="zone-btn" title="Bearbeiten" onclick="openEditZoneModal('${zone.id}')">✏️</button>
                  ${isAdmin || (activeUserCode && activeUserCode === zone.created_by) ? `<button type="button" class="zone-btn" style="color:#e53e3e;" title="Löschen" onclick="handleDeleteZone('${zone.id}')">✕</button>` : ''}
                </div>
              </div>
              <div class="zone-resize-handle no-pan" style="position: absolute; z-index: 50;" title="Größe anpassen"></div>
            `;

            const btnTimes = zoneEl.querySelector('.btn-toggle-zone-times');
            if (btnTimes) {
                btnTimes.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (typeof window.toggleZoneLogs === 'function') window.toggleZoneLogs(e, zone.id);
                });
            }
            canvas.appendChild(zoneEl);
        });
    }

    // 2. KNOTEN / BLÖCKE RENDERN
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
        const isNote = (node.block_type === 'note' || node.doc_number === 'NOTE' || node.doc_number === 'TODO');

        if (isManagerMode && isNote) return;

        if (isNote) {
            const isPrivate = node.article_number === 'private';
            const userCode = (activeUserCode || '').toUpperCase();
            const noteCreator = (node.created_by || '').toUpperCase();
            if (isPrivate && noteCreator !== userCode && !isAdmin) return;

            const isCollapsed = node.completion_status === 'collapsed';
            const noteData = (typeof parseNotePayload === 'function') ? parseNotePayload(node.name) : { text: node.name || '' };

            const el = document.createElement('div');
            el.id = node.id;
            el.className = `note-card no-pan ${isAdmin || userCode === noteCreator ? 'draggable-enabled' : ''}`;
            el.style.left = `${node.pos_x}px`;
            el.style.top = `${node.pos_y}px`;
            el.style.backgroundColor = node.color_hex || '#fefcbf';
            el.style.width = isCollapsed ? '42px' : `${node.budget_design_hours || 220}px`;
            el.style.height = isCollapsed ? '42px' : `${node.budget_drafting_hours || 120}px`;
            el.innerHTML = `<div style="padding:6px; font-size:11px;">${escapeHtml(noteData.text)}</div>`;
            canvas.appendChild(el);
            return;
        }

        if (isManagerMode && (!mgrLayout || !mgrLayout.placements || !mgrLayout.placements[node.id])) {
            return;
        }

        const relatedNodeIds = node.linked_id
            ? currentNodes.filter(n => n.linked_id === node.linked_id).map(n => n.id)
            : [node.id];

        const isEffectivelyLinked = relatedNodeIds.length > 1;
        const masterNode = isEffectivelyLinked ? (currentNodes.find(n => n.linked_id === node.linked_id) || node) : node;
        const isMaster = !isEffectivelyLinked || (masterNode.id === node.id);

        let dSpentAgg = 0, drSpentAgg = 0;
        relatedNodeIds.forEach(id => {
            const st = rollups[id] || { totalDesign: 0, totalDrafting: 0 };
            dSpentAgg += st.totalDesign || 0;
            drSpentAgg += st.totalDrafting || 0;
        });

        const nodeColor = node.color_hex || '#2b6cb0';
        const dBudg = Math.max(0, parseFloat(masterNode.budget_design_hours) || 0);
        const drBudg = Math.max(0, parseFloat(masterNode.budget_drafting_hours) || 0);
        const dPct = dBudg > 0 ? Math.round((dSpentAgg / dBudg) * 100) : 0;
        const drPct = drBudg > 0 ? Math.round((drSpentAgg / drBudg) * 100) : 0;

        const dPieStyle = generatePieStyle(dSpentAgg, dBudg, nodeColor);
        const drPieStyle = generatePieStyle(drSpentAgg, drBudg, '#38a169');

        const isBlockDone = masterNode.completion_status === 'completed';
        const pDesign = isBlockDone ? 100 : ((masterNode.progress_design !== null && masterNode.progress_design !== undefined) ? masterNode.progress_design : 0);
        const pDrafting = isBlockDone ? 100 : ((masterNode.progress_drafting !== null && masterNode.progress_drafting !== undefined) ? masterNode.progress_drafting : 0);
        const pTotal = Math.round((pDesign * 0.5) + (pDrafting * 0.5));

        const identifier = node.article_number || node.doc_number || '';
        let badgeHtml = '';
        if (identifier || pTotal > 0 || isBlockDone) {
            const docLabel = identifier ? `<span class="badge-doc-text">${escapeHtml(identifier)}</span>` : '';
            const barColor = pTotal === 100 ? '#38a169' : (pTotal > 50 ? '#3182ce' : '#dd6b20');
            badgeHtml = `
              <div class="assembly-id-badge zone-badge-container" style="border-color: ${nodeColor};">
                ${docLabel}
                <div class="zone-progress-track" title="Fertigstellung: ${pTotal}% (CAD: ${pDesign}% | Zeichn: ${pDrafting}%)">
                    <div class="zone-progress-fill" style="width: ${pTotal}%; background: ${barColor};"></div>
                    <span class="zone-progress-label">${pTotal}%</span>
                </div>
              </div>
            `;
        }

        const posX = isManagerMode ? (mgrLayout.placements[node.id]?.pos_x ?? node.pos_x) : node.pos_x;
        const posY = isManagerMode ? (mgrLayout.placements[node.id]?.pos_y ?? node.pos_y) : node.pos_y;
        const isSelected = window.selectedNodeIds.has(node.id);

        const el = document.createElement('div');
        el.id = node.id;
        if (isEffectivelyLinked) el.dataset.linkedId = node.linked_id;

        el.className = `assembly-card no-pan ${isManagerMode ? 'manager-card draggable-enabled' : 'draggable-enabled'} ${isSelected ? 'selected-node' : ''}`;
        el.style.left = `${posX}px`;
        el.style.top = `${posY}px`;
        el.style.borderColor = nodeColor;
        el.style.borderStyle = (isEffectivelyLinked && !isMaster) ? 'dashed' : 'solid';
        el.style.zIndex = '100';

        const typeIconSvg = node.block_type === 'part' ? (window.CAD_ICONS ? CAD_ICONS.part : '⚙️') : (window.CAD_ICONS ? CAD_ICONS.assembly : '📦');
        const linkedIconHtml = isEffectivelyLinked ? `<span class="linked-icon" title="${isMaster ? 'Master-Instanz' : 'Referenz-Instanz'}">🔗${isMaster ? '' : ' Ref'}</span>` : '';

        if (isManagerMode) {
            let progressControlsHtml = '';
            if (isAdmin) {
                progressControlsHtml = `
                  <div class="mgr-progress-box" style="margin-top: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px;" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                      <span style="font-size:9px; font-weight:bold; text-transform:uppercase; color:#4a5568;">Fertigstellungsgrad (50/50)</span>
                      <span id="mgr-tot-badge-${node.id}" style="font-size:10px; font-weight:bold; padding:1px 6px; border-radius:10px; background:${pTotal === 100 ? '#c6f6d5' : (pTotal > 50 ? '#bee3f8' : '#edf2f7')}; color:${pTotal === 100 ? '#22543d' : (pTotal > 50 ? '#2b6cb0' : '#4a5568')};">${pTotal}% Gesamt</span>
                    </div>

                    <div style="margin-bottom: 4px;">
                      <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:bold; color:#2b6cb0; margin-bottom:1px;">
                        <span>📐 CAD (3D)</span>
                        <span id="mgr-prog-val-d-${node.id}">${pDesign}%</span>
                      </div>
                      <input type="range" class="mgr-prog-slider" min="0" max="100" step="5" value="${pDesign}" 
                        style="width:100%; height:4px; accent-color:#2b6cb0; cursor:pointer;" 
                        oninput="window.handleManagerProgressInput('${node.id}', 'design', this.value)"
                        onchange="window.handleManagerProgressChange('${node.id}', 'design', this.value)" />
                    </div>

                    <div>
                      <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:bold; color:#38a169; margin-bottom:1px;">
                        <span>📄 Zeichnung (2D)</span>
                        <span id="mgr-prog-val-dr-${node.id}">${pDrafting}%</span>
                      </div>
                      <input type="range" class="mgr-prog-slider" min="0" max="100" step="5" value="${pDrafting}" 
                        style="width:100%; height:4px; accent-color:#38a169; cursor:pointer;" 
                        oninput="window.handleManagerProgressInput('${node.id}', 'drafting', this.value)"
                        onchange="window.handleManagerProgressChange('${node.id}', 'drafting', this.value)" />
                    </div>
                  </div>
                `;
            } else {
                progressControlsHtml = `
                  <div class="mgr-progress-box" style="margin-top: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px;">
                    <div style="display:flex; justify-content:space-between; font-size:9px; color:#2b6cb0; font-weight:bold;">
                      <span>📐 CAD: ${pDesign}%</span>
                      <span>📄 Zeichn: ${pDrafting}%</span>
                    </div>
                    <div style="width:100%; height:6px; background:#e2e8f0; border-radius:3px; overflow:hidden; display:flex; margin-top:2px;">
                      <div style="width:${pDesign * 0.5}%; height:100%; background:#2b6cb0;"></div>
                      <div style="width:${pDrafting * 0.5}%; height:100%; background:#38a169;"></div>
                    </div>
                  </div>
                `;
            }

            el.innerHTML = `
              ${badgeHtml}
              <div class="assembly-header" style="background: ${nodeColor}; display: flex; justify-content: space-between; align-items: center; border-top-left-radius: 6px; border-top-right-radius: 6px; padding: 6px 10px;">
                <span style="overflow: hidden; text-overflow: ellipsis; font-size: 13px; display: inline-flex; align-items: center; gap: 5px; color: #fff; font-weight: bold;" title="${escapeHtml(node.name)}">
                  ${typeIconSvg} ${escapeHtml(node.name)}
                </span>
                <div style="display:flex; align-items:center; gap:3px; flex-shrink:0;">
                  ${linkedIconHtml}
                </div>
              </div>
              <div class="assembly-body" style="padding: 8px 10px;">
                <div class="charts-grid" style="margin: 0; padding: 6px;">
                  <div class="chart-box">
                    <div class="pie-chart" style="${dPieStyle}"><div class="pie-inner">${dPct}%</div></div>
                    <div class="chart-label">CAD</div>
                    <div class="chart-sub">${formatHoursToHM(dSpentAgg)} / ${formatHoursToHM(dBudg)}</div>
                  </div>
                  <div class="chart-box">
                    <div class="pie-chart" style="${drPieStyle}"><div class="pie-inner">${drPct}%</div></div>
                    <div class="chart-label">Zeichnung</div>
                    <div class="chart-sub">${formatHoursToHM(drSpentAgg)} / ${formatHoursToHM(drBudg)}</div>
                  </div>
                </div>
                ${progressControlsHtml}
              </div>
            `;
        }

        let isDragging = false;
        let startClientX = 0, startClientY = 0;
        let initCurX = posX, initCurY = posY;

        const startCardDrag = (e) => {
            if (e.target.closest('input, select, button, .ep-handle, .mgr-prog-slider')) return;
            if (e.type === 'touchstart' && e.touches.length > 1) return;

            window.isDraggingAnything = true;
            isDragging = true;
            startClientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            startClientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            initCurX = isManagerMode ? (mgrLayout.placements[node.id]?.pos_x ?? posX) : node.pos_x;
            initCurY = isManagerMode ? (mgrLayout.placements[node.id]?.pos_y ?? posY) : node.pos_y;

            if (e.cancelable) e.stopPropagation();

            const onCardMove = (me) => {
                if (!isDragging) return;
                if (me.type === 'touchmove' && me.cancelable) me.preventDefault();
                const clientX = me.type.includes('touch') ? me.touches[0].clientX : me.clientX;
                const clientY = me.type.includes('touch') ? me.touches[0].clientY : me.clientY;
                const scale = window.currentScale || 1;
                const curX = Math.round(initCurX + (clientX - startClientX) / scale);
                const curY = Math.round(initCurY + (clientY - startClientY) / scale);

                el.style.left = `${curX}px`;
                el.style.top = `${curY}px`;

                if (!isManagerMode) {
                    node.pos_x = curX;
                    node.pos_y = curY;
                    renderConnections();
                }
            };

            const onCardUp = async () => {
                if (!isDragging) return;
                isDragging = false;
                window.isDraggingAnything = false;

                window.removeEventListener('mousemove', onCardMove);
                window.removeEventListener('mouseup', onCardUp);
                window.removeEventListener('touchmove', onCardMove);
                window.removeEventListener('touchend', onCardUp);
                window.removeEventListener('touchcancel', onCardUp);

                const finalX = parseInt(el.style.left, 10);
                const finalY = parseInt(el.style.top, 10);

                if (isManagerMode) {
                    const centerX = finalX + 145;
                    const centerY = finalY + 60;
                    const targetZone = getDeepestMgrZoneAt(centerX, centerY, [], mgrLayout.zones);

                    mgrLayout.placements[node.id] = {
                        pos_x: finalX,
                        pos_y: finalY,
                        zone_id: targetZone ? targetZone.id : null
                    };
                    saveManagerLayout(mgrLayout);
                    renderCanvas();
                } else {
                    const targetZone = getDeepestZoneAt(finalX + 160, finalY + 100);
                    node.zone_id = targetZone ? targetZone.id : null;
                    await db.from('project_nodes').update({ pos_x: finalX, pos_y: finalY, zone_id: node.zone_id }).eq('id', node.id);
                }
            };

            window.addEventListener('mousemove', onCardMove);
            window.addEventListener('mouseup', onCardUp);
            window.addEventListener('touchmove', onCardMove, { passive: false });
            window.addEventListener('touchend', onCardUp);
            window.addEventListener('touchcancel', onCardUp);
        };

        el.addEventListener('mousedown', startCardDrag);
        el.addEventListener('touchstart', startCardDrag, { passive: false });
        canvas.appendChild(el);
    });

    if (typeof window.adjustCanvasBounds === 'function') window.adjustCanvasBounds();
    renderConnections();
    if (typeof window.syncVisibilityToDOM === 'function') window.syncVisibilityToDOM();
}

function renderConnections(mouseCoords = null) {
    const svgLayer = document.getElementById('connections-layer');
    if (!svgLayer) return;

    if (window.activeCanvasMode === 'manager') {
        svgLayer.innerHTML = '';
        return;
    }

    svgLayer.innerHTML = `
        <defs>
            <marker id="arrowhead" markerWidth="7" markerHeight="5" refX="1.5" refY="2.5" orient="auto">
                <polygon points="0 0, 7 2.5, 0 5" fill="#dd6b20" />
            </marker>
        </defs>
    `;

    const nodeRects = {};
    (currentEdges || []).forEach(edge => {
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

    const fragment = document.createDocumentFragment();

    (currentEdges || []).forEach(edge => {
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
            path.setAttribute('title', `Verbindung (${srcNode.name} ➔ ${tgtNode.name})`);
            path.addEventListener('click', () => handleDisconnectClick(edge.source, edge.target));
            fragment.appendChild(path);
        }
    });

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
        flowPath.setAttribute('title', `Materialfluss: ${srcZone.title} ➔ ${tgtZone.title}`);
        flowPath.addEventListener('click', () => handleDeleteFlowArrow(arrow.id));
        fragment.appendChild(flowPath);
    });

    svgLayer.appendChild(fragment);
}

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

    if (window.activeCanvasMode === 'manager') {
        const mgrLayout = (typeof getManagerLayout === 'function') ? getManagerLayout() : { zones: [], placements: {} };
        (mgrLayout.zones || []).forEach(z => {
            updateBounds(parseFloat(z.pos_x) || 0, parseFloat(z.pos_y) || 0, parseFloat(z.width) || 620, parseFloat(z.height) || 440);
        });
        Object.keys(mgrLayout.placements || {}).forEach(nId => {
            const p = mgrLayout.placements[nId];
            if (p) {
                updateBounds(parseFloat(p.pos_x) || 0, parseFloat(p.pos_y) || 0, 290, 160);
            }
        });
    } else {
        if (targetZoneId) {
            const specific = (currentZones || []).find(z => z.id === targetZoneId);
            if (specific) {
                updateBounds(parseFloat(specific.pos_x) || 0, parseFloat(specific.pos_y) || 0, parseFloat(specific.width) || 400, parseFloat(specific.height) || 300);
            }
        } else {
            const visibleZones = (currentZones || []).filter(z => !window.isZoneHidden(z.id));
            visibleZones.forEach(z => {
                updateBounds(parseFloat(z.pos_x) || 0, parseFloat(z.pos_y) || 0, parseFloat(z.width) || 400, parseFloat(z.height) || 300);
            });

            const visibleNodes = (currentNodes || []).filter(n => !isNodeHiddenByAncestor(n.id) && !(n.zone_id && window.isZoneHidden(n.zone_id)));
            visibleNodes.forEach(n => {
                const isNote = (n.block_type === 'note' || n.doc_number === 'NOTE' || n.doc_number === 'TODO');
                const w = isNote ? (parseFloat(n.budget_design_hours) || 220) : 320;
                const h = isNote ? (parseFloat(n.budget_drafting_hours) || 120) : 200;
                updateBounds(parseFloat(n.pos_x) || 0, parseFloat(n.pos_y) || 0, w, h);
            });
        }
    }

    if (!hasElements || !isFinite(minX) || !isFinite(minY)) {
        window.currentScale = 1;
        window.currentPanX = 50;
        window.currentPanY = 50;
        applyCanvasTransform(false);
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

    applyCanvasTransform(false);
};

window.adjustCanvasBounds = function () {
    let maxX = 0, maxY = 0;

    if (window.activeCanvasMode === 'manager') {
        const mgrLayout = (typeof getManagerLayout === 'function') ? getManagerLayout() : { zones: [], placements: {} };
        (mgrLayout.zones || []).forEach(z => {
            if ((parseFloat(z.pos_x) || 0) + (parseFloat(z.width) || 620) > maxX) maxX = (parseFloat(z.pos_x) || 0) + (parseFloat(z.width) || 620);
            if ((parseFloat(z.pos_y) || 0) + (parseFloat(z.height) || 440) > maxY) maxY = (parseFloat(z.pos_y) || 0) + (parseFloat(z.height) || 440);
        });
        Object.keys(mgrLayout.placements || {}).forEach(nId => {
            const p = mgrLayout.placements[nId];
            if (p) {
                if ((parseFloat(p.pos_x) || 0) + 320 > maxX) maxX = (parseFloat(p.pos_x) || 0) + 320;
                if ((parseFloat(p.pos_y) || 0) + 200 > maxY) maxY = (parseFloat(p.pos_y) || 0) + 200;
            }
        });
    } else {
        (currentZones || []).forEach(z => {
            if (z.pos_x + z.width > maxX) maxX = z.pos_x + z.width;
            if (z.pos_y + z.height > maxY) maxY = z.pos_y + z.height;
        });

        (currentNodes || []).forEach(n => {
            if (n.pos_x + 350 > maxX) maxX = n.pos_x + 350;
            if (n.pos_y + 250 > maxY) maxY = n.pos_y + 250;
        });
    }

    const canvasEl = document.getElementById('canvas');
    if (canvasEl) {
        canvasEl.style.width = Math.max(3000, maxX + 1000) + 'px';
        canvasEl.style.height = Math.max(3000, maxY + 1000) + 'px';
    }
};

window.handleContextMenuAction = async function (type) {
    const menu = document.getElementById('canvasContextMenu');
    if (menu) menu.style.display = 'none';

    if (type === 'mgr_add_existing') {
        if (typeof openAddExistingBlockModal === 'function') openAddExistingBlockModal(contextMenuCoords.x, contextMenuCoords.y);
        return;
    }

    if (type === 'mgr_add_zone') {
        if (typeof handleCreateManagerZone === 'function') handleCreateManagerZone(contextMenuCoords.x, contextMenuCoords.y);
        return;
    }

    if (type === 'mgr_remove_node' && contextTargetNodeId) {
        const layout = getManagerLayout();
        delete layout.placements[contextTargetNodeId];
        saveManagerLayout(layout);
        showToast('Vom Manager-Board entfernt', 'info');
        renderCanvas();
        return;
    }

    if (type === 'mgr_delete_zone' && window.contextTargetZoneId) {
        if (typeof window.deleteManagerZone === 'function') window.deleteManagerZone(window.contextTargetZoneId);
        return;
    }

    if (type === 'duplicate' && contextTargetNodeId) {
        const originalNode = currentNodes.find(n => n.id === contextTargetNodeId);
        if (!originalNode) return;

        let linkedId = originalNode.linked_id;
        if (!linkedId) {
            linkedId = 'inst_' + crypto.randomUUID();
            originalNode.linked_id = linkedId;
            await db.from('project_nodes').update({ linked_id: linkedId }).eq('id', originalNode.id);
        }

        const isMgr = (window.activeCanvasMode === 'manager');
        const newPosX = Math.round(originalNode.pos_x + 40);
        const newPosY = Math.round(originalNode.pos_y + 40);

        const targetZone = !isMgr && (typeof getDeepestZoneAt === 'function')
            ? getDeepestZoneAt(newPosX + 160, newPosY + 100)
            : null;

        const { data, error } = await db.from('project_nodes').insert([{
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
            progress_design: originalNode.progress_design || 0,
            progress_drafting: originalNode.progress_drafting || 0,
            completion_status: originalNode.completion_status || 'open',
            pos_x: newPosX,
            pos_y: newPosY,
            linked_id: linkedId,
            zone_id: targetZone ? targetZone.id : null
        }]).select();

        if (error) {
            showToast('Fehler beim Duplizieren', 'error');
            return;
        }

        const insertedNode = (data && data[0]) ? data[0] : null;

        if (isMgr && insertedNode) {
            const layout = getManagerLayout();
            const origPlacement = layout.placements[originalNode.id];
            const pX = origPlacement ? origPlacement.pos_x + 30 : contextMenuCoords.x;
            const pY = origPlacement ? origPlacement.pos_y + 30 : contextMenuCoords.y;
            const tZone = getDeepestMgrZoneAt(pX + 145, pY + 60, [], layout.zones);

            layout.placements[insertedNode.id] = {
                pos_x: pX,
                pos_y: pY,
                zone_id: tZone ? tZone.id : (origPlacement ? origPlacement.zone_id : null)
            };
            await saveManagerLayout(layout);
        }

        showToast(`Verknüpfte Instanz von "${originalNode.name}" erstellt`, 'success');
        await fetchCanvasData();
        return;
    }

    if (type === 'block') handleOpenAddBlockModal(contextMenuCoords.x - 160, contextMenuCoords.y - 50);
    else if (type === 'zone') handleOpenAddZoneModal(contextMenuCoords.x, contextMenuCoords.y);
    else if (type === 'note') handleOpenAddNoteModal(contextMenuCoords.x, contextMenuCoords.y);
    else if (type === 'delete' && contextTargetNodeId) {
        const nodeToDelete = currentNodes.find(n => n.id === contextTargetNodeId);
        if (nodeToDelete) {
            const confirmed = await customConfirm('Block löschen', `Möchtest du "${nodeToDelete.name}" wirklich entfernen?`);
            if (confirmed) {
                await db.from('project_nodes').delete().eq('id', nodeToDelete.id);
                showToast('Block gelöscht', 'success');
                await fetchCanvasData();
            }
        }
    }
};

window.lastClientX = 0;
window.lastClientY = 0;
window.addEventListener('mousemove', (e) => {
    window.lastClientX = e.clientX;
    window.lastClientY = e.clientY;
});

window.handlePasteNodes = async function () {
    if (!window.copiedNodeIds || window.copiedNodeIds.length === 0) return;

    const coords = getCanvasCoords(window.lastClientX, window.lastClientY);
    const isMgr = (window.activeCanvasMode === 'manager');
    const mgrLayout = isMgr ? getManagerLayout() : null;
    let offsetX = 0;

    for (const originalId of window.copiedNodeIds) {
        const originalNode = currentNodes.find(n => n.id === originalId);
        if (!originalNode) continue;

        let linkedId = originalNode.linked_id;
        const isNote = (originalNode.block_type === 'note' || originalNode.doc_number === 'NOTE');

        if (!linkedId && !isNote) {
            linkedId = 'inst_' + crypto.randomUUID();
            originalNode.linked_id = linkedId;
            await db.from('project_nodes').update({ linked_id: linkedId }).eq('id', originalNode.id);
        }

        const newPosX = Math.round(coords.x + offsetX);
        const newPosY = Math.round(coords.y);

        const targetZone = !isMgr && (typeof getDeepestZoneAt === 'function')
            ? getDeepestZoneAt(newPosX + 160, newPosY + 100)
            : null;

        const { data, error } = await db.from('project_nodes').insert([{
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
            progress_design: originalNode.progress_design || 0,
            progress_drafting: originalNode.progress_drafting || 0,
            completion_status: originalNode.completion_status || 'open',
            pos_x: newPosX,
            pos_y: newPosY,
            linked_id: isNote ? null : linkedId,
            zone_id: targetZone ? targetZone.id : null
        }]).select();

        if (error) {
            showToast('Fehler beim Einfügen', 'error');
            continue;
        }

        const insertedNode = (data && data[0]) ? data[0] : null;

        if (isMgr && insertedNode && mgrLayout) {
            const mgrTargetZone = getDeepestMgrZoneAt(newPosX + 145, newPosY + 60, [], mgrLayout.zones);
            mgrLayout.placements[insertedNode.id] = {
                pos_x: newPosX,
                pos_y: newPosY,
                zone_id: mgrTargetZone ? mgrTargetZone.id : null
            };
        }

        offsetX += 320;
    }

    if (isMgr && mgrLayout) {
        await saveManagerLayout(mgrLayout);
    }

    showToast(`${window.copiedNodeIds.length} Instanz(en) eingefügt`, 'success');
    await fetchCanvasData();
};