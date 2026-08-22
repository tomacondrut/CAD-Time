/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Modals, Dialoge, Admin-Center, Retro-Logs & Audit-Logs)
 * Zeitstempel: 2026-08-22 16:00:00 CEST
 * =============================================================================
 */

// --- Sidebar & Dashboard Stats ---
function updateSidebarStats() {
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
}

// --- Block Erstellung & Bearbeitung ---
function handleOpenAddBlockModal(customX = null, customY = null, parentConnectId = null) {
    const budgetRow = document.getElementById('newBlockBudgetRow');
    budgetRow.style.display = isAdmin ? 'flex' : 'none';

    if (customX !== null && customY !== null) {
        document.getElementById('newBlockCustomPos').value = JSON.stringify({ x: customX, y: customY, parentConnectId });
    } else {
        document.getElementById('newBlockCustomPos').value = '';
    }

    openModal('newBlockModal');
}

async function handleAddBlock(e) {
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
}

window.openConfigModal = function (nodeId) {
    const node = currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    const creator = node.created_by || 'COT';
    const isCreatorOrAdmin = isAdmin || (activeUserCode && activeUserCode === creator);

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
    const btnDel = document.getElementById('btnDeleteBlock');
    const retroBtn = document.getElementById('retroLogAdminBtnContainer');

    bDesign.value = node.budget_design_hours;
    bDraft.value = node.budget_drafting_hours;

    bDesign.disabled = !isAdmin;
    bDraft.disabled = !isAdmin;
    btnDel.style.display = isAdmin ? 'block' : 'none';
    retroBtn.style.display = isAdmin ? 'block' : 'none';

    openModal('configModal');
};

async function handleSaveConfig(e) {
    e.preventDefault();
    const id = document.getElementById('editNodeId').value;
    const name = document.getElementById('editName').value;
    const article_number = document.getElementById('editArticleNumber').value;
    const color_hex = document.getElementById('editColor').value;
    const block_type = document.querySelector('input[name="editBlockType"]:checked').value;

    const updateData = { name, article_number, color_hex, block_type };

    if (isAdmin) {
        updateData.budget_design_hours = Math.max(0, parseFloat(document.getElementById('editBudgetDesign').value) || 0);
        updateData.budget_drafting_hours = Math.max(0, parseFloat(document.getElementById('editBudgetDrafting').value) || 0);
    }

    await db.from('project_nodes').update(updateData).eq('id', id);
    closeModal('configModal');
    showToast('Block aktualisiert', 'success');
}

async function handleDeleteNode() {
    if (!isAdmin) {
        showToast('Nur Administratoren können Blöcke löschen.', 'error');
        return;
    }
    const confirmed = await customConfirm('Block löschen', 'Möchtest du diesen Block und alle Unterverknüpfungen wirklich entfernen?');
    if (confirmed) {
        const id = document.getElementById('editNodeId').value;
        await db.from('project_nodes').delete().eq('id', id);
        closeModal('configModal');
        showToast('Block gelöscht', 'success');
    }
}

// --- Zeiterfassung & Logs ---
async function handleLog(e, nodeId) {
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

    await db.from('time_logs').insert([{
        project_id: activeProjectId,
        node_id: nodeId,
        user_code: activeUserCode,
        task_type: taskType,
        hours: decimalHours,
        note: note,
        status: 'pending'
    }]);

    form.elements[2].value = '0';
    form.elements[3].value = '30';
    form.elements[4].value = '';
    showToast(`${hours}h ${mins}m erfasst (wartet auf Freigabe)`, 'success');
}

window.handleDeleteLog = async function (logId) {
    const log = currentTimeLogs.find(l => l.id === logId);
    if (!log) return;

    const canDelete = isAdmin || (log.status === 'pending' && log.user_code === activeUserCode);
    if (!canDelete) {
        showToast('Keine Berechtigung zum Löschen dieses Eintrags.', 'error');
        return;
    }

    const confirmed = await customConfirm('Zeiteintrag löschen', 'Möchtest du diesen Zeiteintrag wirklich entfernen?');
    if (confirmed) {
        await db.from('time_logs').delete().eq('id', logId);
        showToast('Zeiteintrag gelöscht', 'success');
    }
};

