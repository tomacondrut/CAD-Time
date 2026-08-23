/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Modals, Dialoge, Admin-Center, Retro-Logs, Revision)
 * =============================================================================
 */

// =============================================================================
// 1. HELPER & DIALOGE
// =============================================================================
window.showToast = function (msg, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = '';
    if (type === 'error') toast.classList.add('toast-error');
    if (type === 'success') toast.classList.add('toast-success');
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
};

window.customPrompt = function (title, message, defaultValue = '', isPassword = false) {
    return new Promise((resolve) => {
        dialogResolve = resolve;
        document.getElementById('dialogTitle').textContent = title;
        document.getElementById('dialogMessage').textContent = message;

        const inputCont = document.getElementById('dialogInputContainer');
        const input = document.getElementById('dialogInput');
        inputCont.style.display = 'block';
        input.type = isPassword ? 'password' : 'text';
        input.value = defaultValue;

        document.getElementById('dialogBtnConfirm').textContent = 'Anmelden';
        document.getElementById('dialogBtnCancel').textContent = 'Abbrechen';

        openModal('dialogModal');
        input.focus();
    });
};

window.customConfirm = function (title, message, confirmText = 'Bestätigen', cancelText = 'Abbrechen') {
    return new Promise((resolve) => {
        dialogResolve = resolve;
        document.getElementById('dialogTitle').textContent = title;
        document.getElementById('dialogMessage').textContent = message;
        document.getElementById('dialogInputContainer').style.display = 'none';

        document.getElementById('dialogBtnConfirm').textContent = confirmText;
        document.getElementById('dialogBtnCancel').textContent = cancelText;

        openModal('dialogModal');
    });
};

window.closeDialog = function (isConfirmed) {
    closeModal('dialogModal');
    if (dialogResolve) {
        const input = document.getElementById('dialogInput');
        if (document.getElementById('dialogInputContainer').style.display !== 'none') {
            dialogResolve(isConfirmed ? input.value : null);
        } else {
            dialogResolve(isConfirmed);
        }
        dialogResolve = null;
    }
};

window.escapeHtml = function (str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
};

window.formatHoursToHM = function (decimalHours) {
    const totalMinutes = Math.round((Math.max(0, decimalHours) || 0) * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m`;
};

window.generatePieStyle = function (spent, budget, baseColor) {
    const b = Math.max(0.1, parseFloat(budget) || 1);
    const pct = Math.min((spent / b) * 100, 100);
    const isOver = spent > b;
    const fillCol = isOver ? '#e53e3e' : baseColor;
    return `background: conic-gradient(${fillCol} 0% ${pct}%, #e2e8f0 ${pct}% 100%);`;
};

// =============================================================================
// 2. DROPDOWNS, LOGIN & PROJEKTWECHSEL
// =============================================================================
window.renderUserDropdowns = function() {
    const selectLogin = document.getElementById('userSelectDropdown');
    const selectRetro = document.getElementById('retroLogUserCode');

    if (selectLogin) {
        selectLogin.innerHTML = '';
        if (currentUsers.length === 0) {
            selectLogin.innerHTML = '<option value="">Keine Benutzer</option>';
        } else {
            currentUsers.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.code;
                opt.textContent = u.code;
                if (activeUserCode && u.code === activeUserCode) opt.selected = true;
                selectLogin.appendChild(opt);
            });
        }
    }

    if (selectRetro) {
        selectRetro.innerHTML = '';
        currentUsers.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.code;
            opt.textContent = u.code;
            selectRetro.appendChild(opt);
        });
    }
};

window.renderProjectDropdowns = function() {
    const selectLogin = document.getElementById('projectSelectLoginDropdown');
    const selectSidebar = document.getElementById('sidebarProjectSelect');

    const activeProjects = currentProjects.filter(p => !p.is_archived);

    if (selectLogin) {
        selectLogin.innerHTML = '';
        if (activeProjects.length === 0) {
            selectLogin.innerHTML = '<option value="">Keine aktiven Projekte</option>';
        } else {
            activeProjects.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = `${p.object_number} - ${p.name}`;
                if (p.id === activeProjectId) opt.selected = true;
                selectLogin.appendChild(opt);
            });
        }
    }

    if (selectSidebar) {
        selectSidebar.innerHTML = '';
        if (activeProjects.length === 0) {
            selectSidebar.innerHTML = '<option value="">Keine aktiven Projekte</option>';
        } else {
            activeProjects.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = `${p.object_number} - ${p.name}`;
                if (p.id === activeProjectId) opt.selected = true;
                selectSidebar.appendChild(opt);
            });
        }
    }
};

window.confirmUserLogin = function () {
    const selectUser = document.getElementById('userSelectDropdown');
    const selectProj = document.getElementById('projectSelectLoginDropdown');
    if (!selectUser.value || !selectProj.value) return;

    activeUserCode = selectUser.value;
    activeProjectId = selectProj.value;

    document.getElementById('sidebarUserCode').textContent = activeUserCode;
    document.getElementById('sidebarProjectSelect').value = activeProjectId;
    closeModal('userLoginOverlay');

    showToast(`Angemeldet als ${activeUserCode}`, 'success');
    fetchCanvasData();
};

window.handleSidebarProjectChange = function (newProjectId) {
    activeProjectId = newProjectId;
    fetchCanvasData();
    showToast(`Projekt gewechselt: ${getCurrentProject().object_number}`, 'info');
};

// =============================================================================
// 3. ARCHIV & FARBWÄHLER
// =============================================================================
window.openArchiveModal = function () {
    renderArchivedProjectsList();
    openModal('archiveModal');
};

