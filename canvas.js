/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Canvas Engine (Anti-Freeze, Zonen-Verschachtelung bis 5 Level)
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
        excludeClass: 'no-pan'
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

// --- HILFSFUNKTIONEN FÜR ZONEN-VERSCHACHTELUNG ---
function getZoneDepth(zoneId) {
    let depth = 0;
    let current = currentZones.find(z => z.id === zoneId);
    while (current && current.parent_zone_id) {
        depth++;
        current = currentZones.find(z => z.id === current.parent_zone_id);
        if (depth > 10) break; // Endlosschleifen-Schutz
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

// Findet den innersten Kasten an einer Koordinate (x, y)
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

// --- RENDERING ---
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
        const zoneEl = document.createElement('div');
        zoneEl.id = zone.id;
        const canMoveZone = isAdmin || (activeUserCode && activeUserCode === zone.created_by);
        const zoneDepth = getZoneDepth(zone.id);

        zoneEl.className = `project-zone no-pan ${canMoveZone ? 'draggable-enabled' : ''}`;
        zoneEl.style.left = `${zone.pos_x}px`;
        zoneEl.style.top = `${zone.pos_y}px`;
        zoneEl.style.width = `${zone.width}px`;
        zoneEl.style.height = `${zone.height}px`;
        zoneEl.style.borderColor = zone.color_hex || '#a0aec0';
        zoneEl.style.zIndex = 2 + zoneDepth;

        const zStats = zoneRollups[zone.id];
        const zdPct = zStats.dBudg > 0 ? Math.round((zStats.dSpent / zStats.dBudg) * 100) : 0;
        const zdrPct = zStats.drBudg > 0 ? Math.round((zStats.drSpent / zStats.drBudg) * 100) : 0;
        const zdPieStyle = generatePieStyle(zStats.dSpent, zStats.dBudg, zone.color_hex || '#a0aec0');
        const zdrPieStyle = generatePieStyle(zStats.drSpent, zStats.drBudg, '#38a169');

        zoneEl.innerHTML = `
      <div class="project-zone-header" style="border-bottom-color: ${zone.color_hex || '#a0aec0'}; align-items: flex-start;">
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
          ${canMoveZone ? `
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
                const scale = panzoomInstance.getScale();
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

            const resizeHandle = zoneEl.querySelector('.zone-resize-handle');
            resizeHandle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                window.isDraggingAnything = true;
                let isResizing = true;
                const scale = panzoomInstance.getScale();
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

    // 2. Blöcke rendern (z-index 10)
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

        // NEU: Fertigmelden UI-Logik (inklusive Admin Revision Button)
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

                    // Spezielles Icon für Revision/Fertigstellung
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

        const isConnectingThisNode = connectingFirstNodeId === node.id;
        const isSelected = selectedNodeIds.has(node.id);

        const el = document.createElement('div');
        el.id = node.id;

        el.className = `assembly-card no-pan ${canDrag ? 'draggable-enabled' : 'draggable-disabled'} ${isSelected ? 'selected-multi' : ''}`;
        el.style.left = `${node.pos_x}px`;
        el.style.top = `${node.pos_y}px`;
        el.style.borderColor = nodeColor;
        el.style.zIndex = "10";

        el.innerHTML = `
      <div id="ep-top-${node.id}" class="ep-handle ep-top ${isConnectingThisNode ? 'active-source' : ''}" title="Knotenpunkt oben" onclick="handleEndpointClick(event, '${node.id}', 'top')"></div>
      
      <div class="assembly-header" style="background: ${nodeColor};">
        <div style="display: flex; align-items: center;">
          ${subtreeBtnHtml}
          <span>${escapeHtml(node.name)}${statusIcon}</span>
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
            let startX = 0, startY = 0;
            let startPositions = new Map();

            el.addEventListener('mousedown', (e) => {
                if (e.target.closest('input, select, button, .ep-handle, .btn-delete-log, .btn-tree-toggle')) return;
                if (e.shiftKey) return;

                window.isDraggingAnything = true;
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

                    const primaryNode = nodesToMove[0];
                    const centerX = primaryNode.pos_x + 160;
                    const centerY = primaryNode.pos_y + 100;

                    const targetZone = getDeepestZoneAt(centerX, centerY);

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

                    const primaryNode = nodesToMove[0];
                    const centerX = primaryNode.pos_x + 160;
                    const centerY = primaryNode.pos_y + 100;

                    const targetZone = getDeepestZoneAt(centerX, centerY);
                    const targetZoneId = targetZone ? targetZone.id : null;

                    currentZones.forEach(z => {
                        const zEl = document.getElementById(z.id);
                        if (zEl) zEl.classList.remove('zone-hover-highlight');
                    });

                    const updates = nodesToMove.map(n => {
                        n.zone_id = targetZoneId;
                        return db.from('project_nodes').update({ pos_x: n.pos_x, pos_y: n.pos_y, zone_id: targetZoneId }).eq('id', n.id);
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