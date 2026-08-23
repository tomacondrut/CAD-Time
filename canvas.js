/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: NATIVE Canvas Engine (Ohne Panzoom)
 * Update: Komplett eigenständige CSS-Transform Engine à la "index_3.html"
 * =============================================================================
 */

// Globale State-Variablen für das native Panning/Zooming
window.currentScale = 1;
window.currentPanX = 100;
window.currentPanY = 100;

// Dummy-Proxy, damit dein bestehender Drag&Drop Code nicht umgeschrieben werden muss
window.panzoomInstance = { getScale: () => window.currentScale };

let connectingFirstNodeId = null;
let connectingFirstPoint = null;
let contextMenuCoords = { x: 100, y: 100 };

/**
 * Wendet die Zoom- und Pan-Werte nativ als CSS-Matrix an
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Transform Engine & Infinite Grid
 * ERSETZEN IN: canvas.js
 * Breadcrumbs:
 *   - [2026-08-23] Infinite Grid: Raster wurde vom Canvas gelöst und wird nun
 *     auf dem Viewport in Echtzeit mit Pan & Zoom synchronisiert. Die Dot-Größe
 *     skaliert dabei ebenfalls proportional mit.
 * =============================================================================
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

    // Ursprung ist und bleibt OBEN LINKS (0 0)
    canvasEl.style.transformOrigin = '0 0';
    canvasEl.style.transform = `translate(${window.currentPanX}px, ${window.currentPanY}px) scale(${window.currentScale})`;

    // =========================================================================
    // Viewport-Raster synchron halten
    // =========================================================================
    const scaledGridSize = 24 * window.currentScale;
    viewportEl.style.backgroundSize = `${scaledGridSize}px ${scaledGridSize}px`;
    viewportEl.style.backgroundPosition = `${window.currentPanX}px ${window.currentPanY}px`;

    // Punktgröße (Dot-Radius) proportional mitskalieren
    const dotSize = Math.max(1, 1.5 * window.currentScale);
    viewportEl.style.backgroundImage = `radial-gradient(circle, #cbd5e0 ${dotSize}px, transparent ${dotSize}px)`;
}


/**
 * =============================================================================
 * FEHLENDE FUNKTIONEN FÜR PANZOOM UND DRAG-EVENTS
 * Breadcrumb: [2026-08-23] Hinzugefügt, da ReferenceErrors den App-Start blockierten
 * =============================================================================
 */

