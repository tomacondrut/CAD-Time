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

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Login, Logout & Session Storage
 * ERSETZEN IN: ui.js (Funktionen confirmUserLogin & handleLogout)
 * Zeitstempel: 2026-08-26 20:10:00 CEST
 * Breadcrumbs:
 *   - [2026-08-26] Speichern von User/Projekt im localStorage sowie 
 *     handleLogout zum Zurückkehren zum Login-Fenster implementiert.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Login & Cache-Persistierung
 * ERSETZEN IN: ui.js (Funktion confirmUserLogin)
 * Zeitstempel: 2026-08-26 20:15:00 CEST
 * Breadcrumbs:
 *   - [2026-08-26] Robuste Overlay-Schließung und Viewport-Wiederherstellung.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Login & Cache-Persistierung
 * ERSETZEN IN: ui.js (Funktionen confirmUserLogin & handleLogout)
 * Zeitstempel: 2026-08-26 20:20:00 CEST
 * Breadcrumbs:
 *   - [2026-08-26] Robuste Overlay-Schließung: Fallback auf localStorage,
 *     falls Dropdowns im DOM beim Initialstart noch nicht fertig befüllt sind.
 * =============================================================================
 */
window.confirmUserLogin = function () {
    const selectUser = document.getElementById('userSelectDropdown');
    const selectProj = document.getElementById('projectSelectLoginDropdown');

    // Priorität: Dropdown-Wert -> wenn leer, Fallback auf localStorage
    const userVal = (selectUser && selectUser.value) ? selectUser.value : localStorage.getItem('cad_tm_user');
    const projVal = (selectProj && selectProj.value) ? selectProj.value : localStorage.getItem('cad_tm_project');

    if (!userVal || !projVal) return;

    activeUserCode = userVal;
    activeProjectId = projVal;

    // Im LocalStorage sichern
    localStorage.setItem('cad_tm_user', activeUserCode);
    localStorage.setItem('cad_tm_project', activeProjectId);

    const sbUser = document.getElementById('sidebarUserCode');
    const sbProj = document.getElementById('sidebarProjectSelect');
    if (sbUser) sbUser.textContent = activeUserCode;
    if (sbProj) sbProj.value = activeProjectId;

    // Dropdowns synchronisieren
    if (selectUser) selectUser.value = activeUserCode;
    if (selectProj) selectProj.value = activeProjectId;

    // Login-Overlay zuverlässig ausblenden
    const overlay = document.getElementById('userLoginOverlay');
    if (overlay) overlay.style.display = 'none';

    // Gespeicherte Viewport-Koordinaten anwenden
    const savedPanX = localStorage.getItem('cad_tm_panX');
    const savedPanY = localStorage.getItem('cad_tm_panY');
    const savedScale = localStorage.getItem('cad_tm_scale');

    if (savedPanX !== null && savedPanY !== null && savedScale !== null) {
        window.currentPanX = parseFloat(savedPanX);
        window.currentPanY = parseFloat(savedPanY);
        window.currentScale = parseFloat(savedScale);
    }

    if (typeof applyCanvasTransform === 'function') applyCanvasTransform();
    if (typeof fetchCanvasData === 'function') fetchCanvasData();
    showToast(`Angemeldet als ${activeUserCode}`, 'success');
};

