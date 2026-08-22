/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Canvas Engine, Panzoom, Native SVG Splines, Zonen & Rendering
 * Zeitstempel: 2026-08-22 16:00:00 CEST
 * =============================================================================
 */

let panzoomInstance = null;
let connectingFirstNodeId = null;
let connectingFirstPoint = null;

function initPanzoom() {
    const canvasEl = document.getElementById('canvas');
    panzoomInstance = Panzoom(canvasEl, {
        maxScale: 2.0,
        minScale: 0.3,
        contain: 'outside',
        canvas: true,
        excludeClass: 'assembly-card, project-zone, zone-resize-handle'
    });

    const viewport = document.getElementById('viewport');
    viewport.addEventListener('wheel', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        panzoomInstance.zoomWithWheel(e);
    });

    viewport.addEventListener('mousemove', handleLiveSplineMove);
    viewport.addEventListener('contextmenu', handleCanvasContextMenu);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && connectingFirstNodeId) {
            cancelConnectionMode();
            showToast('Verbindungsvorgang abgebrochen', 'info');
        }
    });

    document.getElementById('btnZoomIn').addEventListener('click', () => panzoomInstance.zoomIn());
    document.getElementById('btnZoomOut').addEventListener('click', () => panzoomInstance.zoomOut());
    document.getElementById('btnZoomReset').addEventListener('click', () => panzoomInstance.reset());
}

function getCanvasCoords(clientX, clientY) {
    const canvas = document.getElementById('canvas');
    const rect = canvas.getBoundingClientRect();
    const scale = panzoomInstance.getScale();
    return {
        x: (clientX - rect.left) / scale,
        y: (clientY - rect.top) / scale
    };
}

function handleLiveSplineMove(e) {
    if (!connectingFirstNodeId || !connectingFirstPoint) return;
    const mouseCoords = getCanvasCoords(e.clientX, e.clientY);
    renderConnections(mouseCoords);
}

function cancelConnectionMode() {
    connectingFirstNodeId = null;
    connectingFirstPoint = null;
    renderCanvas();
}

function handleCanvasContextMenu(e) {
    if (connectingFirstNodeId) {
        e.preventDefault();
        const coords = getCanvasCoords(e.clientX, e.clientY);
        handleOpenAddBlockModal(coords.x - 160, coords.y - 50, connectingFirstNodeId);
    }
}

// Verbindungs-Logik
window.handleEndpointClick = async function (e, nodeId, pointType) {
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

// Subtree-Logik
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
    if (expandedNodes.has(nodeId)) {
        expandedNodes.delete(nodeId);
    } else {
        expandedNodes.add(nodeId);
    }
    renderCanvas();
};

