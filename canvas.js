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

// Globale State-Variablen für das native Panning/Zooming
// Globale State-Variablen für das native Panning/Zooming
window.currentScale = 1;
window.currentPanX = 100;
window.currentPanY = 100;
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
function applyCanvasTransform(animate = false) {
    const canvasEl = document.getElementById('canvas');
    const viewportEl = document.getElementById('viewport');

    if (animate) {
        canvasEl.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)';
        viewportEl.style.transition = 'background-position 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), background-size 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)';
        setTimeout(() => {
            canvasEl.style.transition = 'none';
            viewportEl.style.transition = 'none';
        }, 250);
    } else {
        canvasEl.style.transition = 'none';
        viewportEl.style.transition = 'none';
    }

    canvasEl.style.transformOrigin = '0 0';
    canvasEl.style.transform = `translate(${window.currentPanX}px, ${window.currentPanY}px) scale(${window.currentScale})`;

    // Viewport-Raster (Infinite Grid) synchronisieren
    const scaledGridSize = 24 * window.currentScale;
    viewportEl.style.backgroundSize = `${scaledGridSize}px ${scaledGridSize}px`;
    viewportEl.style.backgroundPosition = `${window.currentPanX}px ${window.currentPanY}px`;

    const dotSize = Math.max(1, 1.5 * window.currentScale);
    viewportEl.style.backgroundImage = `radial-gradient(circle, #cbd5e0 ${dotSize}px, transparent ${dotSize}px)`;
}