window.archiveProject = async function (projectId, shouldArchive) {
    const p = currentProjects.find(item => item.id === projectId);
    if (!p) return;

    const actionText = shouldArchive ? 'archivieren' : 'wiederherstellen';
    const confirmed = await customConfirm('Projekt-Status ändern', `Möchtest du das Projekt ${p.object_number} wirklich ${actionText}?`);
    if (confirmed) {
        await db.from('projects').update({ is_archived: shouldArchive }).eq('id', projectId);
        await db.from('budget_audit_logs').insert([{
            project_id: projectId,
            changed_by: activeUserCode || 'COT',
            field_name: 'Status',
            old_value: shouldArchive ? 'Aktiv' : 'Archiviert',
            new_value: shouldArchive ? 'Archiviert' : 'Aktiv'
        }]);

        showToast(`Projekt ${p.object_number} ${shouldArchive ? 'archiviert' : 'wiederhergestellt'}`, 'success');
        fetchProjects();
        fetchCanvasData();
    }
};

window.renderArchivedProjectsList = function () {
    const container = document.getElementById('archivedProjectsListContainer');
    if (!container) return;
    container.innerHTML = '';

    const archived = currentProjects.filter(p => p.is_archived);
    if (archived.length === 0) {
        container.innerHTML = '<div style="font-size:12px; color:#718096; padding:8px 0; text-align:center;">Keine archivierten Projekte vorhanden.</div>';
        return;
    }

    archived.forEach(p => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; font-size:12px; padding:6px; border-bottom:1px solid #edf2f7;';
        row.innerHTML = `
            <span><strong>${escapeHtml(p.object_number)}</strong> – ${escapeHtml(p.name)}</span>
            <button class="btn-prim" style="padding:3px 8px; font-size:11px;" onclick="archiveProject('${p.id}', false)">↩ Wiederherstellen</button>
        `;
        container.appendChild(row);
    });
};

window.renderColorPresets = function () {
    const container = document.getElementById('colorPresetsContainer');
    if (!container) return;
    container.innerHTML = '';
    COLOR_PRESETS.forEach(p => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = p.hex;
        swatch.title = p.name;
        swatch.dataset.hex = p.hex;
        swatch.addEventListener('click', () => {
            document.querySelectorAll('#colorPresetsContainer .color-swatch').forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
            document.getElementById('editColor').value = p.hex;
        });
        container.appendChild(swatch);
    });
};

window.renderZoneColorPresets = function () {
    const container = document.getElementById('zoneColorPresetsContainer');
    if (!container) return;
    container.innerHTML = '';
    COLOR_PRESETS.forEach(p => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = p.hex;
        swatch.title = p.name;
        swatch.dataset.hex = p.hex;
        swatch.addEventListener('click', () => {
            document.querySelectorAll('#zoneColorPresetsContainer .color-swatch').forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
            document.getElementById('newZoneColor').value = p.hex;
        });
        container.appendChild(swatch);
    });
};

window.selectColorSwatch = function (hex) {
    const swatches = document.querySelectorAll('#colorPresetsContainer .color-swatch');
    swatches.forEach(s => {
        if (s.dataset.hex.toLowerCase() === (hex || '#2b6cb0').toLowerCase()) {
            s.classList.add('selected');
        } else {
            s.classList.remove('selected');
        }
    });
    document.getElementById('editColor').value = hex || '#2b6cb0';
};

// =============================================================================
// 4. SIDEBAR, MAUSRAD-ZEIT & ZONEN-ANSICHT
// =============================================================================
window.handleTimeWheel = function(e, type) {
    e.preventDefault();
    e.stopPropagation();

    const container = e.target.closest('.time-inputs-row');
    if (!container) return;

    const hourInput = container.querySelector('.input-hours');
    const minInput = container.querySelector('.input-mins');
    if (!hourInput || !minInput) return;

    let currentHours = parseInt(hourInput.value, 10) || 0;
    let currentMins = parseInt(minInput.value, 10) || 0;
    let totalMinutes = (currentHours * 60) + currentMins;

    const stepMinutes = (type === 'hour') ? 60 : 5;
    const delta = (e.deltaY < 0 ? 1 : -1) * stepMinutes;

    totalMinutes = Math.max(0, totalMinutes + delta);

    hourInput.value = Math.floor(totalMinutes / 60);
    minInput.value = (totalMinutes % 60).toString().padStart(2, '0');
};

window.updateSidebarStats = function() {
    const proj = getCurrentProject();
    let totalD = 0;
    let totalDr = 0;
    let pendingCount = 0;

    currentTimeLogs.forEach(l => {
        const hrs = Math.max(0, parseFloat(l.hours) || 0);
        if (l.task_type === 'design') totalD += hrs;
        if (l.task_type === 'drafting') totalDr += hrs;
        if (l.status === 'pending') pendingCount++;
    });

    document.getElementById('sbPendingLogs').textContent = pendingCount + ' Einträge';

    const budD = parseFloat(proj.total_budget_design) || 1;
    const budDr = parseFloat(proj.total_budget_drafting) || 1;

    const pctD = Math.round((totalD / budD) * 100);
    const pctDr = Math.round((totalDr / budDr) * 100);

    const pieDesignEl = document.getElementById('sbPieDesign');
    const pieDraftingEl = document.getElementById('sbPieDrafting');

    const fillD = totalD > budD ? '#e53e3e' : '#3182ce';
    const fillDr = totalDr > budDr ? '#e53e3e' : '#38a169';

    pieDesignEl.style.background = `conic-gradient(${fillD} 0% ${Math.min(pctD, 100)}%, #4a5568 ${Math.min(pctD, 100)}% 100%)`;
    pieDraftingEl.style.background = `conic-gradient(${fillDr} 0% ${Math.min(pctDr, 100)}%, #4a5568 ${Math.min(pctDr, 100)}% 100%)`;

    document.getElementById('sbPctDesign').textContent = `${pctD}%`;
    document.getElementById('sbPctDrafting').textContent = `${pctDr}%`;

    document.getElementById('sbValDesign').textContent = `${formatHoursToHM(totalD)} / ${formatHoursToHM(budD)}`;
    document.getElementById('sbValDrafting').textContent = `${formatHoursToHM(totalDr)} / ${formatHoursToHM(budD)}`;

    document.getElementById('btnAdminProjects').style.display = isAdmin ? 'inline' : 'none';

    // NEU: Rahmenliste in der Sidebar aktualisieren
    if (window.renderSidebarZones) window.renderSidebarZones();
};