// Canvas & Zonen & Blöcke rendern
function renderCanvas() {
    const canvas = document.getElementById('canvas');
    const svgLayer = document.getElementById('connections-layer');

    const existingCards = canvas.querySelectorAll('.assembly-card, .project-zone');
    existingCards.forEach(c => c.remove());
    svgLayer.innerHTML = '';

    const rollups = calculateRollups();

    // 1. Zonen / Kästen rendern (z-index 2)
    currentZones.forEach(zone => {
        const zoneEl = document.createElement('div');
        zoneEl.id = zone.id;
        zoneEl.className = `project-zone ${isAdmin || (activeUserCode && activeUserCode === zone.created_by) ? 'draggable-enabled' : ''}`;
        zoneEl.style.left = `${zone.pos_x}px`;
        zoneEl.style.top = `${zone.pos_y}px`;
        zoneEl.style.width = `${zone.width}px`;
        zoneEl.style.height = `${zone.height}px`;
        zoneEl.style.borderColor = zone.color_hex || '#a0aec0';

        zoneEl.innerHTML = `
      <div class="project-zone-header" style="border-bottom-color: ${zone.color_hex || '#a0aec0'};">
        <span>📍 ${escapeHtml(zone.title)}</span>
        <div class="zone-actions">
          ${isAdmin || (activeUserCode && activeUserCode === zone.created_by) ? `
            <button type="button" class="zone-btn" title="Bereich umbenennen" onclick="handleRenameZone('${zone.id}')">✏️</button>
            <button type="button" class="zone-btn" style="color:#e53e3e;" title="Bereich löschen" onclick="handleDeleteZone('${zone.id}')">✕</button>
          ` : ''}
        </div>
      </div>
      <div class="zone-resize-handle" title="Größe anpassen"></div>
    `;

        const canMoveZone = isAdmin || (activeUserCode && activeUserCode === zone.created_by);
        if (canMoveZone) {
            let isDragging = false;
            let startX = 0, startY = 0;
            let initLeft = 0, initTop = 0;

            zoneEl.addEventListener('mousedown', (e) => {
                if (e.target.closest('.zone-actions, .zone-resize-handle')) return;
                isDragging = true;
                const scale = panzoomInstance.getScale();
                startX = e.clientX;
                startY = e.clientY;
                initLeft = parseFloat(zoneEl.style.left) || 0;
                initTop = parseFloat(zoneEl.style.top) || 0;
                e.stopPropagation();

                const onMouseMove = (moveEvent) => {
                    if (!isDragging) return;
                    const dx = (moveEvent.clientX - startX) / scale;
                    const dy = (moveEvent.clientY - startY) / scale;
                    const newX = Math.max(10, Math.round(initLeft + dx));
                    const newY = Math.max(10, Math.round(initTop + dy));
                    zoneEl.style.left = `${newX}px`;
                    zoneEl.style.top = `${newY}px`;
                    zone.pos_x = newX;
                    zone.pos_y = newY;
                };

                const onMouseUp = async () => {
                    if (!isDragging) return;
                    isDragging = false;
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                    await db.from('project_zones').update({ pos_x: zone.pos_x, pos_y: zone.pos_y }).eq('id', zone.id);
                };

                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            });

            const resizeHandle = zoneEl.querySelector('.zone-resize-handle');
            resizeHandle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                let isResizing = true;
                const scale = panzoomInstance.getScale();
                const startW = parseFloat(zoneEl.style.width) || 400;
                const startH = parseFloat(zoneEl.style.height) || 300;
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
                };

                window.addEventListener('mousemove', onResizeMove);
                window.addEventListener('mouseup', onResizeUp);
            });
        }

        canvas.appendChild(zoneEl);
    });

    // 2. Baugruppen- & Bauteil-Blöcke rendern (z-index 10)
    currentNodes.forEach(node => {
        if (isNodeHiddenByAncestor(node.id)) return;

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
        const nodeLogs = currentTimeLogs.filter(l => l.node_id === node.id);

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
                    const kat = log.task_type === 'design' ? 'CAD' : 'Zeichn.';
                    const badge = log.status === 'approved'
                        ? '<span class="badge-approved">OK</span>'
                        : '<span class="badge-pending">Wartend</span>';

                    const timeFormatted = formatHoursToHM(log.hours);

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

        const isConnectingThisNode = connectingFirstNodeId === node.id;
        const isSelected = selectedNodeIds.has(node.id);

        const el = document.createElement('div');
        el.id = node.id;
        el.className = `assembly-card ${canDrag ? 'draggable-enabled' : 'draggable-disabled'} ${isSelected ? 'selected-multi' : ''}`;
        el.style.left = `${node.pos_x}px`;
        el.style.top = `${node.pos_y}px`;
        el.style.borderColor = nodeColor;

        el.innerHTML = `
      <div id="ep-top-${node.id}" class="ep-handle ep-top ${isConnectingThisNode ? 'active-source' : ''}" title="Knotenpunkt oben" onclick="handleEndpointClick(event, '${node.id}', 'top')"></div>
      
      <div class="assembly-header" style="background: ${nodeColor};">
        <div style="display: flex; align-items: center;">
          ${subtreeBtnHtml}
          <span>${escapeHtml(node.name)}</span>
        </div>
        <div class="header-meta">
          <span class="author-badge" title="Typ: ${typeLabel} | Ersteller: ${escapeHtml(creator)}">${escapeHtml(typeLabel)} [${escapeHtml(creator)}]</span>
          <span class="assembly-article">${escapeHtml(node.article_number || '')}</span>
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
        
        <button class="btn-expand-toggle" onclick="toggleInlineLogs('${node.id}')">
          ${isExpanded ? '▲ Logs ausblenden' : '▼ Details & Logs anzeigen (' + nodeLogs.length + ')'}
        </button>

        ${inlineLogsHtml}
      </div>

      <div id="ep-bottom-${node.id}" class="ep-handle ep-bottom ${isConnectingThisNode ? 'active-source' : ''}" title="Knotenpunkt unten" onclick="handleEndpointClick(event, '${node.id}', 'bottom')"></div>
    `;

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
            if (!e.target.closest('.ep-handle') && !e.target.closest('.btn-delete-log') && !e.target.closest('.btn-tree-toggle')) {
                openConfigModal(node.id);
            }
        });

        if (canDrag) {
            let isDragging = false;
            let startX = 0, startY = 0;
            let startPositions = new Map();

            el.addEventListener('mousedown', (e) => {
                if (e.target.closest('input, select, button, .ep-handle, .btn-delete-log, .btn-tree-toggle')) return;
                if (e.shiftKey) return;

                isDragging = true;
                const scale = panzoomInstance.getScale();
                startX = e.clientX;
                startY = e.clientY;
                e.stopPropagation();

                const nodesToMove = (isAdmin && selectedNodeIds.has(node.id))
                    ? Array.from(selectedNodeIds).map(id => currentNodes.find(n => n.id === id)).filter(Boolean)
                    : [node];

                startPositions.clear();
                nodesToMove.forEach(n => {
                    startPositions.set(n.id, { x: n.pos_x, y: n.pos_y });
                });

                const onMouseMove = (moveEvent) => {
                    if (!isDragging) return;
                    const dx = (moveEvent.clientX - startX) / scale;
                    const dy = (moveEvent.clientY - startY) / scale;

                    nodesToMove.forEach(n => {
                        const startPos = startPositions.get(n.id);
                        const newX = Math.max(10, Math.round(startPos.x + dx));
                        const newY = Math.max(10, Math.round(startPos.y + dy));
                        n.pos_x = newX;
                        n.pos_y = newY;
                        const nodeEl = document.getElementById(n.id);
                        if (nodeEl) {
                            nodeEl.style.left = `${newX}px`;
                            nodeEl.style.top = `${newY}px`;
                        }
                    });

                    renderConnections();
                };

                const onMouseUp = async () => {
                    if (!isDragging) return;
                    isDragging = false;
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);

                    for (const n of nodesToMove) {
                        await db.from('project_nodes').update({ pos_x: n.pos_x, pos_y: n.pos_y }).eq('id', n.id);
                    }
                };

                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            });
        }

        canvas.appendChild(el);
    });

    renderConnections();
}

function renderConnections(mouseCoords = null) {
    const svgLayer = document.getElementById('connections-layer');
    svgLayer.innerHTML = '';

    currentEdges.forEach(edge => {
        if (isNodeHiddenByAncestor(edge.source) || isNodeHiddenByAncestor(edge.target)) return;
        if (collapsedParents.has(edge.source)) return;

        const srcNode = currentNodes.find(n => n.id === edge.source);
        const tgtNode = currentNodes.find(n => n.id === edge.target);

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