window.handleLiveSplineMove = function(e) {
    if (connectingFirstNodeId) {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        renderConnections(coords);
    }
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Kontextmenü Steuerung & Rechtsklick-Duplizierung
 * ERSETZEN IN: canvas.js
 * Breadcrumbs:
 *   - [2026-08-23 10:00:00 CEST]: Canvas-weites Kontextmenü für Block/Zone
 *   - [2026-08-23 15:10:00 CEST]: Rechtsklick auf Karte erkennt node_id und 
 *     schaltet "Als Instanz duplizieren" frei.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Kontextmenü Steuerung (Duplizieren & Berechtigtes Löschen)
 * ERSETZEN IN: canvas.js
 * Breadcrumbs:
 *   - [2026-08-23 15:58:00 CEST]: Rechtsklick-Löschen mit dynamischer Rechteprüfung
 *     (Admin oder Ersteller ohne Zeitbuchungen) integriert.
 * =============================================================================
 */
let contextTargetNodeId = null;

window.handleCanvasContextMenu = function(e) {
    e.preventDefault();

    // UI-Elemente ignorieren
    if (e.target.closest('button, input, select, .sidebar')) return;

    const menu = document.getElementById('canvasContextMenu');
    const itemDuplicate = document.getElementById('ctxMenuDuplicateNode');
    const itemDelete = document.getElementById('ctxMenuDeleteNode');
    const itemAddBlock = document.getElementById('ctxMenuAddBlock');
    const itemAddZone = document.getElementById('ctxMenuAddZone');

    // Prüfen, ob der Rechtsklick auf eine Baugruppen-Karte erfolgte
    const cardEl = e.target.closest('.assembly-card');
    if (cardEl) {
        contextTargetNodeId = cardEl.id;
        const targetNode = currentNodes.find(n => n.id === contextTargetNodeId);

        if (targetNode) {
            const nodeLogs = currentTimeLogs.filter(l => l.node_id === targetNode.id);
            const isCreator = (activeUserCode && activeUserCode === targetNode.created_by);
            const canDelete = isAdmin || (isCreator && nodeLogs.length === 0);

            if (itemDuplicate) itemDuplicate.style.display = 'flex';
            if (itemDelete) itemDelete.style.display = canDelete ? 'flex' : 'none';
        }

        if (itemAddBlock) itemAddBlock.style.display = 'none';
        if (itemAddZone) itemAddZone.style.display = 'none';
    } else {
        contextTargetNodeId = null;
        if (itemDuplicate) itemDuplicate.style.display = 'none';
        if (itemDelete) itemDelete.style.display = 'none';
        if (itemAddBlock) itemAddBlock.style.display = 'flex';
        if (itemAddZone) itemAddZone.style.display = 'flex';
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

    // 1. Initial anwenden
    applyCanvasTransform();

    // 2. EXAKTES MAUSRAD-ZOOMEN AUF DEN CURSOR
    viewport.addEventListener('wheel', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        e.preventDefault();

        // 1.15 für rein, 0.85 für raus
        const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
        const newScale = Math.min(Math.max(window.currentScale * zoomFactor, 0.05), 5.0);

        // Maus-Position im Bildschirm
        const rect = viewport.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        // Position relativ zur unskalierten 0/0-Koordinate
        const pivotX = (clientX - window.currentPanX) / window.currentScale;
        const pivotY = (clientY - window.currentPanY) / window.currentScale;

        // Neuen Pan berechnen, damit das Element genau unter der Maus bleibt
        window.currentPanX = window.currentPanX - (pivotX * (newScale - window.currentScale));
        window.currentPanY = window.currentPanY - (pivotY * (newScale - window.currentScale));
        window.currentScale = newScale;

        applyCanvasTransform();
    }, { passive: false });

    // 3. PANNEN (Auch außerhalb des Canvas möglich, da wir den Viewport tracken!)
    let isDraggingCanvas = false;
    let startMouseX = 0, startMouseY = 0;

    viewport.addEventListener('mousedown', (e) => {
        // Nur pannen, wenn wir keinen Button, Input oder die Baugruppe selbst greifen
        const isControl = e.target.closest('button, input, select, .assembly-card, .project-zone-header, .zone-resize-handle');

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

    // 4. Standard-Events
    viewport.addEventListener('mousemove', handleLiveSplineMove);
    viewport.addEventListener('contextmenu', handleCanvasContextMenu);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (connectingFirstNodeId) {
                cancelConnectionMode();
                showToast('Verbindungsvorgang abgebrochen', 'info');
            }
            if (selectedNodeIds.size > 0) {
                selectedNodeIds.clear();
                renderCanvas();
            }
        }

        /**
         * Breadcrumb: [2026-08-23] Kopieren (Strg+C) und Einfügen (Strg+V)
         */
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            if (selectedNodeIds.size > 0) {
                window.copiedNodeIds = Array.from(selectedNodeIds);
                showToast(`${window.copiedNodeIds.length} Block(s) kopiert`, 'info');
            }
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            if (window.copiedNodeIds && window.copiedNodeIds.length > 0) {
                if (typeof handlePasteNodes === 'function') handlePasteNodes();
            }
        }
    });

    // Toolbar-Buttons mit nativer Skalierung
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
 * Domain: Kontextmenü Steuerung & Duplizierung (Fix für Sichtbarkeit & Supabase-Sync)
 * ERSETZEN IN: canvas.js
 * Breadcrumbs:
 *   - [2026-08-23 15:10:00 CEST]: Rechtsklick-Duplizierung initial hinzugefügt.
 *   - [2026-08-23 15:15:00 CEST]: Fix für Block-Sichtbarkeit: Explizites Abwarten von 
 *     Supabase-Inserts mit Fehlerbehandlung und sauberem zone_id Re-Calc.
 *   - [Vorherige Logik archiviert]: db.from().insert() ohne Error-Catching und mit 
 *     statischer Zuweisung von originalNode.zone_id führte zu Rendering-Ausblendungen.
 * =============================================================================
 */