// --- Retro-Logging ---
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

async function handleSaveRetroLog(e) {
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

    await db.from('time_logs').insert([{
        project_id: activeProjectId,
        node_id: nodeId,
        user_code: userCode,
        task_type: taskType,
        hours: decimalHours,
        note: note ? `[Rückwirkend] ${note}` : '[Rückwirkend eingetragen]',
        status: 'approved',
        logged_at: loggedAtTimestamp
    }]);

    closeModal('retroLogModal');
    showToast(`Rückwirkender Eintrag für ${userCode} gespeichert`, 'success');
}

// --- Zonen / Kästen UI ---
function handleOpenAddZoneModal() {
    openModal('newZoneModal');
}

async function handleAddZone(e) {
    e.preventDefault();
    const title = document.getElementById('newZoneTitle').value.trim();
    const color_hex = document.getElementById('newZoneColor').value;

    if (!title) return;

    const posX = Math.round(Math.random() * 200 + 100);
    const posY = Math.round(Math.random() * 150 + 100);

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
}

window.handleRenameZone = async function (zoneId) {
    const zone = currentZones.find(z => z.id === zoneId);
    if (!zone) return;

    const newTitle = await customPrompt('Bereich umbenennen', 'Neuer Name für den Bereich:', zone.title);
    if (newTitle && newTitle.trim()) {
        await db.from('project_zones').update({ title: newTitle.trim() }).eq('id', zoneId);
        showToast('Bereich umbenannt', 'success');
        fetchCanvasData();
    }
};

window.handleDeleteZone = async function (zoneId) {
    const confirmed = await customConfirm('Bereich löschen', 'Möchtest du diesen Kasten entfernen? (Die darin liegenden Blöcke bleiben erhalten)');
    if (confirmed) {
        await db.from('project_zones').delete().eq('id', zoneId);
        showToast('Bereich gelöscht', 'success');
        fetchCanvasData();
    }
};

// --- Admin Kontrollzentrum & Audit Trail ---
window.handleAdminIconClick = async function () {
    if (isAdmin) {
        const wantLogout = await customConfirm(
            'Administrator-Sitzung',
            'Du bist als Administrator angemeldet. Möchtest du dich abmelden oder das Kontrollzentrum öffnen?',
            'Abmelden',
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
            showToast('Erfolgreich als Administrator abgemeldet', 'info');
        } else if (wantLogout === false) {
            openAdminModal();
        }
    } else {
        const pwd = await customPrompt('Administrator-Login', 'Bitte Admin-Passwort eingeben:', '', true);
        if (pwd === ADMIN_PASS) {
            isAdmin = true;
            const btn = document.getElementById('adminLockBtn');
            btn.classList.add('logged-in');
            btn.textContent = '🔓';
            showToast('Als Administrator eingeloggt', 'success');
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

function renderAdminProjectList() {
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
}

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

function renderBudgetAuditLogs() {
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
}

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

function renderPendingLogsTable() {
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
        const kat = log.task_type === 'design' ? 'CAD' : 'Zeichn.';

        html += `
      <tr>
        <td><strong>${escapeHtml(log.user_code)}</strong></td>
        <td>${escapeHtml(nodeName)}</td>
        <td>${kat}</td>
        <td>${formatHoursToHM(log.hours)}</td>
        <td style="color:#718096; font-style:italic;">${escapeHtml(log.note || '-')}</td>
        <td>
          <button class="btn-prim" style="padding: 2px 8px; font-size: 10px;" onclick="approveLog('${log.id}')">Freigeben</button>
        </td>
      </tr>
    `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

window.approveLog = async function (logId) {
    await db.from('time_logs').update({ status: 'approved' }).eq('id', logId);
    showToast('Zeiteintrag freigegeben', 'success');
};

function renderAdminUserList() {
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
}

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

// --- Modals & Helpers ---
window.openModal = function (modalId) {
    document.getElementById(modalId).style.display = 'flex';
};

window.closeModal = function (modalId) {
    document.getElementById(modalId).style.display = 'none';
};

function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}