window.handleLogout = function () {
    // Cache leeren
    localStorage.removeItem('cad_tm_user');

    // Login-Modal wieder öffnen
    const overlay = document.getElementById('userLoginOverlay');
    if (overlay) overlay.style.display = 'flex';

    if (typeof renderUserDropdowns === 'function') renderUserDropdowns();
    if (typeof renderProjectDropdowns === 'function') renderProjectDropdowns();
    showToast('Abgemeldet', 'info');
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
// Breadcrumb: [2026-08-24 20:15:00 CEST] Komplette Bereinigung von Duplikaten
// =============================================================================

window.handleOpenAddBlockModal = function (customX = null, customY = null, parentConnectId = null) {
    const budgetRow = document.getElementById('newBlockBudgetRow');
    if (budgetRow) budgetRow.style.display = isAdmin ? 'flex' : 'none';

    if (customX !== null && customY !== null) {
        document.getElementById('newBlockCustomPos').value = JSON.stringify({ x: customX, y: customY, parentConnectId });
    } else {
        document.getElementById('newBlockCustomPos').value = '';
    }
    openModal('newBlockModal');
};

window.handleAddBlock = async function (e) {
    e.preventDefault();
    const name = document.getElementById('newBlockName').value.trim();
    const docInput = document.getElementById('newBlockDocNumber').value.trim();
    const docNumber = docInput ? 'DOC' + docInput : '';
    const article = document.getElementById('newBlockArticle').value.trim();
    const blockType = document.querySelector('input[name="blockType"]:checked').value;
    const customPosVal = document.getElementById('newBlockCustomPos').value;

    if (docNumber && !/^DOC\d{7}$/.test(docNumber)) {
        showToast('DOC-Nummer muss das Format DOC + 7 Ziffern haben (z.B. DOC1234567).', 'error');
        return;
    }

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
        doc_number: docNumber,
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

window.openConfigModal = function (nodeId) {
    const node = currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    // Prüfe, ob IRGENDEINE Instanz dieses Blocks Zeiten gebucht hat
    const relatedNodeIds = node.linked_id
        ? currentNodes.filter(n => n.linked_id === node.linked_id).map(n => n.id)
        : [node.id];
    const nodeLogs = currentTimeLogs.filter(l => relatedNodeIds.includes(l.node_id));

    const creator = node.created_by || 'COT';
    const isCreatorOrAdmin = isAdmin || (activeUserCode && activeUserCode === creator);
    const canDelete = isAdmin || ((activeUserCode && activeUserCode === creator) && nodeLogs.length === 0);

    document.getElementById('editNodeId').value = node.id;
    document.getElementById('editName').value = node.name;
    document.getElementById('editDocNumber').value = node.doc_number ? node.doc_number.replace(/^DOC/i, '') : '';
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

    if (bDesign) { bDesign.value = node.budget_design_hours || 0; bDesign.disabled = !isAdmin; }
    if (bDraft) { bDraft.value = node.budget_drafting_hours || 0; bDraft.disabled = !isAdmin; }

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

    if (btnDel) btnDel.style.display = canDelete ? 'block' : 'none';

    /**
     * Breadcrumb: [2026-08-25] Rückwirkendes Eintragen für alle Nutzer freigeschaltet.
     */
    if (retroBtn) retroBtn.style.display = 'block';

    if (isAdmin) {
        if (statusGroup) statusGroup.style.display = 'block';
        const statusSelect = document.getElementById('editCompletionStatus');
        if (statusSelect) statusSelect.value = node.completion_status || 'open';
    } else {
        if (statusGroup) statusGroup.style.display = 'none';
    }

    openModal('configModal');
};

window.handleSaveConfig = async function (e) {
    e.preventDefault();
    const id = document.getElementById('editNodeId').value;
    const node = currentNodes.find(n => n.id === id);
    if (!node) return;

    const creator = node.created_by || 'COT';
    const isCreatorOrAdmin = isAdmin || (activeUserCode && activeUserCode === creator);

    const name = document.getElementById('editName').value;
    const docInput = document.getElementById('editDocNumber').value.trim();
    const doc_number = docInput ? 'DOC' + docInput : '';
    const article_number = document.getElementById('editArticleNumber').value.trim();
    const color_hex = document.getElementById('editColor').value;
    const block_type = document.querySelector('input[name="editBlockType"]:checked').value;

    if (doc_number && !/^DOC\d{7}$/.test(doc_number)) {
        showToast('DOC-Nummer muss das Format DOC + 7 Ziffern haben (z.B. DOC1234567).', 'error');
        return;
    }

    if (article_number && !/^\d{5}$/.test(article_number)) {
        showToast('Artikelnummer muss genau 5 Ziffern lang sein.', 'error');
        return;
    }

    const updateData = { name, doc_number, article_number, color_hex, block_type };

    if (isCreatorOrAdmin) {
        const selDesign = document.getElementById('editAssignedDesignUser');
        const selDraft = document.getElementById('editAssignedDraftingUser');
        if (selDesign) updateData.assigned_design_user = selDesign.value || null;
        if (selDraft) updateData.assigned_drafting_user = selDraft.value || null;
    }

    if (isAdmin) {
        const bDesignEl = document.getElementById('editBudgetDesign');
        const bDraftEl = document.getElementById('editBudgetDrafting');
        if (bDesignEl) updateData.budget_design_hours = Math.max(0, parseFloat(bDesignEl.value) || 0);
        if (bDraftEl) updateData.budget_drafting_hours = Math.max(0, parseFloat(bDraftEl.value) || 0);

        const statusSelect = document.getElementById('editCompletionStatus');
        if (statusSelect) updateData.completion_status = statusSelect.value;
    }

    await db.from('project_nodes').update(updateData).eq('id', id);
    closeModal('configModal');
    showToast('Block aktualisiert', 'success');
    if (typeof fetchCanvasData === 'function') fetchCanvasData();
};

window.handleDeleteNode = async function () {
    const id = document.getElementById('editNodeId').value;
    const node = currentNodes.find(n => n.id === id);
    if (!node) return;

    const relatedNodeIds = node.linked_id
        ? currentNodes.filter(n => n.linked_id === node.linked_id).map(n => n.id)
        : [node.id];
    const nodeLogs = currentTimeLogs.filter(l => relatedNodeIds.includes(l.node_id));

    const isCreator = (activeUserCode && activeUserCode === node.created_by);
    const canDelete = isAdmin || (isCreator && nodeLogs.length === 0);

    if (!canDelete) {
        showToast('Nur Admins können Blöcke löschen, auf die bereits Zeiten gebucht wurden.', 'error');
        return;
    }

    const confirmed = await customConfirm('Block löschen', 'Möchtest du diesen Block wirklich entfernen?');
    if (confirmed) {
        const { error } = await db.from('project_nodes').delete().eq('id', id);
        if (error) {
            showToast('Fehler beim Löschen: ' + error.message, 'error');
            return;
        }
        closeModal('configModal');
        showToast('Block gelöscht', 'success');
        if (typeof fetchCanvasData === 'function') fetchCanvasData();
    }
};

window.handleOpenAddZoneModal = function (customX = null, customY = null) {
    const budgetRow = document.getElementById('newZoneBudgetRow');
    if (budgetRow) budgetRow.style.display = isAdmin ? 'flex' : 'none';

    const populateSelect = (selectEl) => {
        if (!selectEl) return;
        selectEl.innerHTML = '<option value="">-- Offen --</option>';
        currentUsers.forEach(u => selectEl.add(new Option(u.code, u.code)));
    };
    populateSelect(document.getElementById('newZoneAssignedDesignUser'));
    populateSelect(document.getElementById('newZoneAssignedDraftingUser'));

    if (customX !== null && customY !== null) {
        document.getElementById('newZoneCustomPos').value = JSON.stringify({ x: customX, y: customY });
    } else {
        document.getElementById('newZoneCustomPos').value = '';
    }
    openModal('newZoneModal');
};

window.handleAddZone = async function (e) {
    e.preventDefault();
    const title = document.getElementById('newZoneTitle').value.trim();
    const color_hex = document.getElementById('newZoneColor').value;
    const customPosVal = document.getElementById('newZoneCustomPos').value;

    const docInputEl = document.getElementById('newZoneDocNumber');
    const docNumber = (docInputEl && docInputEl.value.trim()) ? 'DOC' + docInputEl.value.trim() : '';

    const articleEl = document.getElementById('newZoneArticle');
    const article = articleEl ? articleEl.value.trim() : '';

    if (!title) return;

    if (docNumber && !/^DOC\d{7}$/.test(docNumber)) {
        showToast('DOC-Nummer muss genau 7 Ziffern lang sein.', 'error');
        return;
    }

    let designBudget = 0, draftingBudget = 0;
    if (isAdmin) {
        const bD = document.getElementById('newZoneBudgetDesign');
        const bDr = document.getElementById('newZoneBudgetDrafting');
        designBudget = bD ? Math.max(0, parseFloat(bD.value) || 0) : 0;
        draftingBudget = bDr ? Math.max(0, parseFloat(bDr.value) || 0) : 0;
    }

    const sD = document.getElementById('newZoneAssignedDesignUser');
    const sDr = document.getElementById('newZoneAssignedDraftingUser');
    const assigned_design_user = sD ? sD.value || null : null;
    const assigned_drafting_user = sDr ? sDr.value || null : null;

    let posX = Math.round(Math.random() * 200 + 100);
    let posY = Math.round(Math.random() * 150 + 100);
    if (customPosVal) {
        const pObj = JSON.parse(customPosVal);
        posX = Math.round(pObj.x); posY = Math.round(pObj.y);
    }

    await db.from('project_zones').insert([{
        project_id: activeProjectId,
        title, doc_number: docNumber, article_number: article,
        budget_design_hours: designBudget, budget_drafting_hours: draftingBudget,
        color_hex, pos_x: posX, pos_y: posY, width: 600, height: 450,
        created_by: activeUserCode || 'COT',
        assigned_design_user, assigned_drafting_user
    }]);

    closeModal('newZoneModal');
    document.getElementById('newZoneForm').reset();
    showToast(`Bereich "${title}" erstellt`, 'success');
    if (typeof fetchCanvasData === 'function') fetchCanvasData();
};

window.openEditZoneModal = function (zoneId) {
    const zone = currentZones.find(z => z.id === zoneId);
    if (!zone) return;

    const creator = zone.created_by || 'COT';
    const isCreatorOrAdmin = isAdmin || (activeUserCode && activeUserCode === creator);

    document.getElementById('editZoneId').value = zone.id;
    document.getElementById('editZoneTitle').value = zone.title;

    const docEl = document.getElementById('editZoneDocNumber');
    if (docEl) docEl.value = zone.doc_number ? zone.doc_number.replace(/^DOC/i, '') : '';

    const artEl = document.getElementById('editZoneArticleNumber');
    if (artEl) artEl.value = zone.article_number || '';

    const bD = document.getElementById('editZoneBudgetDesign');
    const bDr = document.getElementById('editZoneBudgetDrafting');
    if (bD) { bD.value = zone.budget_design_hours || 0; bD.disabled = !isAdmin; }
    if (bDr) { bDr.value = zone.budget_drafting_hours || 0; bDr.disabled = !isAdmin; }

    const assignGroup = document.getElementById('editZoneAssignedUserGroup');
    const selD = document.getElementById('editZoneAssignedDesignUser');
    const selDr = document.getElementById('editZoneAssignedDraftingUser');

    if (isCreatorOrAdmin) {
        if (assignGroup) assignGroup.style.display = 'flex';
        const popSelect = (el, val) => {
            if (!el) return;
            el.innerHTML = '<option value="">-- Offen --</option>';
            currentUsers.forEach(u => el.add(new Option(u.code, u.code)));
            el.value = val || '';
        };
        popSelect(selD, zone.assigned_design_user);
        popSelect(selDr, zone.assigned_drafting_user);
    } else {
        if (assignGroup) assignGroup.style.display = 'none';
    }

    const cCont = document.getElementById('editZoneColorPresetsContainer');
    if (cCont) {
        cCont.innerHTML = '';
        COLOR_PRESETS.forEach(p => {
            const s = document.createElement('div');
            s.className = 'color-swatch';
            s.style.backgroundColor = p.hex;
            if (p.hex.toLowerCase() === (zone.color_hex || '#a0aec0').toLowerCase()) s.classList.add('selected');
            s.addEventListener('click', () => {
                document.querySelectorAll('#editZoneColorPresetsContainer .color-swatch').forEach(x => x.classList.remove('selected'));
                s.classList.add('selected');
                document.getElementById('editZoneColor').value = p.hex;
            });
            cCont.appendChild(s);
        });
    }
    document.getElementById('editZoneColor').value = zone.color_hex || '#a0aec0';
    openModal('editZoneModal');
};

window.handleSaveZoneConfig = async function (e) {
    e.preventDefault();
    const id = document.getElementById('editZoneId').value;
    const title = document.getElementById('editZoneTitle').value.trim();
    const color_hex = document.getElementById('editZoneColor').value;

    const docInputEl = document.getElementById('editZoneDocNumber');
    const doc_number = (docInputEl && docInputEl.value.trim()) ? 'DOC' + docInputEl.value.trim() : '';

    const articleEl = document.getElementById('editZoneArticleNumber');
    const article_number = articleEl ? articleEl.value.trim() : '';

    if (!title) return;

    const zone = currentZones.find(z => z.id === id);
    const creator = zone ? zone.created_by : 'COT';
    const isCreatorOrAdmin = isAdmin || (activeUserCode && activeUserCode === creator);

    const updateData = { title, color_hex, doc_number, article_number };

    if (isAdmin) {
        const bD = document.getElementById('editZoneBudgetDesign');
        const bDr = document.getElementById('editZoneBudgetDrafting');
        if (bD) updateData.budget_design_hours = Math.max(0, parseFloat(bD.value) || 0);
        if (bDr) updateData.budget_drafting_hours = Math.max(0, parseFloat(bDr.value) || 0);
    }

    if (isCreatorOrAdmin) {
        const sD = document.getElementById('editZoneAssignedDesignUser');
        const sDr = document.getElementById('editZoneAssignedDraftingUser');
        if (sD) updateData.assigned_design_user = sD.value || null;
        if (sDr) updateData.assigned_drafting_user = sDr.value || null;
    }

    await db.from('project_zones').update(updateData).eq('id', id);
    closeModal('editZoneModal');
    showToast('Bereich erfolgreich aktualisiert', 'success');
    if (typeof fetchCanvasData === 'function') fetchCanvasData();
};

window.handleDeleteZone = async function (zoneId) {
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
/**
 * =============================================================================
 * Breadcrumb: [2026-08-25] Retro-Log Modus für alle Nutzer anpassen
 * (Admin: direkt freigegeben, User: wartet auf Freigabe & nur eigenes Kürzel).
 * =============================================================================
 */
window.openRetroLogModal = function() {
    const id = document.getElementById('editNodeId').value;
    const node = currentNodes.find(n => n.id === id);
    if (!node) return;

    closeModal('configModal');

    document.getElementById('retroLogNodeId').value = node.id;
    document.getElementById('retroLogBlockName').value = node.name;
    document.getElementById('retroLogDate').valueAsDate = new Date();

    // Nutzerkürzel standardmäßig auf den aktiven Nutzer setzen
    const userSelect = document.getElementById('retroLogUserCode');
    if (userSelect) {
        userSelect.value = activeUserCode;
        // Wenn kein Admin, Auswahl auf den eigenen Code sperren, um Manipulationen zu verhindern
        userSelect.disabled = !isAdmin;
    }

    // Button Text dynamisch anpassen
    const submitBtn = document.querySelector('#retroLogForm .btn-prim');
    if (submitBtn) {
        submitBtn.textContent = isAdmin ? 'Eintragen & Direkt freigeben' : 'Eintragen (Wartet auf Freigabe)';
    }

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

    /**
     * Breadcrumb: [2026-08-25] Status abhängig von Admin-Rechten setzen.
     */
    const finalStatus = isAdmin ? 'approved' : 'pending';

    const { error } = await db.from('time_logs').insert([{
        project_id: activeProjectId,
        node_id: nodeId,
        user_code: userCode,
        task_type: taskType,
        hours: decimalHours,
        note: note ? `[Rückwirkend] ${note}` : '[Rückwirkend eingetragen]',
        status: finalStatus,
        logged_at: loggedAtTimestamp
    }]);

    if (error) {
        showToast('Fehler: ' + error.message, 'error');
        return;
    }

    closeModal('retroLogModal');

    const msg = isAdmin
        ? `Rückwirkender Eintrag für ${userCode} gespeichert`
        : `Rückwirkender Eintrag erfasst (wartet auf Freigabe)`;

    showToast(msg, 'success');

    // Canvas aktualisieren, damit ausstehende Logs direkt in der Historie angezeigt werden
    if (typeof fetchCanvasData === 'function') fetchCanvasData();
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
          <th>Ort (Block/Rahmen)</th>
          <th>Kat.</th>
          <th>Zeit</th>
          <th>Kommentar</th>
          <th>Aktion</th>
        </tr>
      </thead>
      <tbody>
  `;

    pendingLogs.forEach(log => {
        let nodeName = 'Unbekannt';
        const node = currentNodes.find(n => n.id === log.node_id);
        if (node) {
            nodeName = node.name;
        } else {
            // Falls es ein Zonen-Log ist
            const zone = currentZones.find(z => z.id === log.zone_id || z.id === log.node_id);
            if (zone) nodeName = '📍 ' + zone.title;
        }

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

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Knotenpunkte Toggle im Kontextmenü)
 * Breadcrumb: [2026-08-24 19:40:00 CEST]
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Knotenpunkte Toggle im Kontextmenü)
 * Breadcrumb: [2026-08-24 19:42:00 CEST] Startzustand auf false (ausgeblendet)
 * =============================================================================
 */
window.handlesVisible = false;

window.toggleHandles = function () {
    window.handlesVisible = !window.handlesVisible;
    const canvas = document.getElementById('canvas');
    const menuBtn = document.getElementById('ctxMenuToggleHandles');

    if (!canvas) return;

    if (window.handlesVisible) {
        canvas.classList.remove('hide-handles');
        if (menuBtn) menuBtn.innerHTML = '🔌 Knotenpunkte ausblenden';
        showToast('Verbindungspunkte eingeblendet', 'info');
    } else {
        canvas.classList.add('hide-handles');
        if (menuBtn) menuBtn.innerHTML = '🔌 Knotenpunkte einblenden';

        if (typeof cancelConnectionMode === 'function' && window.connectingFirstNodeId) {
            cancelConnectionMode();
        }
        showToast('Verbindungspunkte ausgeblendet', 'info');
    }
};

/**
* =============================================================================
* Projekt: CAD Time Manager
* Domain: UI Controller (Zonen-Logs)
* Breadcrumb: [2026-08-24 20:20:00 CEST]
* =============================================================================
*/
window.toggleZoneLogs = function (e, zoneId) {
    if (e) e.stopPropagation();
    if (!window.expandedZones) window.expandedZones = new Set();

    if (window.expandedZones.has(zoneId)) {
        window.expandedZones.delete(zoneId);
    } else {
        window.expandedZones.add(zoneId);
    }
    if (typeof fetchCanvasData === 'function') fetchCanvasData();
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Zonen-Logs)
 * Breadcrumb: [2026-08-24 20:25:00 CEST] Foreign-Key Error behoben (node_id: null)
 * =============================================================================
 */
window.handleZoneLog = async function (e, zoneId) {
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

    // node_id zwingend null senden, da der Log zur Zone gehört!
    const payload = {
        project_id: activeProjectId,
        user_code: activeUserCode,
        task_type: taskType,
        hours: decimalHours,
        note: note,
        status: 'pending',
        zone_id: zoneId,
        node_id: null
    };

    const { error } = await db.from('time_logs').insert([payload]);

    if (error) {
        showToast('Fehler: ' + error.message, 'error');
        return;
    }

    form.elements[2].value = '0';
    form.elements[3].value = '30';
    form.elements[4].value = '';
    showToast(`${hours}h ${mins}m für Kasten erfasst (wartet auf Freigabe)`, 'success');
    if (typeof fetchCanvasData === 'function') fetchCanvasData();
};

/**
* =============================================================================
* Breadcrumb: [2026-08-25 17:35:00 CEST] Sticky Notes Logic 
* Verwendet 'project_nodes' mit block_type='note' und article_number='public/private'
* =============================================================================
*/

const NOTE_COLORS = [
    { name: 'Gelb', hex: '#fefcbf' },
    { name: 'Blau', hex: '#bee3f8' },
    { name: 'Grün', hex: '#c6f6d5' },
    { name: 'Pink', hex: '#fed7e2' },
    { name: 'Grau', hex: '#edf2f7' }
];

window.renderNoteColorPresets = function(containerId, inputId, defaultColor) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    NOTE_COLORS.forEach(p => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = p.hex;
        if (p.hex === defaultColor) swatch.classList.add('selected');
        swatch.addEventListener('click', () => {
            container.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('selected'));
            swatch.classList.add('selected');
            document.getElementById(inputId).value = p.hex;
        });
        container.appendChild(swatch);
    });
};

window.handleOpenAddNoteModal = function(x, y) {
    document.getElementById('newNoteCustomPos').value = JSON.stringify({ x, y });
    document.getElementById('newNoteForm').reset();
    renderNoteColorPresets('newNoteColorPresets', 'newNoteColor', '#fefcbf');
    openModal('newNoteModal');
};

/**
 * =============================================================================
 * Breadcrumb: [2026-08-25 18:00:00 CEST] Notiz-Erstellung mit Budget-Defaults 
 * und direkter Fehleranzeige.
 * =============================================================================
 */
window.handleAddNote = async function(e) {
    if (e) e.preventDefault();
    const text = document.getElementById('newNoteText').value.trim();
    const visibility = document.getElementById('newNoteVisibility').value;
    const color = document.getElementById('newNoteColor').value;
    const posStr = document.getElementById('newNoteCustomPos').value;

    let posX = 150, posY = 150;
    if (posStr) {
        const p = JSON.parse(posStr);
        posX = Math.round(p.x);
        posY = Math.round(p.y);
    }

    if (!text) return;

    const { error } = await db.from('project_nodes').insert([{
        project_id: activeProjectId,
        name: text,
        block_type: 'note',
        article_number: visibility,
        budget_design_hours: 190,  // Standard-Breite der Notiz (Zweckentfremdung)
        budget_drafting_hours: 80, // Standard-Höhe der Notiz (Zweckentfremdung)
        completion_status: 'open', // Zuklapp-Status
        color_hex: color,
        created_by: activeUserCode || 'COT',
        pos_x: posX,
        pos_y: posY
    }]);

    if (error) {
        console.error("Fehler beim Speichern der Notiz:", error);
        showToast('Fehler beim Anheften: ' + error.message, 'error');
        return;
    }

    closeModal('newNoteModal');
    showToast('Notiz angeheftet', 'success');
    if (typeof fetchCanvasData === 'function') fetchCanvasData();
};

window.openEditNoteModal = function(nodeId) {
    const node = currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    document.getElementById('editNoteId').value = node.id;
    document.getElementById('editNoteText').value = node.name;
    document.getElementById('editNoteVisibility').value = node.article_number || 'public';

    renderNoteColorPresets('editNoteColorPresets', 'editNoteColor', node.color_hex || '#fefcbf');
    openModal('editNoteModal');
};

window.handleSaveNote = async function(e) {
    e.preventDefault();
    const id = document.getElementById('editNoteId').value;
    const text = document.getElementById('editNoteText').value.trim();
    const visibility = document.getElementById('editNoteVisibility').value;
    const color = document.getElementById('editNoteColor').value;

    if (!text) return;

    await db.from('project_nodes').update({
        name: text,
        article_number: visibility,
        color_hex: color
    }).eq('id', id);

    closeModal('editNoteModal');
    showToast('Notiz aktualisiert', 'success');
    if (typeof fetchCanvasData === 'function') fetchCanvasData();
};

/**
 * =============================================================================
 * Breadcrumb: [2026-08-25 18:05:00 CEST] handleDeleteNote mit sicherer ID-Prüfung
 * =============================================================================
 */
window.handleDeleteNote = async function(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    const id = document.getElementById('editNoteId').value;
    if (!id) {
        showToast('Keine Notiz-ID gefunden.', 'error');
        return;
    }

    const confirmed = await customConfirm('Notiz löschen', 'Möchtest du diesen Notizzettel wirklich entfernen?');
    if (confirmed) {
        const { error } = await db.from('project_nodes').delete().eq('id', id);
        if (error) {
            showToast('Fehler beim Löschen: ' + error.message, 'error');
            return;
        }

        closeModal('editNoteModal');
        showToast('Notiz entfernt', 'success');

        // Lokalen Cache sofort bereinigen und Canvas neu rendern
        currentNodes = currentNodes.filter(n => n.id !== id);
        if (typeof renderCanvas === 'function') renderCanvas();
        if (typeof fetchCanvasData === 'function') fetchCanvasData();
    }
};

/**
* =============================================================================
* Breadcrumb: [2026-08-25] Mobile Sidebar Toggle Logik
* HINZUFÜGEN IN: ui.js (am Ende der Datei)
* =============================================================================
*/
window.toggleMobileSidebar = function () {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
};

// Schließt die Sidebar auf mobilen Geräten automatisch, wenn man ins Canvas tippt
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('mobileMenuBtn');
    if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('mobile-open')) {
        if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
            sidebar.classList.remove('mobile-open');
        }
    }
}, { capture: true }); // Capture-Phase, damit es vor Canvas-Events feuert

/**
 * =============================================================================
 * 9. MOBILE TOUCH-WHEEL (Zeiterfassung durch Wischen)
 * Breadcrumb: [2026-08-25] Wisch-Gesten auf Stunden/Minuten-Feldern ergänzt.
 * Zieht man den Finger auf dem Feld nach oben/unten, rollt die Zeit mit.
 * HINZUFÜGEN IN: ui.js (am Ende der Datei)
 * =============================================================================
 */
let timeSwipeStartY = 0;
let timeSwipeStartVal = 0;
let timeSwipeType = '';
let timeSwipeInput = null;

document.addEventListener('touchstart', (e) => {
    const input = e.target.closest('.input-hours, .input-mins');
    if (input && e.touches.length === 1) {
        timeSwipeInput = input;
        timeSwipeStartY = e.touches[0].clientY;
        timeSwipeStartVal = parseInt(input.value, 10) || 0;
        timeSwipeType = input.classList.contains('input-hours') ? 'hour' : 'min';

        // Verhindern, dass sich das Canvas beim Drehen des Rades verschiebt
        window.isDraggingAnything = true;
    }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (timeSwipeInput && e.touches.length === 1) {
        if (e.cancelable) e.preventDefault(); // Stoppt Seiten-Scrollen beim Wischen

        const currentY = e.touches[0].clientY;
        const diff = timeSwipeStartY - currentY; // Hochwischen = positive Zahl

        // Sensibilität: Alle 15 Pixel Wischbewegung = 1 Schritt
        const steps = Math.trunc(diff / 15);

        let stepValue = (timeSwipeType === 'hour') ? 1 : 5;
        let newVal = timeSwipeStartVal + (steps * stepValue);

        // Grenzen definieren
        if (newVal < 0) newVal = 0;
        if (timeSwipeType === 'min' && newVal > 55) newVal = 55;

        // Wert direkt ins Feld schreiben
        timeSwipeInput.value = (timeSwipeType === 'min') ? newVal.toString().padStart(2, '0') : newVal;
    }
}, { passive: false }); // passive: false erlaubt e.preventDefault()

const endTimeSwipe = () => {
    if (timeSwipeInput) {
        window.isDraggingAnything = false;
        timeSwipeInput = null;
    }
};

document.addEventListener('touchend', endTimeSwipe);
document.addEventListener('touchcancel', endTimeSwipe);