window.handleContextMenuAction = async function(type) {
    const menu = document.getElementById('canvasContextMenu');
    if (menu) menu.style.display = 'none';

    if (type === 'block') {
        handleOpenAddBlockModal(contextMenuCoords.x - 160, contextMenuCoords.y - 50);
    } else if (type === 'zone') {
        handleOpenAddZoneModal(contextMenuCoords.x, contextMenuCoords.y);
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
            article_number: originalNode.article_number,
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

window.handleEndpointClick = async function(e, nodeId, pointType) {
    e.stopPropagation();

    const node = currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    const nodeEl = document.getElementById(node.id);
    const w = nodeEl ? nodeEl.offsetWidth : 320;
    const h = nodeEl ? nodeEl.offsetHeight : 200;

    const pointX = node.pos_x + w / 2;
    const pointY = pointType === 'top' ? node.pos_y : node.pos_y + h;

    if (!connectingFirstNodeId) {
        connectingFirstNodeId = nodeId;
        connectingFirstPoint = { x: pointX, y: pointY };
        showToast('Block gewählt. Klicke 2. Block an oder Rechtsklick zum Neuerstellen.', 'info');
        renderCanvas();
    } else {
        if (connectingFirstNodeId === nodeId) {
            showToast('Ein Block kann nicht mit sich selbst verbunden werden.', 'error');
            cancelConnectionMode();
            return;
        }

        const firstNode = currentNodes.find(n => n.id === connectingFirstNodeId);
        const secondNode = node;

        let parentNode, childNode;
        if (firstNode.pos_y <= secondNode.pos_y) {
            parentNode = firstNode;
            childNode = secondNode;
        } else {
            parentNode = secondNode;
            childNode = firstNode;
        }

        cancelConnectionMode();

        const exists = currentEdges.some(edge => edge.source === parentNode.id && edge.target === childNode.id);
        if (!exists) {
            const newEdge = {
                project_id: activeProjectId,
                source: parentNode.id,
                target: childNode.id,
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
        // PERFEKTE ISOLIERUNG: Nur die Maße des ausgewählten Rahmens nehmen
        const specific = currentZones.find(z => z.id === targetZoneId);
        if (specific) {
            updateBounds(parseFloat(specific.pos_x) || 0, parseFloat(specific.pos_y) || 0, parseFloat(specific.width) || 400, parseFloat(specific.height) || 300);
        }
    } else {
        // ALLES SICHTBARE ZENTRIEREN
        const visibleZones = currentZones.filter(z => !window.isZoneHidden(z.id));
        visibleZones.forEach(z => {
            updateBounds(parseFloat(z.pos_x) || 0, parseFloat(z.pos_y) || 0, parseFloat(z.width) || 400, parseFloat(z.height) || 300);
        });

        const visibleNodes = currentNodes.filter(n => !isNodeHiddenByAncestor(n.id) && !(n.zone_id && window.isZoneHidden(n.zone_id)));
        visibleNodes.forEach(n => {
            updateBounds(parseFloat(n.pos_x) || 0, parseFloat(n.pos_y) || 0, 320, 200);
        });
    }

    // Falls alles leer ist, setze sauber auf Standard zurück
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

    const padding = 100; // Echter Abstand in Pixeln zum Bildschirmrand
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

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Canvas Rendering Engine (Bereinigt)
 * ERSETZEN IN: canvas.js
 * Breadcrumbs:
 *   - [2026-08-23 10:00:00 CEST]: Node/Zone-Rendering mit Splines & Rollups.
 *   - [2026-08-23 15:35:00 CEST]: Duplizierte Initialisierungsblöcke bereinigt, 
 *     Personal Filter, Zuweisungs-Badge & Instanz-Kopplung konsolidiert.
 * =============================================================================
 */
function renderCanvas() {
    const canvas = document.getElementById('canvas');
    const svgLayer = document.getElementById('connections-layer');

    const existingCards = canvas.querySelectorAll('.assembly-card, .project-zone');
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

    const zoneRollups = {};
    currentZones.forEach(z => {
        zoneRollups[z.id] = { dBudg: 0, drBudg: 0, dSpent: 0, drSpent: 0 };
    });

    currentNodes.forEach(n => {
        if (n.zone_id && zoneRollups[n.zone_id]) {
            zoneRollups[n.zone_id].dBudg += nodeDirectStats[n.id].dBudg;
            zoneRollups[n.zone_id].drBudg += nodeDirectStats[n.id].drBudg;
            zoneRollups[n.zone_id].dSpent += nodeDirectStats[n.id].dSpent;
            zoneRollups[n.zone_id].drSpent += nodeDirectStats[n.id].drSpent;
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

        zoneEl.innerHTML = `
      <div class="project-zone-header no-pan" style="border-bottom-color: ${zone.color_hex || '#a0aec0'}; align-items: flex-start;">
        <div style="display:flex; flex-direction:column; gap:6px;">
          <span>📍 ${escapeHtml(zone.title)}</span>
          <div style="display:flex; gap:6px; cursor:help;">
              <div class="pie-chart" style="${zdPieStyle}; width: 22px; height: 22px;" title="CAD: ${formatHoursToHM(zStats.dSpent)} / ${formatHoursToHM(zStats.dBudg)}">
                  <div class="pie-inner" style="width: 14px; height: 14px; font-size: 6px;"></div>
              </div>
              <div class="pie-chart" style="${zdrPieStyle}; width: 22px; height: 22px;" title="Zeichnung: ${formatHoursToHM(zStats.drSpent)} / ${formatHoursToHM(zStats.drBudg)}">
                  <div class="pie-inner" style="width: 14px; height: 14px; font-size: 6px;"></div>
              </div>
          </div>
        </div>
        <div class="zone-actions">
          <button type="button" class="zone-btn" title="${zone.is_locked ? 'Position entsperren' : 'Position sperren (Panzoom aktiv)'}" onclick="toggleZoneLock(event, '${zone.id}')">${zone.is_locked ? '🔒' : '🔓'}</button>
          ${isAdmin || (activeUserCode && activeUserCode === zone.created_by) ? `
            <button type="button" class="zone-btn" title="Bereich bearbeiten" onclick="openEditZoneModal('${zone.id}')">✏️</button>
            <button type="button" class="zone-btn" style="color:#e53e3e;" title="Bereich löschen" onclick="handleDeleteZone('${zone.id}')">✕</button>
          ` : ''}
        </div>
      </div>
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

    currentNodes.forEach(node => {
        if (isNodeHiddenByAncestor(node.id) || (node.zone_id && window.isZoneHidden(node.zone_id))) return;

        const stats = rollups[node.id] || { totalDesign: 0, totalDrafting: 0, logs: [] };
        const nodeColor = node.color_hex || '#2b6cb0';
        const creator = node.created_by || 'COT';
        const bType = node.block_type || 'assembly';
        const typeLabel = bType === 'part' ? 'Bauteil' : 'Baugruppe';

        const canDrag = isAdmin || (activeUserCode && activeUserCode === creator);

        const dSpent = stats.totalDesign;
        const dBudg = Math.max(0, parseFloat(node.budget_design_hours) || 0);
        const dPct = dBudg > 0 ? Math.round((dSpent / dBudg) * 100) : 0;
        const dPieStyle = generatePieStyle(dSpent, dBudg, nodeColor);

        const drSpent = stats.totalDrafting;
        const drBudg = Math.max(0, parseFloat(node.budget_drafting_hours) || 0);
        const drPct = drBudg > 0 ? Math.round((drSpent / drBudg) * 100) : 0;
        const drPieStyle = generatePieStyle(drSpent, drBudg, '#38a169');

        const isExpanded = expandedNodes.has(node.id);

        // Logs über alle verknüpften Instanzen hinweg bündeln
        const relatedNodeIds = node.linked_id
            ? currentNodes.filter(n => n.linked_id === node.linked_id).map(n => n.id)
            : [node.id];
        const nodeLogs = currentTimeLogs.filter(l => relatedNodeIds.includes(l.node_id));

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

        /**
         * =============================================================================
         * Projekt: CAD Time Manager
         * Domain: Node Header & Dual-Zuweisung Filter
         * ERSETZEN IN: canvas.js (innerhalb renderCanvas)
         * Breadcrumbs:
         *   - [2026-08-23 15:52:00 CEST]: Zuweisungs-Prüfung auf CAD (assigned_design_user) 
         *     und Zeichnung (assigned_drafting_user) aufgeteilt. Badges für beide Rollen 
         *     werden im Header getrennt farblich dargestellt (Blau für CAD, Grün für Zeichnung).
         *   - [Vorherige Logik archiviert]: Prüfung auf einfache assigned_user-Zuweisung 
         *     wurde abgelöst.
         * =============================================================================
         */
        // Dual-Filter prüfen: Dimmen, wenn Filter aktiv und der eingeloggte User weder CAD noch Zeichnung hat

        /**
         * =============================================================================
         * Projekt: CAD Time Manager
         * Domain: Node Header Badges (Icon-Update)
         * ERSETZEN IN: canvas.js (innerhalb renderCanvas)
         * Breadcrumbs:
         *   - [2026-08-23 16:00:00 CEST]: Badges auf 🆛 (3D-Button) und 📄 (Zeichnungsblatt) 
         *     aktualisiert für eine klare fachliche Trennung.
         *   - [Vorherige Logik archiviert]: Vorherige Icons (🧊 / ✏️) wurden abgelöst.
         * =============================================================================
         */
        // Dual-Filter prüfen: Dimmen, wenn Filter aktiv und der eingeloggte User weder CAD noch Zeichnung hat
        const isUserAssigned = (node.assigned_design_user === activeUserCode) || (node.assigned_drafting_user === activeUserCode);
        const isDimmed = window.personalFilterActive && !isUserAssigned;

        const isConnectingThisNode = connectingFirstNodeId === node.id;
        const isSelected = selectedNodeIds.has(node.id);
        const isLinked = !!node.linked_id;

        const el = document.createElement('div');
        el.id = node.id;
        if (isLinked) el.dataset.linkedId = node.linked_id;

        // Hier wird die "node-dimmed" Klasse dynamisch hinzugefügt
        el.className = `assembly-card no-pan ${canDrag ? 'draggable-enabled' : 'draggable-disabled'} ${isSelected ? 'selected-multi' : ''} ${isDimmed ? 'node-dimmed' : ''}`;
        el.style.left = `${node.pos_x}px`;
        el.style.top = `${node.pos_y}px`;
        el.style.borderColor = nodeColor;
        el.style.zIndex = "10";

        const linkedIconHtml = isLinked ? `<span class="linked-icon" title="Verknüpfte Instanz (Zeiten synchron)">🔗</span>` : '';

        let assignedBadgesHtml = '';
        if (node.assigned_design_user) {
            assignedBadgesHtml += `<span class="author-badge" style="background:#2b6cb0; margin-left:3px; font-weight:normal;" title="3D-Modellierung zugewiesen an: ${escapeHtml(node.assigned_design_user)}"><span style="font-weight:normal;">🆛</span> <strong>${escapeHtml(node.assigned_design_user)}</strong></span>`;
        }
        if (node.assigned_drafting_user) {
            assignedBadgesHtml += `<span class="author-badge" style="background:#38a169; margin-left:3px; font-weight:normal;" title="Zeichnung zugewiesen an: ${escapeHtml(node.assigned_drafting_user)}">📄 <strong>${escapeHtml(node.assigned_drafting_user)}</strong></span>`;
        }

        el.innerHTML = `
      <div id="ep-top-${node.id}" class="ep-handle ep-top ${isConnectingThisNode ? 'active-source' : ''}" title="Knotenpunkt oben" onclick="handleEndpointClick(event, '${node.id}', 'top')"></div>
      
      <div class="assembly-header" style="background: ${nodeColor};">
        <div style="display: flex; align-items: center;">
          ${subtreeBtnHtml}
          <span>${escapeHtml(node.name)}${statusIcon}${linkedIconHtml}</span>
        </div>
        <div class="header-meta">
          <span class="author-badge" title="Typ: ${typeLabel}">${escapeHtml(typeLabel)}</span>
          ${assignedBadgesHtml}
        </div>
      </div>
      <div class="assembly-body">
        <div class="charts-grid">
          <div class="chart-box">
            <div class="pie-chart" style="${dPieStyle}">
              <div class="pie-inner">${dPct}%</div>
            </div>
            <div class="chart-label">CAD</div>
            <div class="chart-sub">${formatHoursToHM(dSpent)} / ${formatHoursToHM(dBudg)}</div>
          </div>
          <div class="chart-box">
            <div class="pie-chart" style="${drPieStyle}">
              <div class="pie-inner">${drPct}%</div>
            </div>
            <div class="chart-label">Zeichnung</div>
            <div class="chart-sub">${formatHoursToHM(drSpent)} / ${formatHoursToHM(drBudg)}</div>
          </div>
        </div>

        <hr class="divider" />
        <form class="log-form" onsubmit="handleLog(event, '${node.id}')">
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

      <div id="ep-bottom-${node.id}" class="ep-handle ep-bottom ${isConnectingThisNode ? 'active-source' : ''}" title="Knotenpunkt unten" onclick="handleEndpointClick(event, '${node.id}', 'bottom')"></div>
    `;

        // Synchrones Hover-Highlighting aller gleichen Instanzen
        el.addEventListener('mouseenter', () => {
            if (node.linked_id) {
                document.querySelectorAll(`.assembly-card[data-linked-id="${node.linked_id}"]`).forEach(card => card.classList.add('linked-highlight'));
            }
        });

        el.addEventListener('mouseleave', () => {
            if (node.linked_id) {
                document.querySelectorAll(`.assembly-card[data-linked-id="${node.linked_id}"]`).forEach(card => card.classList.remove('linked-highlight'));
            }
        });

        el.addEventListener('click', (e) => {
            if (isAdmin && e.shiftKey) {
                e.stopPropagation();
                if (selectedNodeIds.has(node.id)) {
                    selectedNodeIds.delete(node.id);
                } else {
                    selectedNodeIds.add(node.id);
                }
                renderCanvas();
            }
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
                if (e.shiftKey) return;

                window.isDraggingAnything = true;
                isDragging = true;
                startClientX = e.clientX;
                startClientY = e.clientY;
                e.stopPropagation();

                const nodesToMove = (isAdmin && selectedNodeIds.has(node.id))
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

function renderConnections(mouseCoords = null) {
    const svgLayer = document.getElementById('connections-layer');
    svgLayer.innerHTML = '';

    currentEdges.forEach(edge => {
        const srcNode = currentNodes.find(n => n.id === edge.source);
        const tgtNode = currentNodes.find(n => n.id === edge.target);

        const srcHidden = isNodeHiddenByAncestor(edge.source) || (srcNode && srcNode.zone_id && window.isZoneHidden(srcNode.zone_id));
        const tgtHidden = isNodeHiddenByAncestor(edge.target) || (tgtNode && tgtNode.zone_id && window.isZoneHidden(tgtNode.zone_id));

        if (srcHidden || tgtHidden || collapsedParents.has(edge.source)) return;

        if (srcNode && tgtNode) {
            const srcEl = document.getElementById(srcNode.id);
            const tgtEl = document.getElementById(tgtNode.id);

            const srcW = srcEl ? srcEl.offsetWidth : 320;
            const srcH = srcEl ? srcEl.offsetHeight : 200;
            const tgtW = tgtEl ? tgtEl.offsetWidth : 320;

            const x1 = srcNode.pos_x + srcW / 2;
            const y1 = srcNode.pos_y + srcH;
            const x2 = tgtNode.pos_x + tgtW / 2;
            const y2 = tgtNode.pos_y;

            const dy = Math.max(50, Math.abs(y2 - y1) * 0.5);
            const pathD = `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathD);
            path.setAttribute('class', 'connection-line');
            path.setAttribute('title', `Verbindung (Erstellt von: ${edge.created_by || 'COT'}) - Klick zum Trennen`);
            path.addEventListener('click', () => handleDisconnectClick(edge.source, edge.target));

            svgLayer.appendChild(path);
        }
    });

    if (connectingFirstPoint && mouseCoords) {
        const x1 = connectingFirstPoint.x;
        const y1 = connectingFirstPoint.y;
        const x2 = mouseCoords.x;
        const y2 = mouseCoords.y;

        const dy = Math.max(40, Math.abs(y2 - y1) * 0.5);
        const pathD = `M ${x1} ${y1} C ${x1} ${y1 + (y2 >= y1 ? dy : -dy)}, ${x2} ${y2 + (y2 >= y1 ? -dy : dy)}, ${x2} ${y2}`;

        const previewPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        previewPath.setAttribute('d', pathD);
        previewPath.setAttribute('class', 'preview-connection-line');

        svgLayer.appendChild(previewPath);
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

/**
* =============================================================================
* Breadcrumb: [2026-08-23] Globale Maus-Verfolgung & Instanz-Duplizierung (Strg+V)
* =============================================================================
*/
window.lastClientX = 0;
window.lastClientY = 0;
window.addEventListener('mousemove', (e) => {
    window.lastClientX = e.clientX;
    window.lastClientY = e.clientY;
});

window.handlePasteNodes = async function() {
    if (!window.copiedNodeIds || window.copiedNodeIds.length === 0) return;

    const coords = getCanvasCoords(window.lastClientX, window.lastClientY);
    let offsetX = 0;

    for (const originalId of window.copiedNodeIds) {
        const originalNode = currentNodes.find(n => n.id === originalId);
        if (!originalNode) continue;

        // Stelle sicher, dass das Original eine linked_id hat, um sie zu verbinden
        let linkedId = originalNode.linked_id;
        if (!linkedId) {
            linkedId = 'inst_' + crypto.randomUUID();
            originalNode.linked_id = linkedId;
            await db.from('project_nodes').update({ linked_id: linkedId }).eq('id', originalNode.id);
        }

        // Neue Instanz in der DB anlegen
        await db.from('project_nodes').insert([{
            project_id: activeProjectId,
            name: originalNode.name,
            article_number: originalNode.article_number,
            block_type: originalNode.block_type,
            budget_design_hours: originalNode.budget_design_hours,
            budget_drafting_hours: originalNode.budget_drafting_hours,
            color_hex: originalNode.color_hex,
            created_by: activeUserCode || 'COT',
            pos_x: Math.round(coords.x + offsetX),
            pos_y: Math.round(coords.y),
            linked_id: linkedId,
            zone_id: null // Zuerst neutral platzieren
        }]);

        offsetX += 340; // Nächsten kopierten Block leicht versetzt platzieren
    }

    showToast(`${window.copiedNodeIds.length} verknüpfte Instanz(en) eingefügt`, 'success');
    fetchCanvasData();
};