window.handleLiveSplineMove = function(e) {
    if (connectingFirstNodeId) {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        renderConnections(coords);
    }
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Canvas Kontextmenü (Rechtsklick Handling inkl. Notizen)
 * Breadcrumb: [2026-08-25 17:45:00 CEST] Notiz-Menüpunkt in Kontext-Steuerung integriert
 * =============================================================================
 */
window.handleCanvasContextMenu = function(e) {
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
            const canDelete = isAdmin || (isCreator && nodeLogs.length === 0);

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

window.cancelConnectionMode = function() {
    connectingFirstNodeId = null;
    connectingFirstPoint = null;
    renderConnections();
};

function initPanzoom() {
    const viewport = document.getElementById('viewport');
    applyCanvasTransform();

    // Zooming
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

    // Panning & Klick ins Leere
    let isDraggingCanvas = false;
    let startMouseX = 0, startMouseY = 0;

    viewport.addEventListener('mousedown', (e) => {
        // Klick ins Leere hebt die Auswahl auf
        if (e.target.id === 'canvas' || e.target.id === 'viewport' || e.target.id === 'connections-layer') {
            if (selectedNodeIds.size > 0) {
                selectedNodeIds.clear();
                renderCanvas();
            }
        }

        const isControl = e.target.closest('button, input, select, .assembly-card, .note-card, .project-zone-header, .zone-resize-handle');
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

    // Tastatur-Events (Copy/Paste & Escape)
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

        if (e.key === 'Escape') {
            if (connectingFirstNodeId) {
                cancelConnectionMode();
                showToast('Verbindungsvorgang abgebrochen', 'info');
            }
            if (connectingFlowZoneId) {
                connectingFlowZoneId = null;
                showToast('Materialfluss abgebrochen', 'info');
            }
            if (selectedNodeIds.size > 0) {
                selectedNodeIds.clear();
                renderCanvas();
            }
        }

        // Strg + C
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

        // Strg + V
        if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'v' || e.code === 'KeyV')) {
            if (window.copiedNodeIds && window.copiedNodeIds.length > 0) {
                if (typeof window.handlePasteNodes === 'function') {
                    window.handlePasteNodes();
                }
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
                console.error("Fehler beim Aktualisieren der linked_id:", updateErr);
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

        const nodeLogs = currentTimeLogs.filter(l => l.node_id === nodeToDelete.id);
        const isCreator = (activeUserCode && activeUserCode === nodeToDelete.created_by);
        const canDelete = isAdmin || (isCreator && nodeLogs.length === 0);

        if (!canDelete) {
            showToast('Keine Berechtigung zum Löschen dieses Blocks.', 'error');
            return;
        }

        const confirmed = await customConfirm('Block löschen', `Möchtest du "${nodeToDelete.name}" wirklich entfernen?`);
        if (confirmed) {
            await db.from('project_nodes').delete().eq('id', nodeToDelete.id);
            showToast('Block gelöscht', 'success');
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

window.handleEndpointClick = async function(e, nodeId, pointType) {
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

window.handleStartZoneFlow = function(e, zoneId) {
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

window.handleDeleteFlowArrow = async function(arrowId) {
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

window.handleDisconnectClick = async function(sourceId, targetId) {
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

window.toggleSubtreeCollapse = function(e, nodeId) {
    e.stopPropagation();
    if (collapsedParents.has(nodeId)) {
        collapsedParents.delete(nodeId);
    } else {
        collapsedParents.add(nodeId);
    }
    renderCanvas();
};

window.toggleInlineLogs = function(nodeId) {
    if (expandedNodes.has(nodeId)) {
        expandedNodes.delete(nodeId);
    } else {
        expandedNodes.add(nodeId);
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

window.isZoneHidden = function(zoneId) {
    if (!zoneId || !window.hiddenTopZoneIds) return false;
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

window.centerViewOnVisible = function(targetZoneId = null) {
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

    if (!hasElements || !isFinite(minX) || !isFinite(minY)) {
        window.currentScale = 1;
        window.currentPanX = 50;
        window.currentPanY = 50;
        applyCanvasTransform(true);
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

    applyCanvasTransform(true);
};

window.toggleZoneLock = async function(e, zoneId) {
    e.stopPropagation();
    const zone = currentZones.find(z => z.id === zoneId);
    if (!zone) return;

    const newLock = !zone.is_locked;
    zone.is_locked = newLock;
    await db.from('project_zones').update({ is_locked: newLock }).eq('id', zoneId);
    showToast(`Bereich ${newLock ? 'gesperrt (Panzoom aktiv)' : 'entsperrt'}`, 'info');
    renderCanvas();
};

function renderCanvas() {
    const canvas = document.getElementById('canvas');
    const svgLayer = document.getElementById('connections-layer');

    // NEU (nimmt auch bestehende Notizen mit in den Reset):
    const existingCards = canvas.querySelectorAll('.assembly-card, .project-zone, .note-card');
    existingCards.forEach(c => c.remove());
    svgLayer.innerHTML = '';

    const rollups = calculateRollups();

    const nodeDirectStats = {};
    currentNodes.forEach(n => {
        const logs = currentTimeLogs.filter(l => l.node_id === n.id);
        let dSpent = 0, drSpent = 0;
        logs.forEach(l => {
            if (l.task_type === 'design') dSpent += parseFloat(l.hours);
            if (l.task_type === 'drafting') drSpent += parseFloat(l.hours);
        });
        nodeDirectStats[n.id] = {
            dBudg: parseFloat(n.budget_design_hours) || 0,
            drBudg: parseFloat(n.budget_drafting_hours) || 0,
            dSpent,
            drSpent
        };
    });

    /**
         * =============================================================================
         * Breadcrumb: [2026-08-24 20:20:00 CEST] Direkte Zonen-Logs in Rollups integriert
         * =============================================================================
         */
    const zoneRollups = {};
    if (!window.expandedZones) window.expandedZones = new Set();

    currentZones.forEach(z => {
        const zLogs = currentTimeLogs.filter(l => l.zone_id === z.id || l.node_id === z.id);
        let dSpentDirect = 0, drSpentDirect = 0;
        zLogs.forEach(l => {
            if (l.task_type === 'design') dSpentDirect += parseFloat(l.hours);
            if (l.task_type === 'drafting') drSpentDirect += parseFloat(l.hours);
        });

        zoneRollups[z.id] = {
            dBudg: parseFloat(z.budget_design_hours) || 0,
            drBudg: parseFloat(z.budget_drafting_hours) || 0,
            dSpent: dSpentDirect,
            drSpent: drSpentDirect,
            directLogs: zLogs
        };
    });

    /**
         * =============================================================================
         * Breadcrumb: [2026-08-25 17:20:19 CEST] Master-Instanz Logik: Zonen-Rollups
         * berücksichtigen nur noch die Master-Instanz. Zeiten aller Instanzen werden 
         * auf die Zone der Master-Instanz umgeleitet.
         * =============================================================================
         */
    /**
         * =============================================================================
         * Breadcrumb: [2026-08-25 17:45:00 CEST] Master-Instanz Logik & Notiz-Filter:
         * Notizen besitzen keine Budgets/Zeiten und werden im Rollup ignoriert.
         * =============================================================================
         */
    currentNodes.forEach(n => {
        if (n.block_type === 'note' || n.doc_number === 'NOTE') return; // Notizen bei Zonen-Budgets ignorieren

        const relatedIds = n.linked_id ? currentNodes.filter(x => x.linked_id === n.linked_id).map(x => x.id) : [n.id];
        const isEffectivelyLinked = relatedIds.length > 1;

        // Die Master-Instanz ist der erste Node mit dieser linked_id (oder sich selbst)
        const isMaster = !isEffectivelyLinked || (currentNodes.find(x => x.linked_id === n.linked_id).id === n.id);

        if (isMaster && n.zone_id && zoneRollups[n.zone_id]) {
            // Budget nur vom Master an den Kasten übergeben
            zoneRollups[n.zone_id].dBudg += nodeDirectStats[n.id].dBudg;
            zoneRollups[n.zone_id].drBudg += nodeDirectStats[n.id].drBudg;

            // Zeiten ALLER referenzierten Instanzen auf den Kasten des Masters summieren
            relatedIds.forEach(relId => {
                zoneRollups[n.zone_id].dSpent += nodeDirectStats[relId].dSpent;
                zoneRollups[n.zone_id].drSpent += nodeDirectStats[relId].drSpent;
            });
        }
    });

    const zonesByDepthDesc = [...currentZones].sort((a, b) => getZoneDepth(b.id) - getZoneDepth(a.id));
    zonesByDepthDesc.forEach(z => {
        if (z.parent_zone_id && zoneRollups[z.parent_zone_id]) {
            zoneRollups[z.parent_zone_id].dBudg += zoneRollups[z.id].dBudg;
            zoneRollups[z.parent_zone_id].drBudg += zoneRollups[z.id].drBudg;
            zoneRollups[z.parent_zone_id].dSpent += zoneRollups[z.id].dSpent;
            zoneRollups[z.parent_zone_id].drSpent += zoneRollups[z.id].drSpent;
        }
    });

    const sortedZones = [...currentZones].sort((a, b) => getZoneDepth(a.id) - getZoneDepth(b.id));

    sortedZones.forEach(zone => {
        if (window.isZoneHidden(zone.id)) return;

        const zoneEl = document.createElement('div');
        zoneEl.id = zone.id;
        const canMoveZone = (isAdmin || (activeUserCode && activeUserCode === zone.created_by)) && !zone.is_locked;
        const zoneDepth = getZoneDepth(zone.id);

        zoneEl.className = `project-zone ${zone.is_locked ? 'zone-locked' : 'no-pan'} ${canMoveZone ? 'draggable-enabled' : ''}`;
        zoneEl.style.left = `${zone.pos_x}px`;
        zoneEl.style.top = `${zone.pos_y}px`;
        zoneEl.style.width = `${zone.width}px`;
        zoneEl.style.height = `${zone.height}px`;
        zoneEl.style.borderColor = zone.color_hex || '#a0aec0';
        zoneEl.style.zIndex = 2 + zoneDepth;

        const zStats = zoneRollups[zone.id];
        const zdPieStyle = generatePieStyle(zStats.dSpent, zStats.dBudg, zone.color_hex || '#a0aec0');
        const zdrPieStyle = generatePieStyle(zStats.drSpent, zStats.drBudg, '#38a169');

        /**
                 * =============================================================================
                 * Breadcrumb: [2026-08-24 19:43:00 CEST] Textuelle Budget-Anzeige (Ist / Soll) 
                 * direkt neben den Pie-Charts in den Zonen-Headern platziert.
                 * =============================================================================
                 */
        /**
              * =============================================================================
              * Breadcrumb: [2026-08-24 20:20:00 CEST] Logging-Formular & Tabelle für Rahmen
              * =============================================================================
              */
        const identifier = zone.article_number || zone.doc_number || '';
        let badgeHtml = '';
        if (identifier) {
            badgeHtml = `<div class="assembly-id-badge" style="border-color: ${zone.color_hex || '#a0aec0'};" title="${zone.article_number ? 'Artikelnummer' : 'Vault DOC-Nummer'}">${escapeHtml(identifier)}</div>`;
        }

        const isZoneExpanded = window.expandedZones.has(zone.id);
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
                 * Breadcrumb: [2026-08-24 20:30:00 CEST] Zuweisungs-Badges für Rahmen (3D & Zeichnung)
                 * =============================================================================
                 */
        let assignedBadgesHtml = '';
        if (zone.assigned_design_user) {
            assignedBadgesHtml += `<span class="author-badge" style="background:#2b6cb0; margin-left:8px; display:inline-flex; align-items:center; gap:3px;" title="CAD / 3D: ${escapeHtml(zone.assigned_design_user)}"><span style="border:1.5px solid #fff; border-radius:2px; padding:0 2px; font-size:8px; line-height:1; font-weight:bold;">3D</span> <strong>${escapeHtml(zone.assigned_design_user)}</strong></span>`;
        }
        if (zone.assigned_drafting_user) {
            assignedBadgesHtml += `<span class="author-badge" style="background:#38a169; margin-left:4px; display:inline-flex; align-items:center; gap:3px;" title="Zeichnung: ${escapeHtml(zone.assigned_drafting_user)}">📄 <strong>${escapeHtml(zone.assigned_drafting_user)}</strong></span>`;
        }

        zoneEl.innerHTML = `
      ${badgeHtml}
      <div class="project-zone-header no-pan" style="border-bottom-color: ${zone.color_hex || '#a0aec0'}; align-items: flex-start;">
        <div style="display:flex; flex-direction:column; gap:6px;">
          
          <div style="display:flex; align-items:center;">
             <span>📍 ${escapeHtml(zone.title)}</span>
             ${assignedBadgesHtml}
          </div>

          <div style="display:flex; gap:16px; cursor:default; align-items: center; margin-top: 2px;">
              <div style="display:flex; align-items: center; gap: 6px;" title="CAD Budget">
                  <div class="pie-chart" style="${zdPieStyle}; width: 22px; height: 22px;">
                      <div class="pie-inner" style="width: 14px; height: 14px;"></div>
                  </div>
                  <div style="display:flex; flex-direction:column; font-size: 10px; line-height: 1.2;">
                      <span style="color: #4a5568; font-weight: 800;">CAD</span>
                      <span style="color: #718096; font-family: monospace;">${formatHoursToHM(zStats.dSpent)} / ${formatHoursToHM(zStats.dBudg)}</span>
                  </div>
              </div>
              <div style="display:flex; align-items: center; gap: 6px;" title="Zeichnung Budget">
                  <div class="pie-chart" style="${zdrPieStyle}; width: 22px; height: 22px;">
                      <div class="pie-inner" style="width: 14px; height: 14px;"></div>
                  </div>
                  <div style="display:flex; flex-direction:column; font-size: 10px; line-height: 1.2;">
                      <span style="color: #4a5568; font-weight: 800;">Zeichnung</span>
                      <span style="color: #718096; font-family: monospace;">${formatHoursToHM(zStats.drSpent)} / ${formatHoursToHM(zStats.drBudg)}</span>
                  </div>
              </div>
          </div>
        </div>
        <div class="zone-actions">
          <button type="button" class="zone-btn" title="Zeiten auf Rahmen buchen & Details" onclick="toggleZoneLogs(event, '${zone.id}')">⏱️ Zeiten</button>
          <button type="button" class="zone-flow-btn" title="Materialfluss-Pfeil ziehen" onclick="handleStartZoneFlow(event, '${zone.id}')">➔ Fluss</button>
          <button type="button" class="zone-btn" title="Position sperren/entsperren" onclick="toggleZoneLock(event, '${zone.id}')">${zone.is_locked ? '🔒' : '🔓'}</button>
          ${isAdmin || (activeUserCode && activeUserCode === zone.created_by) ? `
            <button type="button" class="zone-btn" title="Bearbeiten" onclick="openEditZoneModal('${zone.id}')">✏️</button>
            <button type="button" class="zone-btn" style="color:#e53e3e;" title="Löschen" onclick="handleDeleteZone('${zone.id}')">✕</button>
          ` : ''}
        </div>
      </div>
      
      ${isZoneExpanded ? `
      <div class="zone-body no-pan" style="background: rgba(255, 255, 255, 0.96); padding: 10px; border-bottom: 1px dashed #cbd5e0; position: relative; z-index: 10; pointer-events: auto;">
        <form class="log-form" onsubmit="handleZoneLog(event, '${zone.id}')">
          <div class="time-inputs-row">
            <select class="log-input" style="font-weight: bold; width: 60px;">
              <option value="${activeUserCode}">${activeUserCode || 'KÜR'}</option>
            </select>
            <select class="log-input" style="width: 75px;">
              <option value="drafting">Zeichn.</option>
              <option value="design">CAD</option>
            </select>
            <input type="number" class="log-input input-hours" min="0" value="0" style="width: 44px;" title="Mausrad: +/- 1h" onwheel="handleTimeWheel(event, 'hour')" required />
            <span>h</span>
            <input type="number" class="log-input input-mins" min="0" max="55" step="5" value="30" style="width: 44px;" title="Mausrad: +/- 5m" onwheel="handleTimeWheel(event, 'min')" required />
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

      <div class="zone-resize-handle no-pan" title="Größe anpassen"></div>
    `;

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

            zoneEl.addEventListener('mousedown', (e) => {
                if (e.target.closest('.zone-actions, .zone-resize-handle')) return;

                window.isDraggingAnything = true;
                isDragging = true;
                const scale = window.currentScale;
                startX = e.clientX;
                startY = e.clientY;

                initLeft = zone.pos_x;
                initTop = zone.pos_y;

                descendantZoneIds = getAllDescendantZones(zone.id);
                allMovedZoneIds = [zone.id, ...descendantZoneIds];
                descendantZones = currentZones.filter(z => descendantZoneIds.includes(z.id));
                childNodes = currentNodes.filter(n => allMovedZoneIds.includes(n.zone_id));

                childStartPos = childNodes.map(n => ({ id: n.id, x: n.pos_x, y: n.pos_y }));
                childZonesStartPos = descendantZones.map(z => ({ id: z.id, x: z.pos_x, y: z.pos_y }));

                e.stopPropagation();

                const onMouseMove = (moveEvent) => {
                    if (!isDragging) return;
                    const dx = (moveEvent.clientX - startX) / scale;
                    const dy = (moveEvent.clientY - startY) / scale;

                    zone.pos_x = Math.max(10, Math.round(initLeft + dx));
                    zone.pos_y = Math.max(10, Math.round(initTop + dy));
                    zoneEl.style.left = `${zone.pos_x}px`;
                    zoneEl.style.top = `${zone.pos_y}px`;

                    descendantZones.forEach((z, idx) => {
                        z.pos_x = Math.max(10, Math.round(childZonesStartPos[idx].x + dx));
                        z.pos_y = Math.max(10, Math.round(childZonesStartPos[idx].y + dy));
                        const zEl = document.getElementById(z.id);
                        if (zEl) {
                            zEl.style.left = `${z.pos_x}px`;
                            zEl.style.top = `${z.pos_y}px`;
                        }
                    });

                    childNodes.forEach((n, idx) => {
                        n.pos_x = Math.max(10, Math.round(childStartPos[idx].x + dx));
                        n.pos_y = Math.max(10, Math.round(childStartPos[idx].y + dy));
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

                const onMouseUp = async () => {
                    if (!isDragging) return;
                    isDragging = false;
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);

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
                        fetchCanvasData();
                    } else {
                        renderCanvas();
                    }
                };

                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            });
        }

        const resizeHandle = zoneEl.querySelector('.zone-resize-handle');
        if (resizeHandle && (isAdmin || (activeUserCode && activeUserCode === zone.created_by))) {
            resizeHandle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                window.isDraggingAnything = true;
                let isResizing = true;
                const scale = window.currentScale;
                const startW = zone.width;
                const startH = zone.height;
                const startMouseX = e.clientX;
                const startMouseY = e.clientY;

                const onResizeMove = (moveEvent) => {
                    if (!isResizing) return;
                    const dw = (moveEvent.clientX - startMouseX) / scale;
                    const dh = (moveEvent.clientY - startMouseY) / scale;
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
                    await db.from('project_zones').update({ width: zone.width, height: zone.height }).eq('id', zone.id);

                    window.isDraggingAnything = false;
                    if (window.pendingCanvasUpdate) {
                        window.pendingCanvasUpdate = false;
                        fetchCanvasData();
                    }
                };

                window.addEventListener('mousemove', onResizeMove);
                window.addEventListener('mouseup', onResizeUp);
            });
        }

        canvas.appendChild(zoneEl);
    });

    /**
         * =============================================================================
         * Breadcrumb: [2026-08-25 17:20:19 CEST] Master-Instanz Logik: Visuelle 
         * Abgrenzung, Klammer-Budgets und Log-Weiterleitung an den Master.
         * =============================================================================
         */
    /**
     * =============================================================================
     * Breadcrumb: [2026-08-25 17:55:00 CEST] Sticky Notes Rendering & Sichtbarkeit gefixt
     * =============================================================================
     */
    currentNodes.forEach(node => {
        // Notizen besitzen keine Parent-Kanten; nur Kasten-Sichtbarkeit prüfen
        if (node.zone_id && window.isZoneHidden(node.zone_id)) return;

        // 1. STICKY NOTES RENDERING
        if (node.block_type === 'note' || node.doc_number === 'NOTE') {
            const isPrivate = node.article_number === 'private';
            const userCode = (activeUserCode || '').toUpperCase();
            const noteCreator = (node.created_by || '').toUpperCase();

            // Privat-Check: Nur Ersteller und Admin sehen private Notizen
            if (isPrivate && noteCreator !== userCode && !isAdmin) return;

            const el = document.createElement('div');
            el.id = node.id;
            const canDrag = isAdmin || (userCode === noteCreator);

            el.className = `note-card no-pan ${canDrag ? 'draggable-enabled' : 'draggable-disabled'}`;
            el.style.left = `${node.pos_x}px`;
            el.style.top = `${node.pos_y}px`;
            el.style.backgroundColor = node.color_hex || '#fefcbf';
            el.style.border = '1px solid rgba(0, 0, 0, 0.1)';

            const lockIcon = isPrivate ? '<span style="font-size:12px;" title="Private Notiz (Nur für dich sichtbar)">🔒</span>' : '';

            // CSS-Ergänzung für pointer-events-none auf inneren Elementen, damit Dragging sauber greift
            el.innerHTML = `
                <div style="pointer-events: none; display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:10px; font-weight:bold; color:#4a5568; border-bottom:1px solid rgba(0,0,0,0.08); padding-bottom:3px;">
                    <span>📝 ${escapeHtml(node.created_by || 'COT')}</span>
                    ${lockIcon}
                </div>
                <div style="pointer-events: none; white-space: pre-wrap; word-break: break-word; font-size:12px; color:#2d3748; flex:1;">${escapeHtml(node.name)}</div>
            `;

            // Hover-Status fürs Kopieren merken
            el.addEventListener('mouseenter', () => {
                window.hoveredNodeId = node.id; // Für Copy&Paste merken
                if (node.linked_id) {
                    document.querySelectorAll(`.assembly-card[data-linked-id="${node.linked_id}"]`).forEach(card => card.classList.add('linked-highlight'));
                }
            });

            el.addEventListener('mouseleave', () => {
                window.hoveredNodeId = null; // Verwerfen
                if (node.linked_id) {
                    document.querySelectorAll(`.assembly-card[data-linked-id="${node.linked_id}"]`).forEach(card => card.classList.remove('linked-highlight'));
                }
            });

            el.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                if (canDrag && typeof openEditNoteModal === 'function') openEditNoteModal(node.id);
            });

            if (canDrag) {
                let isDragging = false;
                let startClientX = 0, startClientY = 0;
                let initX = 0, initY = 0;

                el.addEventListener('mousedown', (e) => {
                    // Verhindern, dass Rechtsklicks das Dragging starten
                    if (e.button !== 0) return;

                    window.isDraggingAnything = true;
                    isDragging = true;
                    startClientX = e.clientX;
                    startClientY = e.clientY;
                    initX = node.pos_x;
                    initY = node.pos_y;
                    e.stopPropagation();

                    const onMouseMove = (moveEvent) => {
                        if (!isDragging) return;
                        const scale = window.currentScale || 1;
                        const dx = (moveEvent.clientX - startClientX) / scale;
                        const dy = (moveEvent.clientY - startClientY) / scale;

                        node.pos_x = Math.round(initX + dx);
                        node.pos_y = Math.round(initY + dy);
                        el.style.left = `${node.pos_x}px`;
                        el.style.top = `${node.pos_y}px`;
                    };

                    const onMouseUp = async (upEvent) => {
                        if (!isDragging) return;
                        isDragging = false;
                        window.removeEventListener('mousemove', onMouseMove);
                        window.removeEventListener('mouseup', onMouseUp);

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
                        // Anstatt auf einen weiteren Fetch zu warten, erzwingen wir ein direktes Re-Rendering
                        if (typeof renderCanvas === 'function') renderCanvas();

                        // Im Hintergrund syncen
                        if (window.pendingCanvasUpdate && typeof fetchCanvasData === 'function') {
                            window.pendingCanvasUpdate = false;
                            fetchCanvasData();
                        }
                    };
                    window.addEventListener('mousemove', onMouseMove);
                    window.addEventListener('mouseup', onMouseUp);
                });
            }

            canvas.appendChild(el);
            return; // Schleifendurchlauf für diesen Block beenden
        }

        // 2. REGULÄRE BAUGRUPPEN / BAUTEILE
        if (isNodeHiddenByAncestor(node.id)) return;

        // --- HIER GEHT DER BESTEHENDE CODE FÜR BAUGRUPPEN WEITER ---
        const relatedNodeIds = node.linked_id
            ? currentNodes.filter(n => n.linked_id === node.linked_id).map(n => n.id)
            : [node.id];

        // Nur wenn es WIRKLICH mehr als ein Element mit dieser ID gibt, ist es eine aktive Instanz
        const isEffectivelyLinked = relatedNodeIds.length > 1;

        // Master-Erkennung für den aktuellen Block
        const isMaster = !isEffectivelyLinked || (currentNodes.find(n => n.linked_id === node.linked_id).id === node.id);
        const masterNode = isEffectivelyLinked ? currentNodes.find(n => n.linked_id === node.linked_id) : node;

        // Zeiten für die Anzeige aggregieren
        let dSpentAgg = 0;
        let drSpentAgg = 0;
        relatedNodeIds.forEach(id => {
            const st = rollups[id] || { totalDesign: 0, totalDrafting: 0, logs: [] };
            dSpentAgg += st.totalDesign;
            drSpentAgg += st.totalDrafting;
        });

        const nodeLogs = currentTimeLogs.filter(l => relatedNodeIds.includes(l.node_id));

        const nodeColor = node.color_hex || '#2b6cb0';
        const creator = node.created_by || 'COT';
        const bType = node.block_type || 'assembly';
        const typeLabel = bType === 'part' ? 'Bauteil' : 'Baugruppe';

        const canDrag = isAdmin || (activeUserCode && activeUserCode === creator);

        // Budgets vom Master übernehmen
        const dBudg = Math.max(0, parseFloat(masterNode.budget_design_hours) || 0);
        const dPct = dBudg > 0 ? Math.round((dSpentAgg / dBudg) * 100) : 0;
        const dPieStyle = generatePieStyle(dSpentAgg, dBudg, nodeColor);

        const drBudg = Math.max(0, parseFloat(masterNode.budget_drafting_hours) || 0);
        const drPct = drBudg > 0 ? Math.round((drSpentAgg / drBudg) * 100) : 0;
        const drPieStyle = generatePieStyle(drSpentAgg, drBudg, '#38a169');

        // Textuelle Darstellung: Budgets bei Instanzen in Klammern setzen
        const dStr = isMaster ? `${formatHoursToHM(dSpentAgg)} / ${formatHoursToHM(dBudg)}` : `(${formatHoursToHM(dSpentAgg)} / ${formatHoursToHM(dBudg)})`;
        const drStr = isMaster ? `${formatHoursToHM(drSpentAgg)} / ${formatHoursToHM(drBudg)}` : `(${formatHoursToHM(drSpentAgg)} / ${formatHoursToHM(drBudg)})`;

        const isExpanded = expandedNodes.has(node.id);

        const hasChildren = currentEdges.some(e => e.source === node.id);
        const isSubtreeCollapsed = collapsedParents.has(node.id);

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

        const isConnectingThisNode = connectingFirstNodeId === node.id;
        const isSelected = selectedNodeIds.has(node.id);

        const el = document.createElement('div');
        el.id = node.id;
        if (isEffectivelyLinked) el.dataset.linkedId = node.linked_id;

        // HIGHLIGHT-KLASSE ".selected-node" anwenden
        el.className = `assembly-card no-pan ${canDrag ? 'draggable-enabled' : 'draggable-disabled'} ${isSelected ? 'selected-node' : ''} ${isDimmed ? 'node-dimmed' : ''}`;
        el.style.left = `${node.pos_x}px`;
        el.style.top = `${node.pos_y}px`;
        el.style.borderColor = nodeColor;
        // Referenz-Instanzen visuell abgrenzen (gestrichelter Rand - NUR wenn es weitere Instanzen gibt)
        el.style.borderStyle = (isEffectivelyLinked && !isMaster) ? 'dashed' : 'solid';
        el.style.zIndex = "10";

        // Icon mit Tooltip und Text-Suffix für Referenzen (verschwindet, wenn es keine Referenzen mehr gibt)
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

        el.innerHTML = `
      ${badgeHtml}
      <div id="ep-top-${node.id}" class="ep-handle ep-top ${isConnectingThisNode ? 'active-source' : ''}" title="Knotenpunkt oben" onclick="handleEndpointClick(event, '${node.id}', 'top')"></div>
      <div id="ep-bottom-${node.id}" class="ep-handle ep-bottom ${isConnectingThisNode ? 'active-source' : ''}" title="Knotenpunkt unten" onclick="handleEndpointClick(event, '${node.id}', 'bottom')"></div>
      <div id="ep-left-${node.id}" class="ep-handle ep-left ${isConnectingThisNode ? 'active-source' : ''}" title="Knotenpunkt links" onclick="handleEndpointClick(event, '${node.id}', 'left')"></div>
      <div id="ep-right-${node.id}" class="ep-handle ep-right ${isConnectingThisNode ? 'active-source' : ''}" title="Knotenpunkt rechts" onclick="handleEndpointClick(event, '${node.id}', 'right')"></div>


      <div class="assembly-header" style="background: ${nodeColor}; flex-direction: column; align-items: stretch; gap: 6px;">
        
        <!-- Zeile 1: Name und Status-Icons -->
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div style="display: flex; align-items: center; overflow: hidden; white-space: nowrap; flex: 1;">
            ${subtreeBtnHtml}
            <span style="overflow: hidden; text-overflow: ellipsis; font-size: 14px;" title="${escapeHtml(node.name)}"><strong>${escapeHtml(node.name)}</strong></span>
          </div>
          <div style="flex-shrink: 0; margin-left: 6px; display: flex; align-items: center; gap: 4px;">
            ${statusIcon}${linkedIconHtml}
          </div>
        </div>

        <!-- Zeile 2: Zuweisungen und Metadaten -->
        <div class="header-meta" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div style="display: flex; gap: 4px; overflow: hidden;">
            ${assignedBadgesHtml}
          </div>
          <span class="author-badge" style="flex-shrink: 0;" title="Typ: ${typeLabel} | Ersteller: ${escapeHtml(creator)}">${escapeHtml(typeLabel)} [${escapeHtml(creator)}]</span>
        </div>
        
      </div>
      <div class="assembly-body">
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
        <!-- OnSubmit leitet den Log nun auf die masterNode.id um -->
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
            <input type="number" class="log-input input-mins" min="0" max="55" step="5" value="30" style="width: 44px;" title="Minuten (Mausrad: +/- 5m)" onwheel="handleTimeWheel(event, 'min')" required />
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

        // Klick markiert den Block sofort (für Strg+C / Strg+V)
        el.addEventListener('click', (e) => {
            if (e.target.closest('button, input, select, .ep-handle')) return;
            e.stopPropagation();
            if (e.ctrlKey || e.metaKey || e.shiftKey) {
                if (selectedNodeIds.has(node.id)) selectedNodeIds.delete(node.id);
                else selectedNodeIds.add(node.id);
            } else {
                selectedNodeIds.clear();
                selectedNodeIds.add(node.id);
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

            el.addEventListener('mousedown', (e) => {
                if (e.target.closest('input, select, button, .ep-handle, .btn-delete-log, .btn-tree-toggle')) return;
                // Damit wir bei Strg+Klick nicht draggen, sondern nur auswählen:
                if (e.ctrlKey || e.shiftKey || e.metaKey) return;

                window.isDraggingAnything = true;
                isDragging = true;
                startClientX = e.clientX;
                startClientY = e.clientY;
                e.stopPropagation();

                const nodesToMove = (selectedNodeIds.has(node.id))
                    ? Array.from(selectedNodeIds).map(id => currentNodes.find(n => n.id === id)).filter(Boolean)
                    : [node];

                initialNodePositions.clear();
                nodesToMove.forEach(n => {
                    initialNodePositions.set(n.id, { x: n.pos_x, y: n.pos_y });
                });

                const onMouseMove = (moveEvent) => {
                    if (!isDragging) return;
                    const scale = window.currentScale || 1;
                    const dx = (moveEvent.clientX - startClientX) / scale;
                    const dy = (moveEvent.clientY - startClientY) / scale;

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

                        currentZones.forEach(z => {
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

                    const primaryInit = initialNodePositions.get(nodesToMove[0].id);
                    const scale = window.currentScale || 1;
                    const dx = (window.lastClientX - startClientX) / scale;
                    const dy = (window.lastClientY - startClientY) / scale;

                    let targetZoneId = null;
                    if (primaryInit) {
                        const centerX = (primaryInit.x + dx) + 160;
                        const centerY = (primaryInit.y + dy) + 100;
                        const targetZone = getDeepestZoneAt(centerX, centerY);
                        targetZoneId = targetZone ? targetZone.id : null;
                    }

                    currentZones.forEach(z => {
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
            });
        }

        canvas.appendChild(el);
    });

    window.adjustCanvasBounds();
    renderConnections();
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
function renderConnections(mouseCoords = null) {
    const svgLayer = document.getElementById('connections-layer');
    if (!svgLayer) return;

    svgLayer.innerHTML = `
        <defs>
            <marker id="arrowhead" markerWidth="7" markerHeight="5" refX="1.5" refY="2.5" orient="auto">
                <polygon points="0 0, 7 2.5, 0 5" fill="#dd6b20" />
            </marker>
        </defs>
    `;

    // 1. Hierarchische Kanten (Block zu Block)
    currentEdges.forEach(edge => {
        const srcNode = currentNodes.find(n => n.id === edge.source);
        const tgtNode = currentNodes.find(n => n.id === edge.target);

        const srcHidden = isNodeHiddenByAncestor(edge.source) || (srcNode && srcNode.zone_id && window.isZoneHidden(srcNode.zone_id));
        const tgtHidden = isNodeHiddenByAncestor(edge.target) || (tgtNode && tgtNode.zone_id && window.isZoneHidden(tgtNode.zone_id));

        if (srcHidden || tgtHidden || collapsedParents.has(edge.source)) return;

        if (srcNode && tgtNode) {
            const p1 = getNodeHandleCoords(srcNode, edge.source_handle || 'bottom');
            const p2 = getNodeHandleCoords(tgtNode, edge.target_handle || 'top');

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

            svgLayer.appendChild(path);
        }
    });

    // 2. Materialfluss-Pfeile (Straffere, tangentiale Bogenführung mit geradem Start/Ziel)
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

        let x1, y1, x2, y2, cp1X, cp1Y, cp2X, cp2Y;

        const isTargetBelow = tgtY1 >= srcY2 - 20;
        const isTargetAbove = tgtY2 <= srcY1 + 20;
        const isTargetLeft = tgtX2 <= srcX1 + 20;

        // "Stutzen": Die Linie verläuft erst 10px gerade, bevor sie abbiegt
        const stub = 10;
        const minTangent = 50;
        let pathD = '';

        if (isTargetBelow) {
            x1 = srcX1 + srcW / 2; y1 = srcY2;
            x2 = tgtX1 + tgtW / 2; y2 = tgtY1;
            const dist = Math.max(minTangent, Math.abs(y2 - y1) * 0.4);
            // M = Start | L = Gerade zu | C = Kurve ab hier | L = Gerade in Pfeil
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
            // Rechts (Default)
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

        svgLayer.appendChild(flowPath);
    });

    // 3. Live Spline Preview
    if (connectingFirstPoint && mouseCoords) {
        const p1 = connectingFirstPoint;
        const p2 = mouseCoords;
        const dx = Math.max(30, Math.abs(p2.x - p1.x) * 0.4);
        const dy = Math.max(30, Math.abs(p2.y - p1.y) * 0.4);

        const pathD = `M ${p1.x} ${p1.y} C ${p1.x + dy}, ${p2.x - dy}, ${p2.x} ${p2.y}`;
        const preview = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        preview.setAttribute('d', pathD);
        preview.setAttribute('class', 'preview-connection-line');
        svgLayer.appendChild(preview);
    }
}

window.adjustCanvasBounds = function() {
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
    canvasEl.style.width = Math.max(3000, maxX + 3000) + 'px';
    canvasEl.style.height = Math.max(3000, maxY + 3000) + 'px';
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
window.handlePasteNodes = async function() {
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