/**
 * =============================================================================
 * Funktion: window.renderSidebarZones
 * ERSETZEN IN: app.js (oder ui.js, wo auch immer sie zuletzt stand)
 * Update: Sortierung nach Fläche (Breite x Höhe) absteigend.
 * =============================================================================
 */
window.renderSidebarZones = function() {
    const container = document.getElementById('sidebarZonesContainer');
    if (!container) return;

    container.innerHTML = '';

    // Top-Level Zonen nach Größe (Fläche: Breite * Höhe) ABSTEIGEND sortieren
    const topZones = currentZones.filter(z => !z.parent_zone_id)
        .sort((a, b) => {
            const areaA = (parseFloat(a.width) || 0) * (parseFloat(a.height) || 0);
            const areaB = (parseFloat(b.width) || 0) * (parseFloat(b.height) || 0);
            return areaB - areaA;
        });

    if (topZones.length === 0) {
        container.innerHTML = '<div style="font-size: 11px; color: #718096; padding-left: 10px;">Keine Bereiche definiert.</div>';
        return;
    }

    topZones.forEach(zone => {
        const isHidden = window.hiddenTopZoneIds && window.hiddenTopZoneIds.has(zone.id);
        const el = document.createElement('div');

        el.style.display = 'flex';
        el.style.justifyContent = 'space-between';
        el.style.alignItems = 'center';
        el.style.padding = '6px 10px';
        el.style.background = '#2d3748';
        el.style.borderRadius = '4px';
        el.style.fontSize = '12px';
        el.style.color = isHidden ? '#718096' : '#e2e8f0';

        el.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="color:${zone.color_hex || '#a0aec0'}; font-size:14px;">■</span>
                <span style="cursor:pointer; ${isHidden ? 'text-decoration:line-through;' : ''}" onclick="centerViewOnVisible('${zone.id}')">${escapeHtml(zone.title)}</span>
            </div>
            <div style="display:flex; gap:6px;">
                <button title="Sichtbarkeit umschalten" onclick="toggleZoneVisibility('${zone.id}')" style="background:none; border:none; cursor:pointer; opacity: ${isHidden ? '0.5' : '1'};">👁️</button>
                <button title="Nur diesen Bereich isolieren" onclick="toggleIsolateZone('${zone.id}')" style="background:none; border:none; cursor:pointer;">🎯</button>
            </div>
        `;
        container.appendChild(el);
    });
};

window.isolateZone = function(zoneId) {
    if (!window.hiddenTopZoneIds) window.hiddenTopZoneIds = new Set();
    window.hiddenTopZoneIds.clear();
    currentZones.filter(z => !z.parent_zone_id && z.id !== zoneId).forEach(z => window.hiddenTopZoneIds.add(z.id));

    if (window.renderCanvas) window.renderCanvas();
    if (window.renderSidebarZones) window.renderSidebarZones();

    requestAnimationFrame(() => {
        if (window.centerViewOnVisible) window.centerViewOnVisible(zoneId);
    });
};

window.toggleZoneVisibility = function(zoneId) {
    if (!window.hiddenTopZoneIds) window.hiddenTopZoneIds = new Set();
    if (window.hiddenTopZoneIds.has(zoneId)) {
        window.hiddenTopZoneIds.delete(zoneId);
    } else {
        window.hiddenTopZoneIds.add(zoneId);
    }

    if (window.renderCanvas) window.renderCanvas();
    if (window.renderSidebarZones) window.renderSidebarZones();

    requestAnimationFrame(() => {
        if (window.centerViewOnVisible) window.centerViewOnVisible();
    });
};

// =============================================================================
// 5. BLÖCKE & ZONEN (ERSTELLEN & BEARBEITEN)
// =============================================================================
window.handleOpenAddBlockModal = function(customX = null, customY = null, parentConnectId = null) {
    const budgetRow = document.getElementById('newBlockBudgetRow');
    budgetRow.style.display = isAdmin ? 'flex' : 'none';

    if (customX !== null && customY !== null) {
        document.getElementById('newBlockCustomPos').value = JSON.stringify({ x: customX, y: customY, parentConnectId });
    } else {
        document.getElementById('newBlockCustomPos').value = '';
    }
    openModal('newBlockModal');
};

window.handleAddBlock = async function(e) {
    e.preventDefault();
    const name = document.getElementById('newBlockName').value.trim();
    const article = document.getElementById('newBlockArticle').value.trim();
    const blockType = document.querySelector('input[name="blockType"]:checked').value;
    const customPosVal = document.getElementById('newBlockCustomPos').value;

    let designBudget = 0;
    let draftingBudget = 0;

    if (isAdmin) {
        designBudget = Math.max(0, parseFloat(document.getElementById('newBlockBudgetDesign').value) || 0);
        draftingBudget = Math.max(0, parseFloat(document.getElementById('newBlockBudgetDrafting').value) || 0);
    }

    if (article && !/^\d{5}$/.test(article)) {
        showToast('Artikelnummer muss genau 5 Ziffern lang sein.', 'error');
        return;
    }

    let posX = Math.round(Math.random() * 250 + 150);
    let posY = Math.round(Math.random() * 200 + 150);
    let parentConnectId = null;

    if (customPosVal) {
        const posObj = JSON.parse(customPosVal);
        posX = Math.round(posObj.x);
        posY = Math.round(posObj.y);
        parentConnectId = posObj.parentConnectId;
    }

    const { data: insertedNode } = await db.from('project_nodes').insert([{
        project_id: activeProjectId,
        name,
        article_number: article,
        block_type: blockType,
        budget_design_hours: designBudget,
        budget_drafting_hours: draftingBudget,
        color_hex: '#2b6cb0',
        created_by: activeUserCode || 'COT',
        pos_x: posX,
        pos_y: posY
    }]).select().single();

    if (parentConnectId && insertedNode) {
        const parentNode = currentNodes.find(n => n.id === parentConnectId);
        let pId = parentNode.id;
        let cId = insertedNode.id;
        if (parentNode.pos_y > insertedNode.pos_y) {
            pId = insertedNode.id;
            cId = parentNode.id;
        }
        await db.from('project_edges').insert([{
            project_id: activeProjectId,
            source: pId,
            target: cId,
            created_by: activeUserCode || 'COT'
        }]);
        cancelConnectionMode();
    }

    closeModal('newBlockModal');
    document.getElementById('newBlockForm').reset();
    showToast('Block erfolgreich hinzugefügt', 'success');
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Config Modal (Getrennte Zuweisung CAD & Zeichnung)
 * ERSETZEN IN: ui.js
 * Breadcrumb: [2026-08-23 15:50:00 CEST] Getrennte Speicherung für 
 *   assigned_design_user und assigned_drafting_user implementiert.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Berechtigung: Ersteller & Admin können zuweisen)
 * ERSETZEN IN: ui.js
 * Breadcrumbs:
 *   - [2026-08-23 15:53:00 CEST]: Zuweisungs-Dropdowns für Admin UND Ersteller freigeschaltet.
 *     Fremde Benutzer können die Zuweisungen nicht ändern oder einsehen.
 * =============================================================================
 */
window.openConfigModal = function(nodeId) {
    const node = currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    const nodeLogs = currentTimeLogs.filter(l => l.node_id === nodeId);
    const creator = node.created_by || 'COT';
    const isCreatorOrAdmin = isAdmin || (activeUserCode && activeUserCode === creator);
    const canDelete = isAdmin || ((activeUserCode && activeUserCode === creator) && nodeLogs.length === 0);

    document.getElementById('editNodeId').value = node.id;
    document.getElementById('editName').value = node.name;
    document.getElementById('editArticleNumber').value = node.article_number || '';
    selectColorSwatch(node.color_hex);

    const bType = node.block_type || 'assembly';
    const radio = document.querySelector(`input[name="editBlockType"][value="${bType}"]`);
    if (radio) radio.checked = true;

    document.querySelectorAll('input[name="editBlockType"]').forEach(r => {
        r.disabled = !isCreatorOrAdmin;
    });

    const bDesign = document.getElementById('editBudgetDesign');
    const bDraft = document.getElementById('editBudgetDrafting');
    const assignGroup = document.getElementById('editAssignedUserGroup');
    const selDesign = document.getElementById('editAssignedDesignUser');
    const selDraft = document.getElementById('editAssignedDraftingUser');

    bDesign.value = node.budget_design_hours;
    bDraft.value = node.budget_drafting_hours;
    bDesign.disabled = !isAdmin;
    bDraft.disabled = !isAdmin;

    // Ersteller & Admin dürfen die Zuweisung festlegen / anpassen
    if (isCreatorOrAdmin) {
        if (assignGroup) assignGroup.style.display = 'flex';

        const populateSelect = (selectEl, currentVal) => {
            if (!selectEl) return;
            selectEl.innerHTML = '<option value="">-- Offen --</option>';
            currentUsers.forEach(u => selectEl.add(new Option(u.code, u.code)));
            selectEl.value = currentVal || '';
        };

        populateSelect(selDesign, node.assigned_design_user);
        populateSelect(selDraft, node.assigned_drafting_user);
    } else {
        if (assignGroup) assignGroup.style.display = 'none';
    }

    const btnDel = document.getElementById('btnDeleteBlock');
    const retroBtn = document.getElementById('retroLogAdminBtnContainer');
    const statusGroup = document.getElementById('editStatusGroup');

    btnDel.style.display = canDelete ? 'block' : 'none';
    retroBtn.style.display = isAdmin ? 'block' : 'none';

    if (isAdmin) {
        if (statusGroup) statusGroup.style.display = 'block';
        const statusSelect = document.getElementById('editCompletionStatus');
        if (statusSelect) statusSelect.value = node.completion_status || 'open';
    } else {
        if (statusGroup) statusGroup.style.display = 'none';
    }

    openModal('configModal');
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Config Speicherung)
 * ERSETZEN IN: ui.js (Funktion handleSaveConfig)
 * Breadcrumb: [2026-08-23 15:45:00 CEST] Syntaxfehler und redundante Statusabfrage behoben.
 * =============================================================================
 */
window.handleSaveConfig = async function(e) {
    e.preventDefault();
    const id = document.getElementById('editNodeId').value;
    const node = currentNodes.find(n => n.id === id);
    if (!node) return;

    const creator = node.created_by || 'COT';
    const isCreatorOrAdmin = isAdmin || (activeUserCode && activeUserCode === creator);

    const name = document.getElementById('editName').value;
    const article_number = document.getElementById('editArticleNumber').value;
    const color_hex = document.getElementById('editColor').value;
    const block_type = document.querySelector('input[name="editBlockType"]:checked').value;

    const updateData = { name, article_number, color_hex, block_type };

    // Zuweisungen speichern, wenn Admin oder Ersteller
    if (isCreatorOrAdmin) {
        const selDesign = document.getElementById('editAssignedDesignUser');
        const selDraft = document.getElementById('editAssignedDraftingUser');

        if (selDesign) updateData.assigned_design_user = selDesign.value || null;
        if (selDraft) updateData.assigned_drafting_user = selDraft.value || null;
    }

    // Budgets & Fertigstellung bleiben exklusiv beim Admin
    if (isAdmin) {
        updateData.budget_design_hours = Math.max(0, parseFloat(document.getElementById('editBudgetDesign').value) || 0);
        updateData.budget_drafting_hours = Math.max(0, parseFloat(document.getElementById('editBudgetDrafting').value) || 0);

        const statusSelect = document.getElementById('editCompletionStatus');
        if (statusSelect) {
            updateData.completion_status = statusSelect.value;
        }
    }

    await db.from('project_nodes').update(updateData).eq('id', id);
    closeModal('configModal');
    showToast('Block aktualisiert', 'success');
};

window.handleDeleteNode = async function() {
    const id = document.getElementById('editNodeId').value;
    const node = currentNodes.find(n => n.id === id);
    if (!node) return;

    const nodeLogs = currentTimeLogs.filter(l => l.node_id === id);
    const isCreator = (activeUserCode && activeUserCode === node.created_by);
    const canDelete = isAdmin || (isCreator && nodeLogs.length === 0);

    // Hard-Check Backend (falls Jemand trickst)
    if (!canDelete) {
        showToast('Nur Admins können Blöcke löschen, auf die bereits Zeiten gebucht wurden.', 'error');
        return;
    }

    const confirmed = await customConfirm('Block löschen', 'Möchtest du diesen Block und alle Unterverknüpfungen wirklich entfernen?');
    if (confirmed) {
        await db.from('project_nodes').delete().eq('id', id);
        closeModal('configModal');
        showToast('Block gelöscht', 'success');
    }
};

window.handleOpenAddZoneModal = function(customX = null, customY = null) {
    if (customX !== null && customY !== null) {
        document.getElementById('newZoneCustomPos').value = JSON.stringify({ x: customX, y: customY });
    } else {
        document.getElementById('newZoneCustomPos').value = '';
    }
    openModal('newZoneModal');
};

window.handleAddZone = async function(e) {
    // ... bleibt identisch
    e.preventDefault();
    const title = document.getElementById('newZoneTitle').value.trim();
    const color_hex = document.getElementById('newZoneColor').value;
    const customPosVal = document.getElementById('newZoneCustomPos').value;

    if (!title) return;

    let posX = Math.round(Math.random() * 200 + 100);
    let posY = Math.round(Math.random() * 150 + 100);

    if (customPosVal) {
        const posObj = JSON.parse(customPosVal);
        posX = Math.round(posObj.x);
        posY = Math.round(posObj.y);
    }

    await db.from('project_zones').insert([{
        project_id: activeProjectId,
        title,
        color_hex,
        pos_x: posX,
        pos_y: posY,
        width: 600,
        height: 450,
        created_by: activeUserCode || 'COT'
    }]);

    closeModal('newZoneModal');
    document.getElementById('newZoneForm').reset();
    showToast(`Bereich "${title}" erstellt`, 'success');
    fetchCanvasData();
};

window.openEditZoneModal = function(zoneId) {
    const zone = currentZones.find(z => z.id === zoneId);
    if (!zone) return;

    document.getElementById('editZoneId').value = zone.id;
    document.getElementById('editZoneTitle').value = zone.title;

    const container = document.getElementById('editZoneColorPresetsContainer');
    container.innerHTML = '';
    COLOR_PRESETS.forEach(p => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = p.hex;
        swatch.title = p.name;
        swatch.dataset.hex = p.hex;

        if (p.hex.toLowerCase() === (zone.color_hex || '#a0aec0').toLowerCase()) {
            swatch.classList.add('selected');
        }

        swatch.addEventListener('click', () => {
            document.querySelectorAll('#editZoneColorPresetsContainer .color-swatch').forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
            document.getElementById('editZoneColor').value = p.hex;
        });
        container.appendChild(swatch);
    });

    document.getElementById('editZoneColor').value = zone.color_hex || '#a0aec0';
    openModal('editZoneModal');
};

window.handleSaveZoneConfig = async function(e) {
    e.preventDefault();
    const id = document.getElementById('editZoneId').value;
    const title = document.getElementById('editZoneTitle').value.trim();
    const color_hex = document.getElementById('editZoneColor').value;

    await db.from('project_zones').update({ title, color_hex }).eq('id', id);
    closeModal('editZoneModal');
    showToast('Bereich erfolgreich aktualisiert', 'success');
    fetchCanvasData();
};

window.handleDeleteZone = async function(zoneId) {
    const confirmed = await customConfirm('Bereich löschen', 'Möchtest du diesen Kasten entfernen? (Die darin liegenden Blöcke bleiben erhalten)');
    if (confirmed) {
        await db.from('project_zones').delete().eq('id', zoneId);
        showToast('Bereich gelöscht', 'success');
        fetchCanvasData();
    }
};

// =============================================================================
// 6. ZEITERFASSUNG, FERTIGSTELLUNG, REVISION & LÖSCHEN
// =============================================================================
window.handleLog = async function (e, nodeId) {
    e.preventDefault();
    const form = e.target;
    const taskType = form.elements[1].value;
    const hours = parseInt(form.elements[2].value, 10) || 0;
    const mins = parseInt(form.elements[3].value, 10) || 0;
    const note = form.elements[4].value.trim();

    if (hours < 0 || mins < 0 || (hours === 0 && mins === 0)) {
        showToast('Bitte mindestens 5 Minuten positive Zeit eingeben.', 'error');
        return;
    }

    if (!activeUserCode) {
        showToast('Bitte wähle zuerst dein Benutzerkürzel.', 'error');
        return;
    }

    const decimalHours = parseFloat((hours + (mins / 60)).toFixed(4));

    const { error } = await db.from('time_logs').insert([{
        project_id: activeProjectId,
        node_id: nodeId,
        user_code: activeUserCode,
        task_type: taskType,
        hours: decimalHours,
        note: note,
        status: 'pending'
    }]);

    if (error) {
        showToast('Fehler: ' + error.message, 'error');
        return;
    }

    form.elements[2].value = '0';
    form.elements[3].value = '30';
    form.elements[4].value = '';
    showToast(`${hours}h ${mins}m erfasst (wartet auf Freigabe)`, 'success');
};

window.handleRequestCompletion = async function (nodeId) {
    if (!activeUserCode) {
        showToast('Bitte wähle zuerst dein Benutzerkürzel.', 'error');
        return;
    }

    const confirmed = await customConfirm('Fertigstellung melden', 'Möchtest du diesen Block als "Erledigt" zur Freigabe einreichen?');
    if (confirmed) {
        const { error } = await db.from('time_logs').insert([{
            project_id: activeProjectId,
            node_id: nodeId,
            user_code: activeUserCode,
            task_type: 'completion',
            hours: 0,
            note: 'Fertigstellung beantragt',
            status: 'pending'
        }]);

        if (error) {
            showToast('Fehler bei der Fertigmeldung: ' + error.message, 'error');
            return;
        }

        await db.from('project_nodes').update({ completion_status: 'pending_approval' }).eq('id', nodeId);

        showToast('Fertigstellung zur Freigabe eingereicht', 'success');
        fetchCanvasData();
    }
};

window.handleRevokeCompletion = async function (nodeId) {
    if (!isAdmin) return;

    const confirmed = await customConfirm('Revision / Status zurücksetzen', 'Möchtest du den Status wieder auf "Offen" setzen (Revision / Zurückweisen)?');
    if (confirmed) {
        await db.from('project_nodes').update({ completion_status: 'open' }).eq('id', nodeId);

        await db.from('time_logs').insert([{
            project_id: activeProjectId,
            node_id: nodeId,
            user_code: activeUserCode || 'ADM',
            task_type: 'completion',
            hours: 0,
            note: '🔄 [Revision] Freigabe aufgehoben / Zurückgewiesen',
            status: 'approved'
        }]);

        showToast('Block auf Revision (Offen) gesetzt', 'info');
        fetchCanvasData();
    }
};

window.handleDeleteLog = async function (logId) {
    const log = currentTimeLogs.find(l => l.id === logId);
    if (!log) return;

    const canDelete = isAdmin || (log.status === 'pending' && log.user_code === activeUserCode);
    if (!canDelete) {
        showToast('Keine Berechtigung zum Löschen dieses Eintrags.', 'error');
        return;
    }

    const confirmed = await customConfirm('Zeiteintrag löschen', 'Möchtest du diesen Eintrag wirklich entfernen?');
    if (confirmed) {
        await db.from('time_logs').delete().eq('id', logId);

        if (log.task_type === 'completion') {
            await db.from('project_nodes').update({ completion_status: 'open' }).eq('id', log.node_id);
        }
        showToast('Eintrag gelöscht', 'success');
        fetchCanvasData();
    }
};

window.approveLog = async function (logId) {
    const log = currentTimeLogs.find(l => l.id === logId);
    if (!log) return;

    await db.from('time_logs').update({ status: 'approved' }).eq('id', logId);

    if (log.task_type === 'completion') {
        await db.from('project_nodes').update({ completion_status: 'completed' }).eq('id', log.node_id);
    }

    showToast('Freigabe erfolgreich erteilt', 'success');
    fetchCanvasData();
};

// =============================================================================
// 7. RETRO-LOGGING (ADMIN)
// =============================================================================
window.openRetroLogModal = function () {
    const id = document.getElementById('editNodeId').value;
    const node = currentNodes.find(n => n.id === id);
    if (!node) return;

    closeModal('configModal');

    document.getElementById('retroLogNodeId').value = node.id;
    document.getElementById('retroLogBlockName').value = node.name;
    document.getElementById('retroLogDate').valueAsDate = new Date();
    openModal('retroLogModal');
};

window.handleSaveRetroLog = async function (e) {
    e.preventDefault();
    const nodeId = document.getElementById('retroLogNodeId').value;
    const userCode = document.getElementById('retroLogUserCode').value;
    const dateVal = document.getElementById('retroLogDate').value;
    const taskType = document.getElementById('retroLogTaskType').value;
    const hours = parseInt(document.getElementById('retroLogHours').value, 10) || 0;
    const mins = parseInt(document.getElementById('retroLogMins').value, 10) || 0;
    const note = document.getElementById('retroLogNote').value.trim();

    if (hours === 0 && mins === 0) {
        showToast('Bitte positive Zeit eingeben.', 'error');
        return;
    }

    const decimalHours = parseFloat((hours + (mins / 60)).toFixed(4));
    const loggedAtTimestamp = new Date(dateVal + 'T12:00:00Z').toISOString();

    const { error } = await db.from('time_logs').insert([{
        project_id: activeProjectId,
        node_id: nodeId,
        user_code: userCode,
        task_type: taskType,
        hours: decimalHours,
        note: note ? `[Rückwirkend] ${note}` : '[Rückwirkend eingetragen]',
        status: 'approved',
        logged_at: loggedAtTimestamp
    }]);

    if (error) {
        showToast('Fehler: ' + error.message, 'error');
        return;
    }

    closeModal('retroLogModal');
    showToast(`Rückwirkender Eintrag für ${userCode} gespeichert`, 'success');
};

// =============================================================================
// 8. ADMIN KONTROLLZENTRUM & AUDIT-LOGS
// =============================================================================
window.handleAdminIconClick = async function() {
    if (isAdmin) {
        const wantLogout = await customConfirm(
            'Erweiterte Optionen',
            'Die erweiterten Optionen sind freigeschaltet. Möchtest du diese sperren oder das Kontrollzentrum öffnen?',
            'Sperren',
            'Kontrollzentrum'
        );

        if (wantLogout === true) {
            isAdmin = false;
            const btn = document.getElementById('adminLockBtn');
            btn.classList.remove('logged-in');
            btn.textContent = '🔒';

            selectedNodeIds.clear();
            renderCanvas();
            updateSidebarStats();
            showToast('Erweiterte Optionen gesperrt', 'info');
        } else if (wantLogout === false) {
            openAdminModal();
        }
    } else {
        const pwd = await customPrompt('Erweiterte Optionen freischalten', 'Bitte Freischalt-Passwort eingeben:', '', true);
        if (pwd === ADMIN_PASS) {
            isAdmin = true;
            const btn = document.getElementById('adminLockBtn');
            btn.classList.add('logged-in');
            btn.textContent = '🔓';
            showToast('Erweiterte Optionen freigeschaltet', 'success');
            renderCanvas();
            updateSidebarStats();
            openAdminModal();
        } else if (pwd !== null) {
            showToast('Falsches Passwort', 'error');
        }
    }
};

window.openAdminModal = function () {
    renderPendingLogsTable();
    renderAdminUserList();
    renderAdminProjectList();
    fetchAuditLogs();
    openModal('adminModal');
};

window.renderAdminProjectList = function () {
    const container = document.getElementById('projectListContainer');
    if (!container) return;
    container.innerHTML = '';

    const activeProjects = currentProjects.filter(p => !p.is_archived);

    activeProjects.forEach(p => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; font-size:11px; padding:5px 6px; border-bottom:1px solid #edf2f7;';

        row.innerHTML = `
      <span>
        <strong>${escapeHtml(p.object_number)}</strong> – ${escapeHtml(p.name)} 
        <span style="color:#718096; margin-left:6px;">[CAD: ${p.total_budget_design}h | Zeichn: ${p.total_budget_drafting}h]</span>
      </span>
      <div style="display:flex; gap:6px; align-items:center;">
        <button type="button" class="btn-sec" style="padding:2px 6px; font-size:10px;" onclick="startEditProject('${p.id}')">✏️ Edit</button>
        <button type="button" class="btn-sec" style="padding:2px 6px; font-size:10px; color:#c05621;" onclick="archiveProject('${p.id}', true)">🗄️ Archivieren</button>
        <span style="color:#e53e3e; cursor:pointer; font-weight:bold; font-size:13px;" title="Projekt komplett löschen" onclick="handleDeleteProject('${p.id}')">✕</span>
      </div>
    `;
        container.appendChild(row);
    });
};

window.startEditProject = function (projectId) {
    const p = currentProjects.find(item => item.id === projectId);
    if (!p) return;

    document.getElementById('adminProjEditId').value = p.id;
    document.getElementById('newProjectObjNum').value = p.object_number;
    document.getElementById('newProjectName').value = p.name;
    document.getElementById('newProjectBudgetD').value = p.total_budget_design;
    document.getElementById('newProjectBudgetDr').value = p.total_budget_drafting;

    document.getElementById('btnSaveProjEdit').textContent = 'Änderungen speichern';
    document.getElementById('btnCancelProjEdit').style.display = 'inline-block';
};

window.cancelProjectEdit = function () {
    document.getElementById('adminProjEditId').value = '';
    document.getElementById('newProjectObjNum').value = '';
    document.getElementById('newProjectName').value = '';
    document.getElementById('newProjectBudgetD').value = '100';
    document.getElementById('newProjectBudgetDr').value = '60';

    document.getElementById('btnSaveProjEdit').textContent = '+ Neues Projekt anlegen';
    document.getElementById('btnCancelProjEdit').style.display = 'none';
};

window.handleSaveProject = async function (e) {
    e.preventDefault();
    const editId = document.getElementById('adminProjEditId').value;
    const objNum = document.getElementById('newProjectObjNum').value.trim();
    const name = document.getElementById('newProjectName').value.trim();
    const bD = parseFloat(document.getElementById('newProjectBudgetD').value) || 0;
    const bDr = parseFloat(document.getElementById('newProjectBudgetDr').value) || 0;

    if (!objNum || !name) {
        showToast('Bitte Objektnummer und Projektname angeben.', 'error');
        return;
    }

    if (editId) {
        const oldProj = currentProjects.find(p => p.id === editId);
        const auditEntries = [];

        if (oldProj) {
            if (oldProj.object_number !== objNum) {
                auditEntries.push({ project_id: editId, changed_by: activeUserCode || 'COT', field_name: 'Objektnummer', old_value: oldProj.object_number, new_value: objNum });
            }
            if (oldProj.name !== name) {
                auditEntries.push({ project_id: editId, changed_by: activeUserCode || 'COT', field_name: 'Projektname', old_value: oldProj.name, new_value: name });
            }
            if (parseFloat(oldProj.total_budget_design) !== bD) {
                auditEntries.push({ project_id: editId, changed_by: activeUserCode || 'COT', field_name: 'Budget CAD', old_value: `${oldProj.total_budget_design}h`, new_value: `${bD}h` });
            }
            if (parseFloat(oldProj.total_budget_drafting) !== bDr) {
                auditEntries.push({ project_id: editId, changed_by: activeUserCode || 'COT', field_name: 'Budget Zeichnung', old_value: `${oldProj.total_budget_drafting}h`, new_value: `${bDr}h` });
            }
        }

        await db.from('projects').update({
            object_number: objNum,
            name: name,
            total_budget_design: bD,
            total_budget_drafting: bDr
        }).eq('id', editId);

        if (auditEntries.length > 0) {
            await db.from('budget_audit_logs').insert(auditEntries);
        }

        showToast(`Projekt ${objNum} erfolgreich aktualisiert`, 'success');
    } else {
        const { data: newProj } = await db.from('projects').insert([{
            object_number: objNum,
            name: name,
            total_budget_design: bD,
            total_budget_drafting: bDr,
            is_archived: false
        }]).select().single();

        if (newProj) {
            await db.from('budget_audit_logs').insert([{
                project_id: newProj.id,
                changed_by: activeUserCode || 'COT',
                field_name: 'Projekt initialisiert',
                old_value: '-',
                new_value: `${objNum} (${bD}h / ${bDr}h)`
            }]);
        }

        showToast(`Neues Projekt ${objNum} erstellt`, 'success');
    }

    cancelProjectEdit();
    fetchProjects();
    fetchAuditLogs();
};

window.toggleAuditScope = function () {
    showAllAuditLogs = !showAllAuditLogs;
    document.getElementById('btnToggleAuditScope').textContent = showAllAuditLogs ? 'Nur letzten Eintrag anzeigen' : 'Alle Einträge anzeigen';
    renderBudgetAuditLogs();
};

window.renderBudgetAuditLogs = function () {
    const container = document.getElementById('budgetAuditLogsContainer');
    if (!container) return;

    if (currentAuditLogs.length === 0) {
        container.innerHTML = '<div style="font-size:11px; color:#718096; padding:6px 0;">Noch keine Protokolleinträge vorhanden.</div>';
        return;
    }

    const logsToRender = showAllAuditLogs ? currentAuditLogs : currentAuditLogs.slice(0, 1);

    let html = `
    <table class="log-table">
      <thead>
        <tr>
          <th>Datum/Uhrzeit</th>
          <th>Objekt</th>
          <th>Admin</th>
          <th>Feld</th>
          <th>Vorher</th>
          <th>Nachher</th>
        </tr>
      </thead>
      <tbody>
  `;

    logsToRender.forEach(log => {
        const proj = currentProjects.find(p => p.id === log.project_id);
        const objNum = proj ? proj.object_number : 'Gelöscht';
        const d = new Date(log.changed_at);
        const dateStr = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

        html += `
      <tr>
        <td>${dateStr}</td>
        <td><strong>${escapeHtml(objNum)}</strong></td>
        <td><span class="user-tag" style="padding:1px 4px; font-size:9px;">${escapeHtml(log.changed_by)}</span></td>
        <td>${escapeHtml(log.field_name)}</td>
        <td style="color:#e53e3e; text-decoration:line-through;">${escapeHtml(log.old_value)}</td>
        <td style="color:#38a169; font-weight:bold;">${escapeHtml(log.new_value)}</td>
      </tr>
    `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
};

window.handleDeleteProject = async function (projectId) {
    if (currentProjects.length <= 1) {
        showToast('Das letzte verbleibende Projekt kann nicht gelöscht werden.', 'error');
        return;
    }
    const confirmed = await customConfirm('Projekt löschen', 'Möchtest du dieses Projekt und alle zugehörigen Blöcke und Zeiten unwiderruflich löschen?');
    if (confirmed) {
        await db.from('projects').delete().eq('id', projectId);
        if (activeProjectId === projectId) {
            activeProjectId = currentProjects[0].id;
        }
        showToast('Projekt gelöscht', 'success');
    }
};

window.renderPendingLogsTable = function () {
    const container = document.getElementById('pendingLogsTableContainer');
    const pendingLogs = currentTimeLogs.filter(l => l.status === 'pending');

    if (pendingLogs.length === 0) {
        container.innerHTML = '<div style="font-size:12px; color:#718096; padding:10px 0;">Keine ausstehenden Freigaben im aktuellen Projekt.</div>';
        return;
    }

    let html = `
    <table class="log-table">
      <thead>
        <tr>
          <th>Kürzel</th>
          <th>Block</th>
          <th>Kat.</th>
          <th>Zeit</th>
          <th>Kommentar</th>
          <th>Aktion</th>
        </tr>
      </thead>
      <tbody>
  `;

    pendingLogs.forEach(log => {
        const node = currentNodes.find(n => n.id === log.node_id);
        const nodeName = node ? node.name : 'Unbekannt';
        let kat = log.task_type === 'design' ? 'CAD' : (log.task_type === 'drafting' ? 'Zeichn.' : 'Status');

        // Revision/Fertigstellung optisch abheben
        let timeFormatted = formatHoursToHM(log.hours);
        if (log.task_type === 'completion') {
            kat = 'Status';
            timeFormatted = log.note.includes('Revision') || log.note.includes('Ablehnen') ? '↺' : '✔';
        }

        html += `
      <tr>
        <td><strong>${escapeHtml(log.user_code)}</strong></td>
        <td>${escapeHtml(nodeName)}</td>
        <td>${kat}</td>
        <td><span style="color:#38a169; font-weight:bold;">${timeFormatted}</span></td>
        <td style="color:#718096; font-style:italic;">${escapeHtml(log.note || '-')}</td>
        <td>
          <button class="btn-prim" style="padding: 2px 8px; font-size: 10px;" onclick="approveLog('${log.id}')">Freigeben</button>
        </td>
      </tr>
    `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
};

window.renderAdminUserList = function () {
    const container = document.getElementById('userListContainer');
    container.innerHTML = '';
    currentUsers.forEach(u => {
        const tag = document.createElement('div');
        tag.style.cssText = 'background:#edf2f7; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:bold; display:flex; align-items:center; gap:6px;';
        tag.innerHTML = `
      <span>${u.code}</span>
      <span style="color:#e53e3e; cursor:pointer;" onclick="handleDeleteUserCode('${u.id}')">&times;</span>
    `;
        container.appendChild(tag);
    });
};

window.handleAddUserCode = async function () {
    const input = document.getElementById('newCodeInput');
    const code = input.value.trim().toUpperCase();
    if (code.length !== 3) {
        showToast('Kürzel muss genau 3 Zeichen lang sein.', 'error');
        return;
    }
    await db.from('app_users').insert([{ code }]);
    input.value = '';
    showToast(`Kürzel ${code} hinzugefügt`, 'success');
};

window.handleDeleteUserCode = async function (userId) {
    const confirmed = await customConfirm('Kürzel löschen', 'Möchtest du dieses Benutzerkürzel wirklich entfernen?');
    if (confirmed) {
        await db.from('app_users').delete().eq('id', userId);
        showToast('Kürzel gelöscht', 'success');
    }
};

window.openModal = function (modalId) {
    const el = document.getElementById(modalId);
    if (el) el.style.display = 'flex';
};

window.closeModal = function (modalId) {
    const el = document.getElementById(modalId);
    if (el) el.style.display = 'none';
};

/**
* Breadcrumb: [2026-08-23] Persönlicher Sichtbarkeits-Filter
*/
window.personalFilterActive = false;

window.togglePersonalFilter = function() {
    window.personalFilterActive = !window.personalFilterActive;
    const tag = document.getElementById('sidebarUserCode');

    if (window.personalFilterActive) {
        tag.classList.add('filter-active');
        showToast('Filter aktiv: Nur eigene Zuweisungen hervorgehoben', 'info');
    } else {
        tag.classList.remove('filter-active');
        showToast('Filter deaktiviert: Alle Blöcke sichtbar', 'info');
    }

    if (typeof renderCanvas === 'function') renderCanvas();
};