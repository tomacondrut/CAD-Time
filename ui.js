/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Modals, Dialoge, Admin-Center, Retro-Logs, Revision)
 * =============================================================================
 */



/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller & CAD-Icons (Inventor-Style SVGs)
 * EINFÜGEN IN: ui.js (Abschnitt 1: Helper & Dialoge)
 * Zeitstempel: 2026-08-31 18:15:00 CEST
 * Breadcrumbs:
 *   - [2026-08-31 18:15:00 CEST]: Globale CAD-Icon-Konstanten für Bauteile (.ipt)
 *     und Baugruppen (.iam) im Inventor-Look integriert.
 * =============================================================================
 */
window.CAD_ICONS = {
    part: `<svg width="14" height="14" viewBox="0 0 50 50" style="vertical-align: -2px; display: inline-block;"><polygon points="25,2 47,13 25,24 3,13" fill="#ecc94b" stroke="#744210" stroke-width="2.5"/><polygon points="3,13 25,24 25,48 3,37" fill="#d69e2e" stroke="#744210" stroke-width="2.5"/><polygon points="25,24 47,13 47,37 25,48" fill="#b7791f" stroke="#744210" stroke-width="2.5"/></svg>`,
    assembly: `<svg width="15" height="15" viewBox="0 0 60 60" style="vertical-align: -2px; display: inline-block;"><g transform="translate(2, 2)"><polygon points="15,0 27,6 15,12 3,6" fill="#f6e05e" stroke="#744210" stroke-width="2"/><polygon points="3,6 15,12 15,26 3,20" fill="#ecc94b" stroke="#744210" stroke-width="2"/><polygon points="15,12 27,6 27,20 15,26" fill="#d69e2e" stroke="#744210" stroke-width="2"/></g><g transform="translate(26, 14)"><polygon points="15,0 27,6 15,12 3,6" fill="#f6e05e" stroke="#744210" stroke-width="2"/><polygon points="3,6 15,12 15,26 3,20" fill="#ecc94b" stroke="#744210" stroke-width="2"/><polygon points="15,12 27,6 27,20 15,26" fill="#d69e2e" stroke="#744210" stroke-width="2"/></g><g transform="translate(14, 24)"><polygon points="15,0 27,6 15,12 3,6" fill="#fefcbf" stroke="#744210" stroke-width="2"/><polygon points="3,6 15,12 15,26 3,20" fill="#ecc94b" stroke="#744210" stroke-width="2"/><polygon points="15,12 27,6 27,20 15,26" fill="#b7791f" stroke="#744210" stroke-width="2"/></g></svg>`,
    container: `⬚`,
    location: `📍`,
    comment: `💬`
};

// =============================================================================
// 1. HELPER & DIALOGE
// =============================================================================
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Helper, Dual-Prompt & Dialoge)
 * ERSETZEN IN: ui.js (Abschnitt 1: Helper & Dialoge)
 * Zeitstempel: 2026-08-30 14:30:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 10:30:00 CEST]: HTML-Dual-Inputs vorbereitet.
 *   - [2026-08-30 14:30:00 CEST]: customPromptDual implementiert, um den 
 *     Button "Neue lokale Datei" (handleNewFile) funktionsfähig zu machen.
 * =============================================================================
 */

window.showToast = function (msg, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
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

        const singleCont = document.getElementById('dialogInputContainer');
        const dualCont = document.getElementById('dialogDualInputContainer');
        if (dualCont) dualCont.style.display = 'none';

        const input = document.getElementById('dialogInput');
        if (singleCont) singleCont.style.display = 'block';
        if (input) {
            input.type = isPassword ? 'password' : 'text';
            input.value = defaultValue;
        }

        document.getElementById('dialogBtnConfirm').textContent = 'Bestätigen';
        document.getElementById('dialogBtnCancel').textContent = 'Abbrechen';

        openModal('dialogModal');
        if (input) input.focus();
    });
};

window.customPromptDual = function (title, message, label1, defaultVal1, label2, defaultVal2) {
    return new Promise((resolve) => {
        dialogResolve = resolve;
        document.getElementById('dialogTitle').textContent = title;
        document.getElementById('dialogMessage').textContent = message;

        const singleCont = document.getElementById('dialogInputContainer');
        const dualCont = document.getElementById('dialogDualInputContainer');
        if (singleCont) singleCont.style.display = 'none';
        if (dualCont) dualCont.style.display = 'flex';

        const l1 = document.getElementById('dialogLabel1');
        const i1 = document.getElementById('dialogInput1');
        const l2 = document.getElementById('dialogLabel2');
        const i2 = document.getElementById('dialogInput2');

        if (l1) l1.textContent = label1;
        if (i1) i1.value = defaultVal1;
        if (l2) l2.textContent = label2;
        if (i2) i2.value = defaultVal2;

        document.getElementById('dialogBtnConfirm').textContent = 'Erstellen';
        document.getElementById('dialogBtnCancel').textContent = 'Abbrechen';

        openModal('dialogModal');
        if (i1) i1.focus();
    });
};

window.customConfirm = function (title, message, confirmText = 'Bestätigen', cancelText = 'Abbrechen') {
    return new Promise((resolve) => {
        dialogResolve = resolve;
        document.getElementById('dialogTitle').textContent = title;
        document.getElementById('dialogMessage').textContent = message;

        const singleCont = document.getElementById('dialogInputContainer');
        const dualCont = document.getElementById('dialogDualInputContainer');
        if (singleCont) singleCont.style.display = 'none';
        if (dualCont) dualCont.style.display = 'none';

        document.getElementById('dialogBtnConfirm').textContent = confirmText;
        document.getElementById('dialogBtnCancel').textContent = cancelText;

        openModal('dialogModal');
    });
};

window.closeDialog = function (isConfirmed) {
    closeModal('dialogModal');
    if (dialogResolve) {
        const singleCont = document.getElementById('dialogInputContainer');
        const dualCont = document.getElementById('dialogDualInputContainer');

        if (singleCont && singleCont.style.display !== 'none') {
            const input = document.getElementById('dialogInput');
            dialogResolve(isConfirmed ? (input ? input.value : '') : null);
        } else if (dualCont && dualCont.style.display !== 'none') {
            const val1 = document.getElementById('dialogInput1')?.value || '';
            const val2 = document.getElementById('dialogInput2')?.value || '';
            dialogResolve(isConfirmed ? { val1, val2 } : null);
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

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Info Modal Tab Switching)
 * Zeitstempel: 2026-08-30 11:35:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 11:35:00 CEST]: Logik für die Registerkarten im Leitfaden.
 * =============================================================================
 */
window.switchInfoTab = function (tabId) {
    // 1. Alle Inhalte ausblenden
    const panes = document.querySelectorAll('.info-tab-pane');
    panes.forEach(pane => pane.style.display = 'none');

    // 2. Alle Buttons zurücksetzen
    const btns = document.querySelectorAll('.info-tab-btn');
    btns.forEach(btn => btn.classList.remove('active'));

    // 3. Ziel-Inhalt einblenden
    const targetPane = document.getElementById(tabId);
    if (targetPane) targetPane.style.display = 'block';

    // 4. Geklickten Button aktivieren
    const targetBtn = document.querySelector(`.info-tab-btn[onclick="switchInfoTab('${tabId}')"]`);
    if (targetBtn) targetBtn.classList.add('active');
};

// =============================================================================
// 2. DROPDOWNS, LOGIN & PROJEKTWECHSEL
// =============================================================================
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Projekt-Dropdowns (Visuelle Trennung Lokal vs Cloud)
 * ERSETZEN IN: ui.js (Funktion renderProjectDropdowns)
 * Zeitstempel: 2026-08-30 10:28:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 10:28:00 CEST]: 💾 [LOKAL] und ☁️ Icons für Dropdowns eingefügt.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Projekt-Dropdowns (Visuelle Trennung Lokal vs Cloud)
 * ERSETZEN IN: ui.js (Funktion renderProjectDropdowns)
 * Zeitstempel: 2026-08-30 10:50:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 10:50:00 CEST]: Doppelte Deklaration bereinigt.
 * =============================================================================
 */
window.renderProjectDropdowns = function () {
    const selectLogin = document.getElementById('projectSelectLoginDropdown');
    const selectSidebar = document.getElementById('sidebarProjectSelect');

    const activeProjects = (currentProjects || []).filter(p => !p.is_archived);

    if (selectLogin) {
        selectLogin.innerHTML = '';
        if (activeProjects.length === 0) {
            selectLogin.innerHTML = '<option value="">Keine aktiven Projekte</option>';
        } else {
            activeProjects.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                const icon = p.is_local ? '💾 [LOKAL]' : '☁️';
                opt.textContent = `${icon} ${p.object_number} - ${p.name}`;
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
                const icon = p.is_local ? '💾 [LOKAL]' : '☁️';
                opt.textContent = `${icon} ${p.object_number} - ${p.name}`;
                if (p.id === activeProjectId) opt.selected = true;
                selectSidebar.appendChild(opt);
            });
        }
    }
};
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Benutzer-Dropdowns Initialisierung)
 * EINFÜGEN IN: ui.js (Abschnitt 2: Dropdowns, Login & Projektwechsel)
 * Zeitstempel: 2026-08-31 18:35:00 CEST
 * Breadcrumbs:
 *   - [2026-08-31 18:35:00 CEST]: renderUserDropdowns implementiert, damit das
 *     Login-Dropdown und alle Zuweisungs-Listen zuverlässig mit Benutzerkürzeln befüllt werden.
 * =============================================================================
 */
window.renderUserDropdowns = function () {
    const selectLogin = document.getElementById('userSelectDropdown');
    const cachedUser = localStorage.getItem('cad_tm_user');

    if (selectLogin) {
        selectLogin.innerHTML = '';
        if (!currentUsers || currentUsers.length === 0) {
            selectLogin.innerHTML = '<option value="">Keine Benutzer gefunden</option>';
        } else {
            currentUsers.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.code;
                opt.textContent = u.code;
                if (cachedUser && u.code === cachedUser) {
                    opt.selected = true;
                } else if (!cachedUser && activeUserCode && u.code === activeUserCode) {
                    opt.selected = true;
                }
                selectLogin.appendChild(opt);
            });
        }
    }

    // Zuweisungs-Dropdowns in Modals aktualisieren (falls offen)
    if (typeof populateUserDropdown === 'function') {
        const newNoteUser = document.getElementById('newNoteAssignedUser');
        if (newNoteUser) populateUserDropdown(newNoteUser, newNoteUser.value || activeUserCode);

        const editNoteUser = document.getElementById('editNoteAssignedUser');
        if (editNoteUser) populateUserDropdown(editNoteUser, editNoteUser.value);
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
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Login & Session-Security
 * ERSETZEN IN: ui.js (Funktion confirmUserLogin)
 * Zeitstempel: 2026-09-01 17:55:00 CEST
 * Breadcrumbs:
 *   - [2026-08-26 20:20:00 CEST]: Robuste Overlay-Schließung.
 *   - [2026-09-01 17:55:00 CEST]: Admin-Status beim initialen Login in Cloud-Projekte 
 *     standardmäßig auf gesperrt (false) setzen.
 * =============================================================================
 */
window.confirmUserLogin = function () {
    const selectUser = document.getElementById('userSelectDropdown');
    const selectProj = document.getElementById('projectSelectLoginDropdown');

    const userVal = (selectUser && selectUser.value) ? selectUser.value : localStorage.getItem('cad_tm_user');
    const projVal = (selectProj && selectProj.value) ? selectProj.value : localStorage.getItem('cad_tm_project');

    if (!userVal || !projVal) return;

    activeUserCode = userVal;
    activeProjectId = projVal;

    // Cloud-Projekte starten beim Login immer im normalen Mitarbeiter-Modus
    if (!activeProjectId.startsWith('local_')) {
        isAdmin = false;
        const adminBtn = document.getElementById('adminLockBtn');
        if (adminBtn) {
            adminBtn.classList.remove('logged-in');
            adminBtn.textContent = '🔒';
            adminBtn.title = 'Erweiterte Optionen freischalten';
        }
    }

    localStorage.setItem('cad_tm_user', activeUserCode);
    localStorage.setItem('cad_tm_project', activeProjectId);

    const sbUser = document.getElementById('sidebarUserCode');
    const sbProj = document.getElementById('sidebarProjectSelect');
    if (sbUser) sbUser.textContent = activeUserCode;
    if (sbProj) sbProj.value = activeProjectId;

    if (selectUser) selectUser.value = activeUserCode;
    if (selectProj) selectProj.value = activeProjectId;

    const overlay = document.getElementById('userLoginOverlay');
    if (overlay) overlay.style.display = 'none';

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

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Projektwechsel & Cloud-Sicherheits-Guard)
 * ERSETZEN IN: ui.js (Funktion handleSidebarProjectChange)
 * Zeitstempel: 2026-09-01 17:55:00 CEST
 * Breadcrumbs:
 *   - [2026-08-26 20:10:00 CEST]: Initiale Projektwechsel-Logik.
 *   - [2026-09-01 17:55:00 CEST]: Cloud-Sicherheits-Guard: Beim Verlassen eines 
 *     lokalen Projekts in ein Cloud-Projekt wird isAdmin strikt entzogen (Passwortschutz greift).
 * =============================================================================
 */
window.handleSidebarProjectChange = function (newProjectId) {
    const wasLocal = window.activeProjectId && window.activeProjectId.startsWith('local_');
    const isNowCloud = newProjectId && !newProjectId.startsWith('local_');

    // Wenn aus einem lokalen Projekt in die Cloud gewechselt wird -> Admin-Rechte strikt entziehen
    if (wasLocal && isNowCloud) {
        isAdmin = false;
        const adminBtn = document.getElementById('adminLockBtn');
        if (adminBtn) {
            adminBtn.classList.remove('logged-in');
            adminBtn.textContent = '🔒';
            adminBtn.title = 'Erweiterte Optionen freischalten';
        }
        if (window.selectedNodeIds) selectedNodeIds.clear();
    }

    activeProjectId = newProjectId;
    localStorage.setItem('cad_tm_project', activeProjectId);

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
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Sidebar & Mausrad-Eingabe
 * ERSETZEN IN: ui.js (Funktion handleTimeWheel)
 * Zeitstempel: 2026-08-28 21:05:00 CEST
 * Breadcrumbs:
 *   - [2026-08-28 21:05]: 'input'-Event nach Wertänderung gefeuert, um State-Updates sicherzustellen.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Mausrad Zeit-Steuerung mit automatischem 60-Minuten-Übertrag)
 * ERSETZEN IN: ui.js (Funktion handleTimeWheel)
 * Zeitstempel: 2026-09-01 18:15:00 CEST
 * Breadcrumbs:
 *   - [2026-08-28 21:05:00 CEST]: Basisfunktion.
 *   - [2026-09-01 18:15:00 CEST]: Übertrag zwischen Stunden und Minuten 
 *     für Blöcke, Rahmen und Modals vereinheitlicht.
 * =============================================================================
 */
window.handleTimeWheel = function (e, type) {
    e.preventDefault();
    e.stopPropagation();

    const container = e.target.closest('.time-inputs-row');
    if (!container) return;

    const hourInput = container.querySelector('.input-hours, #retroLogHours');
    const minInput = container.querySelector('.input-mins, #retroLogMins');
    if (!hourInput || !minInput) return;

    let currentHours = parseInt(hourInput.value, 10) || 0;
    let currentMins = parseInt(minInput.value, 10) || 0;
    let totalMinutes = (currentHours * 60) + currentMins;

    const stepMinutes = (type === 'hour') ? 60 : 5;
    const delta = (e.deltaY < 0 ? 1 : -1) * stepMinutes;

    totalMinutes = Math.max(0, totalMinutes + delta);

    hourInput.value = Math.floor(totalMinutes / 60);
    minInput.value = (totalMinutes % 60).toString().padStart(2, '0');

    hourInput.dispatchEvent(new Event('input', { bubbles: true }));
    minInput.dispatchEvent(new Event('input', { bubbles: true }));
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Sidebar-Statistiken
 * ERSETZEN IN: ui.js (Funktion updateSidebarStats)
 * Zeitstempel: 2026-08-28 20:55:00 CEST
 * Breadcrumbs:
 *   - [2026-08-28]: sbValDrafting korrigiert (verwendet jetzt budDr statt budD).
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Sidebar (Berechnung von Vergabe-Stunden, Quoten & Akkordeon-State)
 * ERSETZEN IN: ui.js (Funktion updateSidebarStats & toggleSidebarBudgetDetails)
 * Zeitstempel: 2026-09-17 20:55:00 CEST
 * Breadcrumbs:
 *   - [2026-08-28 20:55:00 CEST]: Korrektur sbValDrafting.
 *   - [2026-09-17 20:55:00 CEST]: Vergabe-Budget (Master-dedupliziert) berechnet,
 *     Dual-Bar Fortschrittsleisten gefüllt und Kompakt-/Detail-Toggle persistiert.
 * =============================================================================
 */

window.toggleSidebarBudgetDetails = function () {
    const detailsEl = document.getElementById('sbBudgetDetailsView');
    const btn = document.getElementById('btnToggleBudgetDetails');
    if (!detailsEl || !btn) return;

    const isHidden = detailsEl.style.display === 'none';
    detailsEl.style.display = isHidden ? 'block' : 'none';
    btn.textContent = isHidden ? '▲ Kompakt' : '▼ Details';
    localStorage.setItem('cad_tm_budget_expanded', isHidden ? 'true' : 'false');
};

window.updateSidebarStats = function () {
    const proj = getCurrentProject();
    let totalD = 0;
    let totalDr = 0;
    let pendingCount = 0;

    // 1. Ist-Verbrauch über gebuchte Zeiten summieren
    currentTimeLogs.forEach(l => {
        const hrs = Math.max(0, parseFloat(l.hours) || 0);
        if (l.task_type === 'design') totalD += hrs;
        if (l.task_type === 'drafting') totalDr += hrs;
        if (l.status === 'pending') pendingCount++;
    });

    const pendingEl = document.getElementById('sbPendingLogs');
    if (pendingEl) pendingEl.textContent = pendingCount + ' Einträge';

    const budD = Math.max(0.1, parseFloat(proj.total_budget_design) || 1);
    const budDr = Math.max(0.1, parseFloat(proj.total_budget_drafting) || 1);

    // 2. Vergebenes Budget summieren (Master-Instanzen & Zonen, ohne Duplikate)
    const visitedLinkedIds = new Set();
    let allocD = 0;
    let allocDr = 0;

    (currentNodes || []).forEach(n => {
        if (n.block_type === 'note' || n.doc_number === 'NOTE' || n.doc_number === 'TODO') return;
        if (n.linked_id) {
            if (visitedLinkedIds.has(n.linked_id)) return;
            visitedLinkedIds.add(n.linked_id);
        }
        allocD += Math.max(0, parseFloat(n.budget_design_hours) || 0);
        allocDr += Math.max(0, parseFloat(n.budget_drafting_hours) || 0);
    });

    (currentZones || []).forEach(z => {
        allocD += Math.max(0, parseFloat(z.budget_design_hours) || 0);
        allocDr += Math.max(0, parseFloat(z.budget_drafting_hours) || 0);
    });

    // 3. Quoten & Prozentwerte
    const pctD = Math.round((totalD / budD) * 100);
    const pctDr = Math.round((totalDr / budDr) * 100);
    const allocPctD = Math.round((allocD / budD) * 100);
    const allocPctDr = Math.round((allocDr / budDr) * 100);

    // 4. Kompakt-Ansicht befüllen
    const txtCAD = document.getElementById('sbCompactTextCAD');
    const txtDraft = document.getElementById('sbCompactTextDraft');
    if (txtCAD) txtCAD.textContent = `${formatHoursToHM(totalD)} Ist / ${formatHoursToHM(allocD)} Verg. (${Math.round(budD)}h)`;
    if (txtDraft) txtDraft.textContent = `${formatHoursToHM(totalDr)} Ist / ${formatHoursToHM(allocDr)} Verg. (${Math.round(budDr)}h)`;

    const barAllocD = document.getElementById('sbBarAllocCAD');
    const barSpentD = document.getElementById('sbBarSpentCAD');
    const barAllocDr = document.getElementById('sbBarAllocDraft');
    const barSpentDr = document.getElementById('sbBarSpentDraft');

    if (barAllocD) barAllocD.style.width = `${Math.min(allocPctD, 100)}%`;
    if (barSpentD) {
        barSpentD.style.width = `${Math.min(pctD, 100)}%`;
        barSpentD.style.background = totalD > budD ? '#e53e3e' : '#3182ce';
    }

    if (barAllocDr) barAllocDr.style.width = `${Math.min(allocPctDr, 100)}%`;
    if (barSpentDr) {
        barSpentDr.style.width = `${Math.min(pctDr, 100)}%`;
        barSpentDr.style.background = totalDr > budDr ? '#e53e3e' : '#38a169';
    }

    // 5. Detail-Ansicht befüllen (Pie Charts & Aufschlüsselung)
    const pieDesignEl = document.getElementById('sbPieDesign');
    const pieDraftingEl = document.getElementById('sbPieDrafting');
    if (pieDesignEl && pieDraftingEl) {
        const fillD = totalD > budD ? '#e53e3e' : '#3182ce';
        const fillDr = totalDr > budDr ? '#e53e3e' : '#38a169';
        pieDesignEl.style.background = `conic-gradient(${fillD} 0% ${Math.min(pctD, 100)}%, #4a5568 ${Math.min(pctD, 100)}% 100%)`;
        pieDraftingEl.style.background = `conic-gradient(${fillDr} 0% ${Math.min(pctDr, 100)}%, #4a5568 ${Math.min(pctD, 100)}% 100%)`;

        document.getElementById('sbPctDesign').textContent = `${pctD}%`;
        document.getElementById('sbPctDrafting').textContent = `${pctDr}%`;
        document.getElementById('sbValDesign').textContent = `${formatHoursToHM(totalD)} / ${formatHoursToHM(budD)}`;
        document.getElementById('sbValDrafting').textContent = `${formatHoursToHM(totalDr)} / ${formatHoursToHM(budDr)}`;
    }

    const freeD = budD - allocD;
    const freeDr = budDr - allocDr;
    const dAllocCad = document.getElementById('sbDetailAllocCAD');
    const dFreeCad = document.getElementById('sbDetailFreeCAD');
    const dAllocDr = document.getElementById('sbDetailAllocDraft');
    const dFreeDr = document.getElementById('sbDetailFreeDraft');

    if (dAllocCad) dAllocCad.textContent = `${formatHoursToHM(allocD)} (${allocPctD}%)`;
    if (dFreeCad) {
        dFreeCad.textContent = freeD < 0 ? `Überbucht: ${formatHoursToHM(Math.abs(freeD))}` : formatHoursToHM(freeD);
        dFreeCad.style.color = freeD < 0 ? '#e53e3e' : '#cbd5e0';
    }

    if (dAllocDr) dAllocDr.textContent = `${formatHoursToHM(allocDr)} (${allocPctDr}%)`;
    if (dFreeDr) {
        dFreeDr.textContent = freeDr < 0 ? `Überbucht: ${formatHoursToHM(Math.abs(freeDr))}` : formatHoursToHM(freeDr);
        dFreeDr.style.color = freeDr < 0 ? '#e53e3e' : '#cbd5e0';
    }

    // Akkordeon-Zustand aus localStorage wiederherstellen
    const isExpanded = localStorage.getItem('cad_tm_budget_expanded') === 'true';
    const detailsView = document.getElementById('sbBudgetDetailsView');
    const btnToggle = document.getElementById('btnToggleBudgetDetails');
    if (detailsView && btnToggle) {
        detailsView.style.display = isExpanded ? 'block' : 'none';
        btnToggle.textContent = isExpanded ? '▲ Kompakt' : '▼ Details';
    }

    const btnAdmin = document.getElementById('btnAdminProjects');
    if (btnAdmin) btnAdmin.style.display = isAdmin ? 'inline' : 'none';

    if (window.renderSidebarZones) window.renderSidebarZones();
};

window.isolateZone = function (zoneId) {
    if (typeof window.toggleIsolateZone === 'function') {
        window.toggleIsolateZone(zoneId);
    }
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

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Sofort-Render bei lokaler Blockerstellung)
 * ERSETZEN IN: ui.js (Funktion handleAddBlock)
 * Zeitstempel: 2026-08-30 10:35:00 CEST
 * Breadcrumbs:
 *   - [2026-08-24 20:15:00 CEST]: Initiale Block-Erstellung.
 *   - [2026-08-30 10:35:00 CEST]: fetchCanvasData() und renderCanvas() direkt
 *     nach dem Einfügen aufgerufen, damit lokale Blöcke ohne Projektwechsel sichtbar sind.
 * =============================================================================
 */
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

    // Automatische Zonen-Zuordnung ermitteln
    const targetZone = (typeof getDeepestZoneAt === 'function')
        ? getDeepestZoneAt(posX + 160, posY + 100)
        : null;

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
        pos_y: posY,
        zone_id: targetZone ? targetZone.id : null
    }]).select().single();

    if (parentConnectId && insertedNode) {
        const parentNode = currentNodes.find(n => n.id === parentConnectId);
        if (parentNode) {
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
    }

    closeModal('newBlockModal');
    document.getElementById('newBlockForm').reset();
    showToast('Block erfolgreich hinzugefügt', 'success');

    // Erzwingt sofortige Aktualisierung auf dem Canvas
    if (typeof fetchCanvasData === 'function') {
        fetchCanvasData();
    } else if (typeof renderCanvas === 'function') {
        renderCanvas();
    }
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Block-Löschschutz: 1-Stunden-Frist für Ersteller)
 * ERSETZEN IN: ui.js (Funktionen openConfigModal & handleDeleteNode)
 * Zeitstempel: 2026-08-27 18:30:00 CEST
 * Breadcrumbs:
 *   - [2026-08-27 18:30:00 CEST]: Löschberechtigung für Ersteller auf 60 Minuten 
 *     nach Erstellung begrenzt. Ältere Blöcke können nur noch durch Admins gelöscht werden.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Fertigstellungsgrad Sliders mit 50/50 Formel & Rechten)
 * ERSETZEN IN: ui.js (Funktionen openConfigModal, updateConfigProgressDisplay & handleSaveConfig)
 * Zeitstempel: 2026-09-17 19:00:00 CEST
 * Breadcrumbs:
 *   - [2026-08-27 18:30:00 CEST]: Löschschutz 60 Min.
 *   - [2026-09-17 19:00:00 CEST]: 50/50 Slider-Steuerung mit rollenbasierter 
 *     Rechteprüfung (Admin / CAD-Bearbeiter / Zeichner) und Instanz-Synchronisation.
 * =============================================================================
 */

window.updateConfigProgressDisplay = function () {
    const sD = document.getElementById('editProgressDesign');
    const sDr = document.getElementById('editProgressDrafting');
    const valD = parseInt(sD ? sD.value : 0, 10) || 0;
    const valDr = parseInt(sDr ? sDr.value : 0, 10) || 0;

    const lblD = document.getElementById('editProgressDesignVal');
    const lblDr = document.getElementById('editProgressDraftingVal');
    const badgeTot = document.getElementById('editProgressTotalBadge');

    if (lblD) lblD.textContent = `${valD}%`;
    if (lblDr) lblDr.textContent = `${valDr}%`;

    const totalPct = Math.round((valD * 0.5) + (valDr * 0.5));
    if (badgeTot) {
        badgeTot.textContent = `${totalPct}% Gesamt`;
        badgeTot.style.background = totalPct === 100 ? '#c6f6d5' : (totalPct > 0 ? '#bee3f8' : '#edf2f7');
        badgeTot.style.color = totalPct === 100 ? '#22543d' : (totalPct > 0 ? '#2b6cb0' : '#4a5568');
    }
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Auto-100% bei Fertigstellung & Freigabe)
 * ERSETZEN IN: ui.js (Funktionen openConfigModal, handleSaveConfig & approveLog)
 * Zeitstempel: 2026-09-17 20:30:00 CEST
 * Breadcrumbs:
 *   - [2026-09-17 19:00:00 CEST]: 50/50 Slider & Rollenprüfung.
 *   - [2026-09-17 20:30:00 CEST]: Status 'completed' setzt CAD & Zeichnung 
 *     automatisch auf 100% (sowohl bei Admin-Freigabe als auch im Config-Modal).
 * =============================================================================
 */

window.openConfigModal = function (nodeId) {
    const node = currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    const relatedNodeIds = node.linked_id
        ? currentNodes.filter(n => n.linked_id === node.linked_id).map(n => n.id)
        : [node.id];
    const nodeLogs = currentTimeLogs.filter(l => relatedNodeIds.includes(l.node_id));

    const creator = node.created_by || 'COT';
    const isCreator = (activeUserCode && activeUserCode === creator);
    const isCreatorOrAdmin = isAdmin || isCreator;

    const createdAtTime = node.created_at ? new Date(node.created_at).getTime() : 0;
    const isWithinOneHour = (Date.now() - createdAtTime) <= (60 * 60 * 1000);
    const canDelete = isAdmin || (isCreator && nodeLogs.length === 0 && isWithinOneHour);

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

    // Sliders & Rechte
    const sD = document.getElementById('editProgressDesign');
    const sDr = document.getElementById('editProgressDrafting');
    const hintD = document.getElementById('editProgressDesignHint');
    const hintDr = document.getElementById('editProgressDraftingHint');

    const isAlreadyDone = node.completion_status === 'completed';
    const curD = isAlreadyDone ? 100 : ((node.progress_design !== null && node.progress_design !== undefined) ? node.progress_design : 0);
    const curDr = isAlreadyDone ? 100 : ((node.progress_drafting !== null && node.progress_drafting !== undefined) ? node.progress_drafting : 0);

    if (sD) sD.value = curD;
    if (sDr) sDr.value = curDr;
    updateConfigProgressDisplay();

    const canEditCAD = isAdmin || (activeUserCode && activeUserCode === node.assigned_design_user) || (!node.assigned_design_user && isCreator);
    const canEditDrafting = isAdmin || (activeUserCode && activeUserCode === node.assigned_drafting_user) || (!node.assigned_drafting_user && isCreator);

    if (sD) sD.disabled = !canEditCAD;
    if (sDr) sDr.disabled = !canEditDrafting;
    if (hintD) hintD.style.display = canEditCAD ? 'none' : 'block';
    if (hintDr) hintDr.style.display = canEditDrafting ? 'none' : 'block';

    const btnDel = document.getElementById('btnDeleteBlock');
    const retroBtn = document.getElementById('retroLogAdminBtnContainer');
    const statusGroup = document.getElementById('editStatusGroup');

    if (btnDel) btnDel.style.display = canDelete ? 'block' : 'none';
    if (retroBtn) retroBtn.style.display = 'block';

    if (isAdmin) {
        if (statusGroup) statusGroup.style.display = 'block';
        const statusSelect = document.getElementById('editCompletionStatus');
        if (statusSelect) {
            statusSelect.value = node.completion_status || 'open';
            // Dropdown-Wechsel auf 'completed' springt sofort auf 100%
            statusSelect.onchange = function () {
                if (statusSelect.value === 'completed') {
                    if (sD) sD.value = 100;
                    if (sDr) sDr.value = 100;
                    updateConfigProgressDisplay();
                }
            };
        }
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
        showToast('DOC-Nummer muss das Format DOC + 7 Ziffern haben.', 'error');
        return;
    }

    if (article_number && !/^\d{5}$/.test(article_number)) {
        showToast('Artikelnummer muss genau 5 Ziffern lang sein.', 'error');
        return;
    }

    const sD = document.getElementById('editProgressDesign');
    const sDr = document.getElementById('editProgressDrafting');
    let progress_design = sD ? Math.min(100, Math.max(0, parseInt(sD.value, 10) || 0)) : 0;
    let progress_drafting = sDr ? Math.min(100, Math.max(0, parseInt(sDr.value, 10) || 0)) : 0;

    let newStatus = node.completion_status || 'open';
    if (isAdmin) {
        const statusSelect = document.getElementById('editCompletionStatus');
        if (statusSelect) newStatus = statusSelect.value;
    }

    // Wenn Erledigt gewählt wurde: Zwingend 100% setzen
    if (newStatus === 'completed') {
        progress_design = 100;
        progress_drafting = 100;
    }

    const updateData = {
        name,
        doc_number,
        article_number,
        color_hex,
        block_type,
        progress_design,
        progress_drafting,
        completion_status: newStatus
    };

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
    }

    // Instanz-Synchronisation
    if (node.linked_id) {
        const relatedNodes = currentNodes.filter(n => n.linked_id === node.linked_id);
        const updates = relatedNodes.map(rn => {
            Object.assign(rn, updateData);
            return db.from('project_nodes').update(updateData).eq('id', rn.id);
        });
        await Promise.all(updates);
    } else {
        Object.assign(node, updateData);
        await db.from('project_nodes').update(updateData).eq('id', id);
    }

    closeModal('configModal');
    showToast('Block & Fertigstellungsgrad aktualisiert', 'success');
    if (typeof fetchCanvasData === 'function') fetchCanvasData();
};

window.handleDeleteNode = async function() {
    const id = document.getElementById('editNodeId').value;
    const node = currentNodes.find(n => n.id === id);
    if (!node) return;

    const relatedNodeIds = node.linked_id
        ? currentNodes.filter(n => n.linked_id === node.linked_id).map(n => n.id)
        : [node.id];
    const nodeLogs = currentTimeLogs.filter(l => relatedNodeIds.includes(l.node_id));

    const isCreator = (activeUserCode && activeUserCode === node.created_by);
    const createdAtTime = node.created_at ? new Date(node.created_at).getTime() : 0;
    const isWithinOneHour = (Date.now() - createdAtTime) <= (60 * 60 * 1000);

    const canDelete = isAdmin || (isCreator && nodeLogs.length === 0 && isWithinOneHour);

    if (!canDelete) {
        if (nodeLogs.length > 0) {
            showToast('Löschen nicht möglich: Auf diesen Block wurden bereits Zeiten gebucht (nur Admin).', 'error');
        } else if (!isWithinOneHour && !isAdmin) {
            showToast('Löschen abgelaufen: Ersteller können Blöcke nur innerhalb von 60 Minuten löschen (nur Admin).', 'error');
        } else {
            showToast('Keine Berechtigung zum Löschen dieses Blocks.', 'error');
        }
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

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Zonen-Erstellung & Hierarchie-Erkennung)
 * ERSETZEN IN: ui.js (Funktion handleAddZone)
 * Zeitstempel: 2026-08-31 17:50:00 CEST
 * Breadcrumbs:
 *   - [2026-08-24 20:15:00 CEST]: Initiale Zonen-Erstellung.
 *   - [2026-08-31 17:50:00 CEST]: parent_zone_id wird nun direkt anhand der 
 *     Canvas-Koordinaten ermittelt, damit neue Unterrahmen sofort hierarchisch eingeordnet sind.
 * =============================================================================
 */
window.handleAddZone = async function (e) {
    e.preventDefault();
    const title = document.getElementById('newZoneTitle').value.trim();
    const color_hex = document.getElementById('newZoneColor').value;
    const customPosVal = document.getElementById('newZoneCustomPos').value;
    const zone_type = document.querySelector('input[name="newZoneType"]:checked').value;

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
        posX = Math.round(pObj.x);
        posY = Math.round(pObj.y);
    }

    // Übergeordneten Rahmen an den Koordinaten ermitteln
    const parentZone = (typeof getDeepestZoneAt === 'function')
        ? getDeepestZoneAt(posX + 100, posY + 50)
        : null;
    const parentZoneId = parentZone ? parentZone.id : null;

    await db.from('project_zones').insert([{
        project_id: activeProjectId,
        title,
        doc_number: docNumber,
        article_number: article,
        budget_design_hours: designBudget,
        budget_drafting_hours: draftingBudget,
        color_hex,
        pos_x: posX,
        pos_y: posY,
        width: 600,
        height: 450,
        created_by: activeUserCode || 'COT',
        assigned_design_user,
        assigned_drafting_user,
        zone_type,
        parent_zone_id: parentZoneId
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

    const zType = zone.zone_type || 'location';
    const typeRadio = document.querySelector(`input[name="editZoneType"][value="${zType}"]`);
    if (typeRadio) typeRadio.checked = true;

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
    const zone_type = document.querySelector('input[name="editZoneType"]:checked').value;

    const docInputEl = document.getElementById('editZoneDocNumber');
    const doc_number = (docInputEl && docInputEl.value.trim()) ? 'DOC' + docInputEl.value.trim() : '';

    const articleEl = document.getElementById('editZoneArticleNumber');
    const article_number = articleEl ? articleEl.value.trim() : '';

    if (!title) return;

    const zone = currentZones.find(z => z.id === id);
    const creator = zone ? zone.created_by : 'COT';
    const isCreatorOrAdmin = isAdmin || (activeUserCode && activeUserCode === creator);

    const updateData = { title, color_hex, doc_number, article_number, zone_type };

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
    const finalStatus = isAdmin ? 'approved' : 'pending';

    const { error } = await db.from('time_logs').insert([{
        project_id: activeProjectId,
        node_id: nodeId,
        user_code: activeUserCode,
        task_type: taskType,
        hours: decimalHours,
        note: note,
        status: finalStatus
    }]);

    if (error) {
        showToast('Fehler: ' + error.message, 'error');
        return;
    }

    form.elements[2].value = '0';
    form.elements[3].value = '30';
    form.elements[4].value = '';

    if (isAdmin) {
        showToast(`${hours}h ${mins}m direkt verbucht`, 'success');
    } else {
        showToast(`${hours}h ${mins}m erfasst (wartet auf Freigabe)`, 'success');
    }

    if (typeof fetchCanvasData === 'function') fetchCanvasData();
};

window.handleRequestCompletion = async function (nodeId) {
    if (!activeUserCode) {
        showToast('Bitte wähle zuerst dein Benutzerkürzel.', 'error');
        return;
    }

    const confirmTitle = isAdmin ? 'Direkt als Erledigt markieren' : 'Fertigstellung melden';
    const confirmMsg = isAdmin
        ? 'Möchtest du diesen Block direkt als "Erledigt" (100%) markieren?'
        : 'Möchtest du diesen Block als "Erledigt" zur Freigabe einreichen?';

    const confirmed = await customConfirm(confirmTitle, confirmMsg);

    if (confirmed) {
        const finalStatus = isAdmin ? 'approved' : 'pending';
        const finalNodeStatus = isAdmin ? 'completed' : 'pending_approval';

        const { error } = await db.from('time_logs').insert([{
            project_id: activeProjectId,
            node_id: nodeId,
            user_code: activeUserCode,
            task_type: 'completion',
            hours: 0,
            note: isAdmin ? 'Direkt als Erledigt markiert' : 'Fertigstellung beantragt',
            status: finalStatus
        }]);

        if (error) {
            showToast('Fehler bei der Fertigmeldung: ' + error.message, 'error');
            return;
        }

        const updatePayload = { completion_status: finalNodeStatus };
        if (isAdmin) {
            updatePayload.progress_design = 100;
            updatePayload.progress_drafting = 100;
        }

        // Instanz-Synchronisation für Master/Referenzen
        const targetNode = currentNodes.find(n => n.id === nodeId);
        if (targetNode && targetNode.linked_id) {
            const relatedNodes = currentNodes.filter(n => n.linked_id === targetNode.linked_id);
            const updates = relatedNodes.map(rn => db.from('project_nodes').update(updatePayload).eq('id', rn.id));
            await Promise.all(updates);
        } else {
            await db.from('project_nodes').update(updatePayload).eq('id', nodeId);
        }

        showToast(isAdmin ? 'Block als Erledigt markiert (100%)' : 'Fertigstellung zur Freigabe eingereicht', 'success');
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

    // Wenn es eine Fertigmeldung ist: Status auf 'completed' UND Fortschritte auf 100% setzen
    if (log.task_type === 'completion') {
        const targetNode = currentNodes.find(n => n.id === log.node_id);
        const updatePayload = {
            completion_status: 'completed',
            progress_design: 100,
            progress_drafting: 100
        };

        if (targetNode && targetNode.linked_id) {
            const relatedNodes = currentNodes.filter(n => n.linked_id === targetNode.linked_id);
            const updates = relatedNodes.map(rn => {
                Object.assign(rn, updatePayload);
                return db.from('project_nodes').update(updatePayload).eq('id', rn.id);
            });
            await Promise.all(updates);
        } else {
            if (targetNode) Object.assign(targetNode, updatePayload);
            await db.from('project_nodes').update(updatePayload).eq('id', log.node_id);
        }
    }

    showToast('Freigabe erteilt (Status: Erledigt 100%)', 'success');
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
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Retro-Logging für Blöcke & Zonen)
 * ERSETZEN IN: ui.js (Abschnitt 7: RETRO-LOGGING)
 * Zeitstempel: 2026-09-01 17:55:00 CEST
 * Breadcrumbs:
 *   - [2026-08-25 17:35:00 CEST]: Status abhängig von Admin-Rechten.
 *   - [2026-09-01 17:55:00 CEST]: Unterstützung für rückwirkende Buchungen 
 *     auf Rahmen/Zonen (openZoneRetroLogModal & zone_id Payload).
 * =============================================================================
 */

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Retro-Logging Benutzer-Dropdown Logik)
 * ERSETZEN IN: ui.js (Abschnitt 7: RETRO-LOGGING komplett ersetzen)
 * Zeitstempel: 2026-09-01 17:58:00 CEST
 * Breadcrumbs:
 *   - [2026-08-25 17:35:00 CEST]: Status abhängig von Admin-Rechten.
 *   - [2026-09-01 17:55:00 CEST]: Retro-Logs für Rahmen/Zonen integriert.
 *   - [2026-09-01 17:58:00 CEST]: retroLogUserCode Dropdown-Steuerung: Admins 
 *     können beliebige Kürzel wählen, normale Benutzer sind auf das eigene Kürzel fixiert.
 * =============================================================================
 */

// Hilfsfunktion: Befüllt das Kürzel-Dropdown und regelt die Admin-/User-Freigabe
function setupRetroLogUserSelect() {
    const userSelect = document.getElementById('retroLogUserCode');
    if (!userSelect) return;

    userSelect.innerHTML = '';

    if (isAdmin) {
        // Admin: Alle Benutzer zur freien Auswahl
        (currentUsers || []).forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.code;
            opt.textContent = u.code;
            if (u.code === activeUserCode) opt.selected = true;
            userSelect.appendChild(opt);
        });
        userSelect.disabled = false;
    } else {
        // Einfacher Benutzer: Nur das eigene Kürzel fest hinterlegt
        const opt = document.createElement('option');
        opt.value = activeUserCode || 'KÜR';
        opt.textContent = activeUserCode || 'KÜR';
        opt.selected = true;
        userSelect.appendChild(opt);
        userSelect.disabled = true;
    }
}

// Öffnet Retro-Log für normale Baugruppen / Blöcke
window.openRetroLogModal = function () {
    const id = document.getElementById('editNodeId').value;
    const node = currentNodes.find(n => n.id === id);
    if (!node) return;

    closeModal('configModal');

    document.getElementById('retroLogNodeId').value = node.id;
    document.getElementById('retroLogZoneId').value = '';
    document.getElementById('retroLogTargetLabel').textContent = 'Block / Baugruppe:';
    document.getElementById('retroLogBlockName').value = node.name;
    document.getElementById('retroLogDate').valueAsDate = new Date();

    setupRetroLogUserSelect();

    const submitBtn = document.querySelector('#retroLogForm .btn-prim');
    if (submitBtn) {
        submitBtn.textContent = isAdmin ? 'Eintragen & Direkt freigeben' : 'Eintragen (Wartet auf Freigabe)';
    }

    openModal('retroLogModal');
};

// Öffnet Retro-Log für Rahmen / Zonen
window.openZoneRetroLogModal = function () {
    const id = document.getElementById('editZoneId').value;
    const zone = currentZones.find(z => z.id === id);
    if (!zone) return;

    closeModal('editZoneModal');

    document.getElementById('retroLogNodeId').value = '';
    document.getElementById('retroLogZoneId').value = zone.id;
    document.getElementById('retroLogTargetLabel').textContent = 'Bereich / Rahmen:';
    document.getElementById('retroLogBlockName').value = `📍 ${zone.title}`;
    document.getElementById('retroLogDate').valueAsDate = new Date();

    setupRetroLogUserSelect();

    const submitBtn = document.querySelector('#retroLogForm .btn-prim');
    if (submitBtn) {
        submitBtn.textContent = isAdmin ? 'Eintragen & Direkt freigeben' : 'Eintragen (Wartet auf Freigabe)';
    }

    openModal('retroLogModal');
};

window.handleSaveRetroLog = async function (e) {
    e.preventDefault();
    const nodeId = document.getElementById('retroLogNodeId').value || null;
    const zoneId = document.getElementById('retroLogZoneId').value || null;

    // Bei gesperrtem Dropdown greift der Fallback auf activeUserCode
    const selectEl = document.getElementById('retroLogUserCode');
    const userCode = (selectEl && selectEl.value) ? selectEl.value : activeUserCode;

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
    const finalStatus = isAdmin ? 'approved' : 'pending';

    const payload = {
        project_id: activeProjectId,
        node_id: nodeId,
        zone_id: zoneId,
        user_code: userCode,
        task_type: taskType,
        hours: decimalHours,
        note: note ? `[Rückwirkend] ${note}` : '[Rückwirkend eingetragen]',
        status: finalStatus,
        logged_at: loggedAtTimestamp
    };

    const { error } = await db.from('time_logs').insert([payload]);

    if (error) {
        showToast('Fehler: ' + error.message, 'error');
        return;
    }

    closeModal('retroLogModal');

    const msg = isAdmin
        ? `Rückwirkender Eintrag für ${userCode} gespeichert`
        : `Rückwirkender Eintrag erfasst (wartet auf Freigabe)`;

    showToast(msg, 'success');

    if (typeof fetchCanvasData === 'function') fetchCanvasData();
};
// =============================================================================
// 8. ADMIN KONTROLLZENTRUM & AUDIT-LOGS
// =============================================================================
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Admin Kontrollzentrum & Sicherheit)
 * ERSETZEN IN: ui.js (Funktion handleAdminIconClick)
 * Zeitstempel: 2026-08-30 10:45:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 10:45:00 CEST]: Passwort wird nun sicher dynamisch 
 *     aus der Supabase 'app_config' Tabelle geladen, anstatt aus dem Quellcode.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Robuste Admin-Passwort-Validierung)
 * ERSETZEN IN: ui.js (Funktion handleAdminIconClick)
 * Zeitstempel: 2026-08-31 17:35:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 10:45:00 CEST]: Passwort-Abfrage über Supabase 'app_config'.
 *   - [2026-08-31 17:35:00 CEST]: Direkte realDb-Instanz mit Fallback genutzt,
 *     um Blockaden durch den Proxy bei lokalen Projekten oder Offline-Status zu verhindern.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Admin-Modal & Freischaltung Crash-Proof)
 * ERSETZEN IN: ui.js (Funktionen handleAdminIconClick & openAdminModal)
 * Zeitstempel: 2026-08-31 17:40:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 10:45:00 CEST]: Dynamische Passwort-Abfrage.
 *   - [2026-08-31 17:40:00 CEST]: openAdminModal gegen fehlende Render-Funktionen 
 *     defensiv abgesichert, damit das Modal in jedem Fall zuverlässig öffnet.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Admin-Icon Klickverhalten für lokale Projekte)
 * ERSETZEN IN: ui.js (Funktion handleAdminIconClick)
 * Zeitstempel: 2026-08-31 17:58:00 CEST
 * Breadcrumbs:
 *   - [2026-08-31 17:40:00 CEST]: Passwort-Validierung & Defensiver Aufruf.
 *   - [2026-08-31 17:58:00 CEST]: Direkter Dialog/Modal-Aufruf ohne Sperr-Rückfrage
 *     für lokale Offline-Dateien.
 * =============================================================================
 */
window.handleAdminIconClick = async function () {
    const isLocalActive = !!(window.activeProjectId && window.activeProjectId.startsWith('local_'));

    // Lokales Projekt: Admin-Center direkt öffnen
    if (isLocalActive) {
        isAdmin = true;
        openAdminModal();
        return;
    }

    // Cloud-Projekt: Reguläres Sperren / Freischalten
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
            if (btn) {
                btn.classList.remove('logged-in');
                btn.textContent = '🔒';
            }

            if (window.selectedNodeIds) selectedNodeIds.clear();
            if (typeof renderCanvas === 'function') renderCanvas();
            if (typeof updateSidebarStats === 'function') updateSidebarStats();
            showToast('Erweiterte Optionen gesperrt', 'info');
        } else if (wantLogout === false) {
            openAdminModal();
        }
    } else {
        const pwd = await customPrompt('Erweiterte Optionen freischalten', 'Bitte Freischalt-Passwort eingeben:', '', true);

        if (pwd !== null && pwd.trim() !== '') {
            let correctPassword = null;

            try {
                const client = (typeof realDb !== 'undefined') ? realDb : db;
                const { data, error } = await client.from('app_config').select('value').eq('key', 'admin_password').single();
                if (!error && data && data.value) {
                    correctPassword = data.value;
                }
            } catch (err) {
                console.warn("DB-Passwort nicht erreichbar:", err);
            }

            const isValid = (correctPassword !== null) ? (pwd === correctPassword) : (pwd === 'admin');

            if (isValid) {
                isAdmin = true;
                const btn = document.getElementById('adminLockBtn');
                if (btn) {
                    btn.classList.add('logged-in');
                    btn.textContent = '🔓';
                }
                showToast('Erweiterte Optionen freigeschaltet', 'success');
                if (typeof renderCanvas === 'function') renderCanvas();
                if (typeof updateSidebarStats === 'function') updateSidebarStats();
                openAdminModal();
            } else {
                showToast('Falsches Passwort', 'error');
            }
        }
    }
};

window.openAdminModal = function () {
    // 1. Zuerst das Modal anzeigen, damit die UI sofort reagiert
    openModal('adminModal');

    // 2. Tabellen defensiv befüllen (Fehler in Teilbereichen blockieren nicht das Modal)
    try {
        if (typeof renderPendingLogsTable === 'function') renderPendingLogsTable();
        if (typeof renderAdminUserList === 'function') renderAdminUserList();
        if (typeof renderAdminProjectList === 'function') renderAdminProjectList();
        if (typeof fetchAuditLogs === 'function') fetchAuditLogs();
    } catch (e) {
        console.error("Fehler beim Vorbereiten der Admin-Ansichten:", e);
    }
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Admin Kontrollzentrum (Cloud-Schutz bei lokalen Projekten)
 * ERSETZEN IN: ui.js (Funktionen renderAdminProjectList & handleDeleteProject)
 * Zeitstempel: 2026-08-31 18:05:00 CEST
 * Breadcrumbs:
 *   - [2026-08-28 20:55:00 CEST]: Initiale Projektliste & Löschlogik.
 *   - [2026-08-31 18:05:00 CEST]: Strikte Isolation: In lokalen Projekten werden
 *     Cloud-Projekte in der Admin-Liste ausgeblendet und vor dem Löschen geschützt.
 * =============================================================================
 */
window.renderAdminProjectList = function () {
    const container = document.getElementById('projectListContainer');
    if (!container) return;
    container.innerHTML = '';

    const isLocalActive = !!(window.activeProjectId && window.activeProjectId.startsWith('local_'));

    // Wenn ein lokales Projekt aktiv ist, NUR lokale Projekte auflisten (Cloud-Projekte schützen)
    const projectsToShow = (currentProjects || []).filter(p => {
        if (p.is_archived) return false;
        return isLocalActive ? p.is_local : true;
    });

    if (projectsToShow.length === 0) {
        container.innerHTML = `<div style="font-size:11px; color:#718096; padding:6px 0;">Keine ${isLocalActive ? 'lokalen ' : ''}Projekte vorhanden.</div>`;
        return;
    }

    projectsToShow.forEach(p => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; font-size:11px; padding:5px 6px; border-bottom:1px solid #edf2f7;';

        const badge = p.is_local
            ? '<span style="background:#4a5568; color:#fff; padding:1px 4px; border-radius:3px; font-size:9px; margin-right:4px;">LOKAL</span>'
            : '<span style="background:#2b6cb0; color:#fff; padding:1px 4px; border-radius:3px; font-size:9px; margin-right:4px;">CLOUD</span>';

        row.innerHTML = `
      <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:8px;">
        ${badge}<strong>${escapeHtml(p.object_number)}</strong> – ${escapeHtml(p.name)} 
        <span style="color:#718096; margin-left:6px;">[CAD: ${p.total_budget_design}h | Zeichn: ${p.total_budget_drafting}h]</span>
      </span>
      <div style="display:flex; gap:6px; align-items:center; flex-shrink:0;">
        <button type="button" class="btn-sec" style="padding:2px 6px; font-size:10px;" onclick="startEditProject('${p.id}')">✏️ Edit</button>
        ${!p.is_local ? `<button type="button" class="btn-sec" style="padding:2px 6px; font-size:10px; color:#c05621;" onclick="archiveProject('${p.id}', true)">🗄️ Archivieren</button>` : ''}
        <span style="color:#e53e3e; cursor:pointer; font-weight:bold; font-size:13px;" title="${p.is_local ? 'Aus lokalem Browser-Speicher entfernen' : 'Projekt komplett löschen'}" onclick="handleDeleteProject('${p.id}')">✕</span>
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

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Projekt- und Budgetverwaltung)
 * ERSETZEN IN: ui.js (Funktion handleSaveProject)
 * Zeitstempel: 2026-09-01 17:40:00 CEST
 * Breadcrumbs:
 *   - [2026-08-31 18:05:00 CEST]: Audit-Protokollierung bei Budgetänderungen.
 *   - [2026-09-01 17:40:00 CEST]: Sofortige Synchronisation von Sidebar-Statistiken 
 *     und Canvas nach Projekt- und Budgetanpassungen.
 * =============================================================================
 */
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
    await fetchProjects();
    if (typeof fetchCanvasData === 'function') await fetchCanvasData();
    if (typeof updateSidebarStats === 'function') updateSidebarStats();
    if (typeof fetchAuditLogs === 'function') fetchAuditLogs();
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

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Projektverwaltung (Admin)
 * ERSETZEN IN: ui.js (Funktion handleDeleteProject)
 * Zeitstempel: 2026-08-28 20:55:00 CEST
 * Breadcrumbs:
 *   - [2026-08-28]: fetchProjects() und fetchCanvasData() nach Löschen ergänzt.
 * =============================================================================
 */
window.handleDeleteProject = async function (projectId) {
    const isLocalActive = !!(window.activeProjectId && window.activeProjectId.startsWith('local_'));
    const isTargetLocal = projectId.startsWith('local_');

    // Schutz: Aus einem lokalen Projekt heraus dürfen keine Cloud-Projekte gelöscht werden
    if (isLocalActive && !isTargetLocal) {
        showToast('Aus einem lokalen Projekt heraus können keine Cloud-Projekte gelöscht werden.', 'error');
        return;
    }

    if (currentProjects.length <= 1) {
        showToast('Das letzte verbleibende Projekt kann nicht gelöscht werden.', 'error');
        return;
    }

    const confirmMsg = isTargetLocal
        ? 'Möchtest du dieses lokale Projekt aus dem Browser-Speicher entfernen?'
        : 'Möchtest du dieses Cloud-Projekt und alle zugehörigen Daten unwiderruflich löschen?';

    const confirmed = await customConfirm('Projekt löschen', confirmMsg);
    if (confirmed) {
        await db.from('projects').delete().eq('id', projectId);

        if (activeProjectId === projectId) {
            activeProjectId = currentProjects.find(p => p.id !== projectId)?.id || currentProjects[0].id;
            localStorage.setItem('cad_tm_project', activeProjectId);
        }

        showToast(isTargetLocal ? 'Lokales Projekt entfernt' : 'Cloud-Projekt gelöscht', 'success');
        if (typeof fetchProjects === 'function') await fetchProjects();
        if (typeof fetchCanvasData === 'function') fetchCanvasData();
        if (typeof fetchAuditLogs === 'function') fetchAuditLogs();
    }
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Admin Freigaben-Tabelle Layout-Fix)
 * ERSETZEN IN: ui.js (Funktion renderPendingLogsTable)
 * Zeitstempel: 2026-08-31 17:45:00 CEST
 * Breadcrumbs:
 *   - [2026-08-28 20:55:00 CEST]: Zonen-Logs und Freigabe-Aktionen.
 *   - [2026-08-31 17:45:00 CEST]: white-space: nowrap auf der Zeit- und Kategoriezelle
 *     ergänzt, um Zeilenumbrüche bei '6h 00m' zu verhindern.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Admin Freigaben-Tabelle Icon-Harmonisierung)
 * ERSETZEN IN: ui.js (Funktion renderPendingLogsTable)
 * Zeitstempel: 2026-08-31 18:20:00 CEST
 * Breadcrumbs:
 *   - [2026-08-31 17:45:00 CEST]: white-space: nowrap Layout-Fix.
 *   - [2026-08-31 18:20:00 CEST]: Zonen-Icon dynamisch anhand CAD_ICONS gerendert.
 * =============================================================================
 */
window.renderPendingLogsTable = function () {
    const container = document.getElementById('pendingLogsTableContainer');
    if (!container) return;

    const pendingLogs = (currentTimeLogs || []).filter(l => l.status === 'pending');

    if (pendingLogs.length === 0) {
        container.innerHTML = '<div style="font-size:12px; color:#718096; padding:10px 0;">Keine ausstehenden Freigaben im aktuellen Projekt.</div>';
        return;
    }

    let html = `
    <table class="log-table">
      <thead>
        <tr>
          <th style="width: 45px;">Kürzel</th>
          <th>Ort (Block/Rahmen)</th>
          <th style="width: 60px;">Kat.</th>
          <th style="width: 85px; white-space: nowrap;">Zeit</th>
          <th>Kommentar</th>
          <th style="width: 80px; text-align: right;">Aktion</th>
        </tr>
      </thead>
      <tbody>
  `;

    pendingLogs.forEach(log => {
        let nodeName = 'Unbekannt';
        const node = currentNodes.find(n => n.id === log.node_id);
        if (node) {
            const icon = node.block_type === 'part' ? (window.CAD_ICONS ? CAD_ICONS.part : '⚙️') : (window.CAD_ICONS ? CAD_ICONS.assembly : '📦');
            nodeName = `${icon} ${node.name}`;
        } else {
            const zone = currentZones.find(z => z.id === log.zone_id || z.id === log.node_id);
            if (zone) {
                let zIcon = window.CAD_ICONS ? CAD_ICONS.location : '📍';
                if (zone.zone_type === 'assembly') zIcon = window.CAD_ICONS ? CAD_ICONS.assembly : '📦';
                else if (zone.zone_type === 'container') zIcon = window.CAD_ICONS ? CAD_ICONS.container : '⬚';
                nodeName = `${zIcon} ${zone.title}`;
            }
        }

        let kat = log.task_type === 'design' ? 'CAD' : (log.task_type === 'drafting' ? 'Zeichn.' : 'Status');

        let timeFormatted = formatHoursToHM(log.hours);
        if (log.task_type === 'completion') {
            kat = 'Status';
            timeFormatted = log.note && (log.note.includes('Revision') || log.note.includes('Ablehnen')) ? '↺' : '✔';
        }

        html += `
      <tr>
        <td><strong>${escapeHtml(log.user_code)}</strong></td>
        <td><span style="display:inline-flex; align-items:center; gap:4px;">${nodeName}</span></td>
        <td style="white-space: nowrap;">${kat}</td>
        <td style="white-space: nowrap;"><span style="color:#38a169; font-weight:bold;">${timeFormatted}</span></td>
        <td style="color:#718096; font-style:italic;">${escapeHtml(log.note || '-')}</td>
        <td style="text-align: right;">
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
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Exklusives Log-Ausklappen für Zonen)
 * ERSETZEN IN: ui.js (Funktion toggleZoneLogs)
 * Zeitstempel: 2026-08-27 17:50:00 CEST
 * Breadcrumbs:
 *   - [2026-08-24 20:20:00 CEST]: Zonen-Logs Toggle.
 *   - [2026-08-27 17:50:00 CEST]: Single-Expanded-Log Prinzip: Nur ein Element
 *     (Block oder Zone) darf gleichzeitig ausgeklappt sein.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Exklusives Log-Ausklappen für Zonen)
 * ERSETZEN IN: ui.js (Funktion toggleZoneLogs)
 * Zeitstempel: 2026-08-29 20:46:00 CEST
 * Breadcrumbs:
 *   - [2026-08-27 17:50:00 CEST]: Single-Expanded-Log Prinzip.
 *   - [2026-08-29 20:46:00 CEST]: Direkter Aufruf von renderCanvas() statt 
 *     asynchronem fetchCanvasData(), um sofortiges Öffnen/Schließen zu gewährleisten.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Exklusives Log-Ausklappen für Zonen)
 * ERSETZEN IN: ui.js (Funktion toggleZoneLogs)
 * Zeitstempel: 2026-08-29 20:53:00 CEST
 * Breadcrumbs:
 *   - [2026-08-29 20:53:00 CEST]: stopImmediatePropagation ergänzt, um 
 *     Event-Bubbling zuverlässig zu stoppen und sofort neu zu zeichnen.
 * =============================================================================
 */
window.toggleZoneLogs = function (e, zoneId) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    }
    if (!window.expandedZones) window.expandedZones = new Set();
    if (!window.expandedNodes) window.expandedNodes = new Set();

    const isCurrentlyOpen = window.expandedZones.has(zoneId);

    window.expandedZones.clear();
    window.expandedNodes.clear();

    if (!isCurrentlyOpen) {
        window.expandedZones.add(zoneId);
    }

    if (typeof renderCanvas === 'function') renderCanvas();
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Zonen-Logs)
 * Breadcrumb: [2026-08-24 20:25:00 CEST] Foreign-Key Error behoben (node_id: null)
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Zonen-Logs & Schema-Fix)
 * ERSETZEN IN: ui.js (Funktion handleZoneLog)
 * Zeitstempel: 2026-08-27 17:40:00 CEST
 * Breadcrumbs:
 *   - [2026-08-24 20:25:00 CEST]: Foreign-Key Error behoben (node_id: null).
 *   - [2026-08-27 17:40:00 CEST]: Abgesichertes Payload-Handling für zone_id
 *     und verständliche Fehlerbehandlung bei fehlender Schema-Spalte.
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
    const finalStatus = isAdmin ? 'approved' : 'pending';

    const payload = {
        project_id: activeProjectId,
        user_code: activeUserCode,
        task_type: taskType,
        hours: decimalHours,
        note: note,
        status: finalStatus,
        zone_id: zoneId,
        node_id: null
    };

    const { error } = await db.from('time_logs').insert([payload]);

    if (error) {
        console.error("Fehler beim Buchen auf Rahmen:", error);
        if (error.message && error.message.includes("column of 'time_logs'")) {
            showToast('Datenbankfehler: Spalte zone_id fehlt in time_logs.', 'error');
        } else {
            showToast('Fehler: ' + error.message, 'error');
        }
        return;
    }

    form.elements[2].value = '0';
    form.elements[3].value = '30';
    form.elements[4].value = '';

    if (isAdmin) {
        showToast(`${hours}h ${mins}m für Kasten direkt verbucht`, 'success');
    } else {
        showToast(`${hours}h ${mins}m für Kasten erfasst (wartet auf Freigabe)`, 'success');
    }

    if (typeof fetchCanvasData === 'function') fetchCanvasData();
};

/**
* =============================================================================
* Breadcrumb: [2026-08-25 17:35:00 CEST] Sticky Notes Logic 
* Verwendet 'project_nodes' mit block_type='note' und article_number='public/private'
* =============================================================================
*/

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Sticky Notes & To-Do Logik)
 * ERSETZEN IN: ui.js (Abschnitt Sticky Notes)
 * Zeitstempel: 2026-08-27 20:00:00 CEST
 * Breadcrumbs:
 *   - [2026-08-25 17:35:00 CEST]: Initiale Sticky Notes Logik.
 *   - [2026-08-27 20:00:00 CEST]: Notiz / To-Do Umschaltung, JSON-Payload-Parser, 
 *     Checklisten-Verwaltung und Direkt-Checkbox-Toggle am Canvas.
 * =============================================================================
 */

const NOTE_COLORS = [
    { name: 'Gelb', hex: '#fefcbf' },
    { name: 'Blau', hex: '#bee3f8' },
    { name: 'Grün', hex: '#c6f6d5' },
    { name: 'Pink', hex: '#fed7e2' },
    { name: 'Grau', hex: '#edf2f7' }
];

window.parseNotePayload = function (payloadStr) {
    if (!payloadStr) return { text: '', dueDate: null, items: [] };
    try {
        if (payloadStr.startsWith('{') && payloadStr.endsWith('}')) {
            return JSON.parse(payloadStr);
        }
    } catch (e) {
        // Fallback für reguläre Textnotizen
    }
    return { text: payloadStr, dueDate: null, items: [] };
};

window.renderNoteColorPresets = function (containerId, inputId, defaultColor) {
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

window.toggleNoteTypeFields = function (mode) {
    const isTodo = document.querySelector(`input[name="${mode}NoteType"]:checked`).value === 'TODO';
    const todoCont = document.getElementById(`${mode}NoteTodoContainer`);
    const label = document.getElementById(`${mode}NoteTextLabel`);

    if (todoCont) todoCont.style.display = isTodo ? 'block' : 'none';
    if (label) label.textContent = isTodo ? 'Aufgabe / Beschreibung:' : 'Notiz-Text:';
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Checklisten-Layout & Benutzerzuweisung für To-Dos)
 * ERSETZEN IN: ui.js (Funktionen addChecklistItem, handleOpenAddNoteModal, handleAddNote, openEditNoteModal, handleSaveNote)
 * Zeitstempel: 2026-08-27 20:30:00 CEST
 * Breadcrumbs:
 *   - [2026-08-27 20:30:00 CEST]: Saubere DOM-Generierung der Checklisten-Zeile
 *     ohne Umbruch und Befüllung/Speicherung von assigned_design_user.
 * =============================================================================
 */
window.addChecklistItem = function (mode, text = '', done = false) {
    const container = document.getElementById(`${mode}NoteChecklistItems`);
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'modal-checklist-row';
    row.innerHTML = `
        <input type="checkbox" ${done ? 'checked' : ''} />
        <input type="text" placeholder="Unterpunkt..." value="${escapeHtml(text)}" />
        <span class="btn-del-item" title="Punkt entfernen" onclick="this.parentElement.remove()">✕</span>
    `;
    container.appendChild(row);
};

window.populateUserDropdown = function (selectEl, selectedVal = '') {
    if (!selectEl) return;
    selectEl.innerHTML = '<option value="">-- Offen --</option>';
    (currentUsers || []).forEach(u => selectEl.add(new Option(u.code, u.code)));
    selectEl.value = selectedVal || '';
};


window.handleOpenAddNoteModal = function (x, y) {
    document.getElementById('newNoteCustomPos').value = JSON.stringify({ x, y });
    document.getElementById('newNoteForm').reset();
    document.getElementById('newNoteChecklistItems').innerHTML = '';

    populateUserDropdown(document.getElementById('newNoteAssignedUser'), activeUserCode);

    const defaultRadio = document.querySelector('input[name="newNoteType"][value="NOTE"]');
    if (defaultRadio) defaultRadio.checked = true;
    toggleNoteTypeFields('new');

    renderNoteColorPresets('newNoteColorPresets', 'newNoteColor', '#fefcbf');
    openModal('newNoteModal');
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Sticky Notes & Automatische Zonen-Zuweisung)
 * ERSETZEN IN: ui.js (Funktion handleAddNote)
 * Zeitstempel: 2026-08-28 23:58:00 CEST
 * Breadcrumbs:
 *   - [2026-08-27 20:30:00 CEST]: Checklisten & To-Dos.
 *   - [2026-08-28 23:58:00 CEST]: Automatische Ermittlung von targetZoneId 
 *     beim Erstellen einer Notiz (getDeepestZoneAt) ergänzt, damit Notizen 
 *     beim Ausblenden/Isolieren von Rahmen korrekt mit ausgeblendet werden.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Sticky Notes & Automatische Zonen-Zuweisung)
 * ERSETZEN IN: ui.js (Funktion handleAddNote)
 * Zeitstempel: 2026-08-29 00:30:00 CEST
 * Breadcrumb: Automatische Ermittlung von targetZoneId beim Erstellen einer Notiz,
 * damit Notizen beim Ausblenden/Isolieren von Rahmen korrekt mit verschwinden.
 * =============================================================================
 */
window.handleAddNote = async function (e) {
    if (e) e.preventDefault();
    const noteType = document.querySelector('input[name="newNoteType"]:checked').value;
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

    if (!text && noteType === 'NOTE') {
        showToast('Bitte Notiztext eingeben.', 'error');
        return;
    }

    const checklistItems = [];
    if (noteType === 'TODO') {
        document.querySelectorAll('#newNoteChecklistItems .modal-checklist-row').forEach(row => {
            const itemText = row.querySelector('input[type="text"]').value.trim();
            const isDone = row.querySelector('input[type="checkbox"]').checked;
            if (itemText) checklistItems.push({ text: itemText, done: isDone });
        });
    }

    const dueDate = (noteType === 'TODO') ? (document.getElementById('newNoteDueDate').value || null) : null;
    const assignedUser = (noteType === 'TODO') ? (document.getElementById('newNoteAssignedUser').value || null) : null;

    const payload = JSON.stringify({
        text,
        dueDate,
        items: checklistItems
    });

    // NEU: Automatische Zuweisung der Notiz an den Kasten/Rahmen an diesen Koordinaten
    const targetZone = (typeof getDeepestZoneAt === 'function')
        ? getDeepestZoneAt(posX + 100, posY + 50)
        : null;
    const targetZoneId = targetZone ? targetZone.id : null;

    const { error } = await db.from('project_nodes').insert([{
        project_id: activeProjectId,
        name: payload,
        doc_number: noteType,
        block_type: 'note',
        article_number: visibility,
        assigned_design_user: assignedUser,
        budget_design_hours: noteType === 'TODO' ? 240 : 190,
        budget_drafting_hours: noteType === 'TODO' ? 140 : 80,
        completion_status: 'open',
        color_hex: color,
        created_by: activeUserCode || 'COT',
        pos_x: posX,
        pos_y: posY,
        zone_id: targetZoneId // <--- Verknüpft die Notiz mit dem Rahmen
    }]);

    if (error) {
        console.error("Fehler beim Speichern der Notiz:", error);
        showToast('Fehler beim Anheften: ' + error.message, 'error');
        return;
    }

    closeModal('newNoteModal');
    showToast(noteType === 'TODO' ? 'To-Do Liste angeheftet' : 'Notiz angeheftet', 'success');
    if (typeof fetchCanvasData === 'function') fetchCanvasData();
};

window.openEditNoteModal = function (nodeId) {
    const node = currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    const noteType = node.doc_number === 'TODO' ? 'TODO' : 'NOTE';
    const noteData = parseNotePayload(node.name);

    document.getElementById('editNoteId').value = node.id;
    document.getElementById('editNoteText').value = noteData.text || '';
    document.getElementById('editNoteVisibility').value = node.article_number || 'public';

    populateUserDropdown(document.getElementById('editNoteAssignedUser'), node.assigned_design_user);

    const radio = document.querySelector(`input[name="editNoteType"][value="${noteType}"]`);
    if (radio) radio.checked = true;
    toggleNoteTypeFields('edit');

    const dueInput = document.getElementById('editNoteDueDate');
    if (dueInput) dueInput.value = noteData.dueDate || '';

    const checkCont = document.getElementById('editNoteChecklistItems');
    checkCont.innerHTML = '';
    if (noteData.items && noteData.items.length > 0) {
        noteData.items.forEach(item => addChecklistItem('edit', item.text, item.done));
    }

    renderNoteColorPresets('editNoteColorPresets', 'editNoteColor', node.color_hex || '#fefcbf');
    openModal('editNoteModal');
};

window.handleSaveNote = async function (e) {
    e.preventDefault();
    const id = document.getElementById('editNoteId').value;
    const noteType = document.querySelector('input[name="editNoteType"]:checked').value;
    const text = document.getElementById('editNoteText').value.trim();
    const visibility = document.getElementById('editNoteVisibility').value;
    const color = document.getElementById('editNoteColor').value;

    const checklistItems = [];
    if (noteType === 'TODO') {
        document.querySelectorAll('#editNoteChecklistItems .modal-checklist-row').forEach(row => {
            const itemText = row.querySelector('input[type="text"]').value.trim();
            const isDone = row.querySelector('input[type="checkbox"]').checked;
            if (itemText) checklistItems.push({ text: itemText, done: isDone });
        });
    }

    const dueDate = (noteType === 'TODO') ? (document.getElementById('editNoteDueDate').value || null) : null;
    const assignedUser = (noteType === 'TODO') ? (document.getElementById('editNoteAssignedUser').value || null) : null;

    const payload = JSON.stringify({
        text,
        dueDate,
        items: checklistItems
    });

    await db.from('project_nodes').update({
        name: payload,
        doc_number: noteType,
        article_number: visibility,
        assigned_design_user: assignedUser,
        color_hex: color
    }).eq('id', id);

    closeModal('editNoteModal');
    showToast('Aktualisiert', 'success');
    if (typeof fetchCanvasData === 'function') fetchCanvasData();
};

window.handleToggleTodoItem = async function (e, nodeId, itemIndex) {
    e.stopPropagation();
    const node = currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    const noteData = parseNotePayload(node.name);
    if (!noteData.items || !noteData.items[itemIndex]) return;

    noteData.items[itemIndex].done = e.target.checked;
    node.name = JSON.stringify(noteData);

    if (typeof renderCanvas === 'function') renderCanvas();

    await db.from('project_nodes').update({ name: node.name }).eq('id', nodeId);
};

window.handleDeleteNote = async function (e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    const id = document.getElementById('editNoteId').value;
    if (!id) return;

    const confirmed = await customConfirm('Löschen', 'Möchtest du diese Notiz / To-Do wirklich entfernen?');
    if (confirmed) {
        const { error } = await db.from('project_nodes').delete().eq('id', id);
        if (error) {
            showToast('Fehler beim Löschen: ' + error.message, 'error');
            return;
        }

        closeModal('editNoteModal');
        showToast('Entfernt', 'success');

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
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Mobile Touch-Wheel Zeiterfassung)
 * ERSETZEN IN: ui.js (Ab Abschnitt 9 bis Dateiende)
 * Zeitstempel: 2026-08-30 12:40:00 CEST
 * Breadcrumbs:
 *   - [2026-08-25]: Wisch-Gesten auf Stunden/Minuten-Feldern ergänzt.
 *   - [2026-08-30 12:40:00 CEST]: Reihenfolge bereinigt: Event-Listener 
 *     direkt unter endTimeSwipe platziert, Druck-Engine sauber als finaler Block angehängt.
 * =============================================================================
 */

// =============================================================================
// 9. MOBILE TOUCH-WHEEL (Zeiterfassung durch Wischen)
// =============================================================================
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
        window.isDraggingAnything = true;
    }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (timeSwipeInput && e.touches.length === 1) {
        if (e.cancelable) e.preventDefault();

        const currentY = e.touches[0].clientY;
        const diff = timeSwipeStartY - currentY;
        const steps = Math.trunc(diff / 15);

        let stepValue = (timeSwipeType === 'hour') ? 1 : 5;
        let newVal = timeSwipeStartVal + (steps * stepValue);

        if (newVal < 0) newVal = 0;
        if (timeSwipeType === 'min' && newVal > 55) newVal = 55;

        timeSwipeInput.value = (timeSwipeType === 'min') ? newVal.toString().padStart(2, '0') : newVal;
    }
}, { passive: false });

const endTimeSwipe = () => {
    if (timeSwipeInput) {
        window.isDraggingAnything = false;
        timeSwipeInput = null;
    }
};

document.addEventListener('touchend', endTimeSwipe);
document.addEventListener('touchcancel', endTimeSwipe);

// =============================================================================
// 10. DRUCK-CONTROLLER (A4-A0 Canvas Skalierung, DIN-Schriftkopf & Multi-Page Tree)
// =============================================================================

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Druck-Controller (Dynamische Großformat-Einpassung A4 bis A0)
 * ERSETZEN IN: ui.js (Funktion renderCanvasPrintSheet)
 * Zeitstempel: 2026-08-30 12:50:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 12:35:00 CEST]: Initiale A-Formate.
 *   - [2026-08-30 12:50:00 CEST]: 1. Feste 3000px Canvas-Grenze entfernt (dynamisch auf targetW/targetH).
 *     2. Proportionale Schriftkopf- und Ränder-Kompensation für A1 und A0 integriert.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Druck-Controller (Präzise mm-Einpassung & fixes DIN-Schriftfeld)
 * ERSETZEN IN: ui.js (Funktion renderCanvasPrintSheet)
 * Zeitstempel: 2026-08-30 13:00:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 12:50:00 CEST]: Großformat-Einpassung.
 *   - [2026-08-30 13:00:00 CEST]: 1. Umstellung auf millimeter-basierte Berechnung 
 *     für A4 bis A0. 2. Schriftfeld bleibt über alle Formate exakt 185mm x 35mm.
 *     3. Exakte Zentrierung im verfügbaren Bereich oberhalb/neben dem Plankopf.
 * =============================================================================
 */

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Druck-Controller & Großformat-Einpassung (A4 bis A0)
 * ERSETZEN IN: ui.js (Abschnitt 10 bis Dateiende)
 * Zeitstempel: 2026-08-30 13:45:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 13:00:00 CEST]: Millimeter-Berechnung.
 *   - [2026-08-30 13:45:00 CEST]: 1. Virtuelle 96-DPI Druck-Auflösung für echte Großformat-
 *     Einpassung (A4–A0). 2. Dateinamen nach Schema 'OBJnr_Projektname_Modus_Datum' implementiert.
 * =============================================================================
 */

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Druck-Controller & Großformat-Einpassung (A4 bis A0)
 * ERSETZEN IN: ui.js (Abschnitt 10 bis Dateiende)
 * Zeitstempel: 2026-08-30 13:45:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 13:00:00 CEST]: Millimeter-Berechnung.
 *   - [2026-08-30 13:45:00 CEST]: 1. Ghost-Overlay Bug behoben (Ausblenden für Screen 
 *     via CSS & afterprint Cleanup). 2. Canvas-Dimensionen für Klon erweitert (verhindert SVG-Cutoffs).
 *     3. Dateinamen nach Schema 'OBJnr_Projektname_Modus_Datum' implementiert.
 * =============================================================================
 */

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Druck-Controller & Großformat-Einpassung (A4 bis A0)
 * ERSETZEN IN: ui.js (Abschnitt 10 bis Dateiende)
 * Zeitstempel: 2026-08-30 14:15:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 13:45:00 CEST]: Ghost-Overlay Bug behoben.
 *   - [2026-08-30 14:15:00 CEST]: 1. Formate A2-A0 repariert (Browser-Fallback auf A4 
 *     verhindert, indem harte mm-Werte im @page CSS gesetzt werden). 
 *     2. Rahmen im Druckmenü analog zur Sidebar sortiert (sort_order & Fläche).
 * =============================================================================
 */

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Druck-Controller & Strukturbaum-Engine (Reine sort_order Sortierung & Bereinigung)
 * ERSETZEN IN: ui.js (Abschnitt 10 bis Dateiende)
 * Zeitstempel: 2026-08-30 22:25:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 22:05:00 CEST]: Flächen-Fallback entfernt.
 *   - [2026-08-30 22:25:00 CEST]: 1. calcTreeStats filtert Notizen strikt aus dem Rollup aus.
 *     2. rootNodesInZone nach Canvas-Position (pos_y/pos_x) sortiert.
 *     3. Fertigmelde-Buttons aus dem Canvas-Druck entfernt (nur ✅ Erledigt bleibt stehen).
 * =============================================================================
 */

// =============================================================================
// 10. DRUCK-CONTROLLER (A4-A0 Canvas Skalierung, DIN-Schriftkopf & Multi-Page Tree)
// =============================================================================
window.openPrintModal = function () {
    renderPrintZoneToggles();
    openModal('printModal');
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Druck-Controller (Container-Icon Anpassung)
 * ERSETZEN IN: ui.js (Funktionen renderPrintZoneToggles & renderStructurePrintSheet)
 * Zeitstempel: 2026-08-31 18:10:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 22:25:00 CEST]: Strukturbaum & Druck-Optionen.
 *   - [2026-08-31 18:10:00 CEST]: Icon-Weiche um 'container' (⬚) erweitert.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Druck-Controller (Globale CAD-Icons für Zonen-Auswahl)
 * ERSETZEN IN: ui.js (Funktion renderPrintZoneToggles)
 * Zeitstempel: 2026-08-31 18:20:00 CEST
 * Breadcrumbs:
 *   - [2026-08-31 18:10:00 CEST]: Container-Icon.
 *   - [2026-08-31 18:20:00 CEST]: Vereinheitlichung auf window.CAD_ICONS.
 * =============================================================================
 */
window.renderPrintZoneToggles = function () {
    const container = document.getElementById('printZoneTogglesContainer');
    if (!container) return;
    container.innerHTML = '';

    const sortZonesByOrder = (zones) => {
        return [...zones].sort((a, b) => {
            const ordA = (a.sort_order !== null && a.sort_order !== undefined) ? a.sort_order : 9999;
            const ordB = (b.sort_order !== null && b.sort_order !== undefined) ? b.sort_order : 9999;
            return ordA - ordB;
        });
    };

    const topZones = sortZonesByOrder((currentZones || []).filter(z => !z.parent_zone_id));

    if (topZones.length === 0) {
        container.innerHTML = '<div style="color:#718096; font-style:italic;">Keine Rahmen vorhanden.</div>';
        return;
    }

    topZones.forEach(z => {
        const isHidden = window.isZoneHidden(z.id);

        let zIcon = window.CAD_ICONS ? CAD_ICONS.location : '📍';
        if (z.zone_type === 'assembly') zIcon = window.CAD_ICONS ? CAD_ICONS.assembly : '📦';
        else if (z.zone_type === 'comment') zIcon = window.CAD_ICONS ? CAD_ICONS.comment : '💬';
        else if (z.zone_type === 'container') zIcon = window.CAD_ICONS ? CAD_ICONS.container : '⬚';

        container.innerHTML += `
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" onchange="window.toggleZoneVisibility('${z.id}')" ${!isHidden ? 'checked' : ''} style="width: auto;" />
                <span style="display: inline-flex; align-items: center; gap: 4px;">${zIcon} ${escapeHtml(z.title)}</span>
            </label>
        `;
    });
};
window.handlePrintModeChange = function () {
    const mode = document.querySelector('input[name="printMode"]:checked').value;
    const canvasOpts = document.getElementById('printCanvasOptions');
    const structOpts = document.getElementById('printStructureOptions');

    if (mode === 'canvas') {
        if (canvasOpts) canvasOpts.style.display = 'block';
        if (structOpts) structOpts.style.display = 'none';
    } else {
        if (canvasOpts) canvasOpts.style.display = 'none';
        if (structOpts) structOpts.style.display = 'block';
    }
};

function applyPrintPageStyle(mode, paperSize = 'A4', customTitle = '') {
    let styleTag = document.getElementById('dynamic-print-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-print-style';
        document.head.appendChild(styleTag);
    }

    const dims = {
        'A4': { w: 297, h: 210 },
        'A3': { w: 420, h: 297 },
        'A2': { w: 594, h: 420 },
        'A1': { w: 841, h: 594 },
        'A0': { w: 1189, h: 841 }
    };
    const dim = dims[paperSize] || dims['A4'];

    let css = `@media screen { #print-render-container { display: none !important; } }\n`;

    if (mode === 'canvas') {
        css += `@media print { @page { size: ${dim.w}mm ${dim.h}mm; margin: 0; } }\n`;
        css += `@media print { html, body { width: ${dim.w}mm; height: ${dim.h}mm; overflow: hidden; margin: 0; padding: 0; } }`;
    } else {
        css += `@media print { @page { size: A4 portrait; margin: 15mm; } }`;
    }

    styleTag.innerHTML = css;

    if (customTitle) {
        document.title = customTitle;
    }
}

window.executePrintJob = function () {
    const mode = document.querySelector('input[name="printMode"]:checked').value;
    const proj = getCurrentProject();

    let printCont = document.getElementById('print-render-container');
    if (printCont) printCont.remove();

    printCont = document.createElement('div');
    printCont.id = 'print-render-container';
    document.body.appendChild(printCont);

    let paperSize = 'A4';
    if (mode === 'canvas') paperSize = document.getElementById('printPaperSize').value;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const safeObj = (proj.object_number || 'OBJ').replace(/[^a-zA-Z0-9\-_]/g, '');
    const safeName = (proj.name || 'Projekt').replace(/[^a-zA-Z0-9\-_ÄÖÜäöü]/g, '_');
    const modeName = mode === 'canvas' ? 'Canvas' : 'Strukturbaum';
    const exportFileName = `${safeObj}_${safeName}_${modeName}_${dateStr}`;

    applyPrintPageStyle(mode, paperSize, exportFileName);

    if (mode === 'canvas') {
        const includeNotes = document.getElementById('printOptNotes').checked;
        const includeCharts = document.getElementById('printOptCharts').checked;
        renderCanvasPrintSheet(printCont, proj, includeNotes, includeCharts, paperSize);
    } else {
        const showTimes = document.getElementById('printStructShowTimes').checked;
        renderStructurePrintSheet(printCont, proj, showTimes);
    }

    closeModal('printModal');

    window.addEventListener('afterprint', function cleanup() {
        const pc = document.getElementById('print-render-container');
        if (pc) pc.remove();
        document.title = "CAD Time Manager";
        window.removeEventListener('afterprint', cleanup);
    });

    setTimeout(() => {
        window.print();
    }, 400);
};

function renderCanvasPrintSheet(container, proj, includeNotes, includeCharts, paperSize) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasElements = false;

    const expandBBox = (x, y, w, h) => {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x + w > maxX) maxX = x + w;
        if (y + h > maxY) maxY = y + h;
        hasElements = true;
    };

    const visibleZones = (currentZones || []).filter(z => !window.isZoneHidden(z.id));
    visibleZones.forEach(z => {
        expandBBox(parseFloat(z.pos_x) || 0, parseFloat(z.pos_y) || 0, parseFloat(z.width) || 400, parseFloat(z.height) || 300);
    });

    const visibleNodes = (currentNodes || []).filter(n => {
        if (n.block_type === 'note' || n.doc_number === 'NOTE' || n.doc_number === 'TODO') {
            return includeNotes && !(n.zone_id && window.isZoneHidden(n.zone_id));
        }
        return !(n.zone_id && window.isZoneHidden(n.zone_id));
    });

    visibleNodes.forEach(n => {
        const isNote = n.block_type === 'note' || n.doc_number === 'NOTE' || n.doc_number === 'TODO';
        const w = isNote ? (parseFloat(n.budget_design_hours) || 220) : 320;
        const h = isNote ? (parseFloat(n.budget_drafting_hours) || 120) : 200;
        expandBBox(parseFloat(n.pos_x) || 0, parseFloat(n.pos_y) || 0, w, h);
    });

    if (!hasElements) {
        minX = 0; minY = 0; maxX = 1200; maxY = 800;
    }

    const mmDimensions = {
        'A4': { width: 297, height: 210 },
        'A3': { width: 420, height: 297 },
        'A2': { width: 594, height: 420 },
        'A1': { width: 841, height: 594 },
        'A0': { width: 1189, height: 841 }
    };

    const sheetMm = mmDimensions[paperSize] || mmDimensions['A4'];
    const marginMm = 15;
    const titleBlockHeightMm = 38;

    const availWidthMm = sheetMm.width - (marginMm * 2);
    const availHeightMm = sheetMm.height - (marginMm * 2) - titleBlockHeightMm;

    const mmToPx = 3.7795275591;
    const availWidthPx = availWidthMm * mmToPx;
    const availHeightPx = availHeightMm * mmToPx;

    const bboxWidthPx = Math.max(10, maxX - minX);
    const bboxHeightPx = Math.max(10, maxY - minY);

    const canvasClone = document.getElementById('canvas').cloneNode(true);
    canvasClone.id = 'print-canvas-clone';
    canvasClone.style.background = 'transparent';
    canvasClone.style.position = 'absolute';
    canvasClone.style.left = '0';
    canvasClone.style.top = '0';
    canvasClone.style.transformOrigin = '0 0';

    canvasClone.style.width = `${Math.max(3000, maxX + 500)}px`;
    canvasClone.style.height = `${Math.max(3000, maxY + 500)}px`;

    // Interaktive Elemente und Formulare entfernen
    canvasClone.querySelectorAll('.log-form, .inline-logs-container, .zone-body, .btn-expand-toggle, .btn-toggle-zone-times, .ep-handle, .zone-resize-handle, .note-resize-handle, .btn-tree-toggle, .zone-actions').forEach(el => el.remove());

    // Fertigmelde-Buttons sowie Wartend-/Revisions-Buttons beim Drucken bereinigen (nur ✅ Erledigt bleibt stehen)
    canvasClone.querySelectorAll('.assembly-card').forEach(card => {
        const node = currentNodes.find(n => n.id === card.id);
        const actionRow = card.querySelector('.assembly-body > div[style*="justify-content: space-between"]');
        if (actionRow) {
            if (node && node.completion_status === 'completed') {
                actionRow.innerHTML = `<span style="font-size: 10px; color: #38a169; font-weight: bold;">✅ Erledigt</span>`;
                actionRow.style.justifyContent = 'flex-end';
            } else {
                actionRow.remove();
            }
        }
    });

    if (!includeNotes) {
        canvasClone.querySelectorAll('.note-card').forEach(n => n.remove());
    }

    if (!includeCharts) {
        canvasClone.querySelectorAll('.charts-grid, .pie-chart, .chart-sub').forEach(c => c.style.display = 'none');
    }

    canvasClone.querySelectorAll('.project-zone').forEach(z => {
        z.style.border = '2px dashed ' + (z.style.borderColor || '#a0aec0');
        z.style.backgroundColor = 'transparent';
    });

    const sheetWrapper = document.createElement('div');
    sheetWrapper.className = 'cad-drawing-sheet';
    sheetWrapper.style.width = `${sheetMm.width}mm`;
    sheetWrapper.style.height = `${sheetMm.height}mm`;

    const viewportClipper = document.createElement('div');
    viewportClipper.style.position = 'absolute';
    viewportClipper.style.left = `${marginMm}mm`;
    viewportClipper.style.top = `${marginMm}mm`;
    viewportClipper.style.width = `${availWidthMm}mm`;
    viewportClipper.style.height = `${availHeightMm}mm`;
    viewportClipper.style.overflow = 'hidden';

    sheetWrapper.appendChild(viewportClipper);
    viewportClipper.appendChild(canvasClone);

    const today = new Date().toLocaleDateString('de-DE');
    const titleBlockHtml = `
        <div class="cad-drawing-border"></div>
        <div class="cad-title-block">
            <table class="cad-title-table">
                <tr>
                    <td colspan="3" style="font-size: 10pt; font-weight: 800; text-align: center; letter-spacing: 0.5px; padding: 1.5mm; background: #edf2f7;">CAD TIME MANAGER</td>
                </tr>
                <tr>
                    <td class="cad-tb-label" style="width: 25%;">Projekt / Objekt:</td>
                    <td colspan="2" class="cad-tb-val" style="font-size: 9pt;">${escapeHtml(proj.object_number)} – ${escapeHtml(proj.name)}</td>
                </tr>
                <tr>
                    <td class="cad-tb-label">Planart:</td>
                    <td class="cad-tb-val" style="width: 45%;">Canvas Layout (DIN ${paperSize})</td>
                    <td class="cad-tb-label" style="width: 30%;">Datum: <span class="cad-tb-val" style="float: right;">${today}</span></td>
                </tr>
                <tr>
                    <td class="cad-tb-label">Erstellt durch:</td>
                    <td class="cad-tb-val">${escapeHtml(activeUserCode || 'COT')}</td>
                    <td class="cad-tb-label">Format: <span class="cad-tb-val" style="float: right;">DIN ${paperSize}</span></td>
                </tr>
            </table>
        </div>
    `;

    sheetWrapper.insertAdjacentHTML('beforeend', titleBlockHtml);
    container.appendChild(sheetWrapper);

    const scale = Math.min(availWidthPx / bboxWidthPx, availHeightPx / bboxHeightPx);
    const scaledW = bboxWidthPx * scale;
    const scaledH = bboxHeightPx * scale;

    const offsetX = (availWidthPx - scaledW) / 2;
    const offsetY = (availHeightPx - scaledH) / 2;

    canvasClone.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale}) translate(${-minX}px, ${-minY}px)`;
}

function calcTreeStats() {
    const statsNodes = {};
    const statsZones = {};

    (currentNodes || []).forEach(n => {
        if (n.block_type === 'note' || n.doc_number === 'NOTE' || n.doc_number === 'TODO') return;
        statsNodes[n.id] = { budD: parseFloat(n.budget_design_hours) || 0, budDr: parseFloat(n.budget_drafting_hours) || 0, spentD: 0, spentDr: 0 };
    });
    (currentZones || []).forEach(z => {
        statsZones[z.id] = { budD: parseFloat(z.budget_design_hours) || 0, budDr: parseFloat(z.budget_drafting_hours) || 0, spentD: 0, spentDr: 0 };
    });

    (currentTimeLogs || []).forEach(l => {
        const hrs = parseFloat(l.hours) || 0;
        if (l.node_id && statsNodes[l.node_id]) {
            if (l.task_type === 'design') statsNodes[l.node_id].spentD += hrs;
            if (l.task_type === 'drafting') statsNodes[l.node_id].spentDr += hrs;
        } else if (l.zone_id && statsZones[l.zone_id]) {
            if (l.task_type === 'design') statsZones[l.zone_id].spentD += hrs;
            if (l.task_type === 'drafting') statsZones[l.zone_id].spentDr += hrs;
        }
    });

    const nodeChildren = {};
    (currentEdges || []).forEach(e => {
        if (!nodeChildren[e.source]) nodeChildren[e.source] = [];
        nodeChildren[e.source].push(e.target);
    });

    function rollupNode(nId, visited = new Set()) {
        if (visited.has(nId)) return statsNodes[nId];
        visited.add(nId);
        const st = statsNodes[nId] || { budD: 0, budDr: 0, spentD: 0, spentDr: 0 };
        (nodeChildren[nId] || []).forEach(cId => {
            const cSt = rollupNode(cId, visited);
            if (cSt) {
                st.budD += cSt.budD;
                st.budDr += cSt.budDr;
                st.spentD += cSt.spentD;
                st.spentDr += cSt.spentDr;
            }
        });
        return st;
    }

    const rootNodeIds = (currentNodes || [])
        .filter(n => n.block_type !== 'note' && n.doc_number !== 'NOTE' && n.doc_number !== 'TODO' && !(currentEdges || []).some(e => e.target === n.id))
        .map(n => n.id);

    rootNodeIds.forEach(id => rollupNode(id));

    const zoneChildren = {};
    (currentZones || []).forEach(z => {
        if (z.parent_zone_id) {
            if (!zoneChildren[z.parent_zone_id]) zoneChildren[z.parent_zone_id] = [];
            zoneChildren[z.parent_zone_id].push(z.id);
        }
    });

    function rollupZone(zId, visited = new Set()) {
        if (visited.has(zId)) return statsZones[zId];
        visited.add(zId);
        const st = statsZones[zId] || { budD: 0, budDr: 0, spentD: 0, spentDr: 0 };

        const rNodes = rootNodeIds.filter(id => {
            const n = currentNodes.find(x => x.id === id);
            return n && n.zone_id === zId;
        });
        rNodes.forEach(nId => {
            const nSt = statsNodes[nId];
            if (nSt) {
                st.budD += nSt.budD;
                st.budDr += nSt.budDr;
                st.spentD += nSt.spentD;
                st.spentDr += nSt.spentDr;
            }
        });

        (zoneChildren[zId] || []).forEach(czId => {
            const czSt = rollupZone(czId, visited);
            if (czSt) {
                st.budD += czSt.budD;
                st.budDr += czSt.budDr;
                st.spentD += czSt.spentD;
                st.spentDr += czSt.spentDr;
            }
        });
        return st;
    }

    const topZoneIds = (currentZones || []).filter(z => !z.parent_zone_id).map(z => z.id);
    topZoneIds.forEach(id => rollupZone(id));

    return { nodes: statsNodes, zones: statsZones };
}

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Druck-Controller (Strukturbaum-Druck inkl. Container-Icon)
 * ERSETZEN IN: ui.js (Funktion renderStructurePrintSheet)
 * Zeitstempel: 2026-08-31 18:05:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 22:25:00 CEST]: Hierarchischer Strukturbaum-Druck.
 *   - [2026-08-31 18:05:00 CEST]: Icon-Weiche um Container-Rahmen (⬚) erweitert.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Druck-Controller (Strukturbaum-Druck mit Inventor CAD-Icons)
 * ERSETZEN IN: ui.js (Funktion renderStructurePrintSheet)
 * Zeitstempel: 2026-08-31 18:15:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 22:25:00 CEST]: Hierarchischer Strukturbaum-Druck.
 *   - [2026-08-31 18:15:00 CEST]: SVG-Icons für Bauteil & Baugruppe eingebunden.
 * =============================================================================
 */
function renderStructurePrintSheet(container, proj, showTimes) {
    const today = new Date().toLocaleDateString('de-DE');
    const stats = calcTreeStats();

    const sortZonesByOrder = (zones) => {
        return [...zones].sort((a, b) => {
            const ordA = (a.sort_order !== null && a.sort_order !== undefined) ? a.sort_order : 9999;
            const ordB = (b.sort_order !== null && b.sort_order !== undefined) ? b.sort_order : 9999;
            return ordA - ordB;
        });
    };

    let html = `
        <div class="struct-print-sheet">
            <div class="struct-header">
                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <h2 style="margin: 0 0 4px 0; color: #2b6cb0;">Projekt-Strukturbaum</h2>
                        <div style="font-size: 13px; font-weight: bold; color: #4a5568;">${escapeHtml(proj.object_number)} – ${escapeHtml(proj.name)}</div>
                    </div>
                    <div style="font-size: 11px; color: #718096; text-align: right;">
                        <div><strong>Gedruckt am:</strong> ${today}</div>
                        <div><strong>Benutzer:</strong> ${escapeHtml(activeUserCode || 'COT')}</div>
                    </div>
                </div>
            </div>
            <div class="struct-tree-body">
    `;

    const getIndentSpaces = (level) => {
        let str = '';
        for (let i = 0; i < level; i++) str += '<span style="display:inline-block; width: 22px; color: #a0aec0;">│&nbsp;&nbsp;</span>';
        return str;
    };

    const formatStatsHtml = (st) => {
        if (!showTimes || !st) return '';
        return `
            <div style="font-size: 11px; color: #4a5568; font-family: monospace; white-space: nowrap;">
                <span style="color:#2b6cb0; font-weight: bold;">CAD: ${formatHoursToHM(st.spentD)} / ${formatHoursToHM(st.budD)}</span> &nbsp;│&nbsp; 
                <span style="color:#38a169; font-weight: bold;">Zeichn: ${formatHoursToHM(st.spentDr)} / ${formatHoursToHM(st.budDr)}</span>
            </div>
        `;
    };

    const printNodeTree = (nodeId, level) => {
        const node = currentNodes.find(n => n.id === nodeId);
        if (!node || node.block_type === 'note' || node.doc_number === 'NOTE' || node.doc_number === 'TODO') return;

        const docNum = node.doc_number || (node.article_number ? `ART-${node.article_number}` : '');
        const badgeHtml = docNum ? `<span class="struct-doc-badge">${escapeHtml(docNum)}</span>` : '';
        const indentHtml = getIndentSpaces(level);
        const nSt = stats.nodes[node.id];
        const iconSvg = node.block_type === 'part' ? CAD_ICONS.part : CAD_ICONS.assembly;

        let completionBadge = '';
        if (node.completion_status === 'completed') {
            completionBadge = ' <span style="font-size: 10px; color: #38a169; font-weight: bold;">✅ Erledigt</span>';
        }

        html += `
            <div class="struct-row">
                <div style="flex: 1; display: flex; align-items: center; overflow: hidden; padding-right: 15px;">
                    ${indentHtml}<span class="struct-connector-line">└──</span>
                    ${badgeHtml}<span style="display:inline-flex; align-items:center; gap:4px;">${iconSvg} ${escapeHtml(node.name)}</span>
                    ${completionBadge}
                </div>
                ${formatStatsHtml(nSt)}
            </div>
        `;

        const childEdges = (currentEdges || []).filter(e => e.source === node.id);
        const childNodes = childEdges.map(e => currentNodes.find(n => n.id === e.target)).filter(Boolean);

        childNodes.sort((a, b) => (parseFloat(a.pos_y) || 0) - (parseFloat(b.pos_y) || 0));
        childNodes.forEach(child => printNodeTree(child.id, level + 1));
    };

    const printZoneAndChildren = (zoneId, level) => {
        const zone = currentZones.find(z => z.id === zoneId);
        if (!zone || window.isZoneHidden(zone.id) || zone.zone_type === 'comment') return;

        const docNum = zone.doc_number || (zone.article_number ? `ART-${zone.article_number}` : '');
        const badgeHtml = docNum ? `<span class="struct-doc-badge" style="border-color:${zone.color_hex || '#cbd5e0'};">${escapeHtml(docNum)}</span>` : '';
        const indentHtml = getIndentSpaces(level);
        const zSt = stats.zones[zone.id];

        let zIcon = CAD_ICONS.location;
        if (zone.zone_type === 'assembly') zIcon = CAD_ICONS.assembly;
        else if (zone.zone_type === 'container') zIcon = CAD_ICONS.container;

        html += `
            <div class="struct-row" style="background: #f8fafc; font-weight: bold; margin-top: 8px;">
                <div style="flex: 1; display: flex; align-items: center; overflow: hidden; padding-right: 15px;">
                    ${indentHtml}<span class="struct-connector-line">📁</span>
                    ${badgeHtml}<span style="color:${zone.color_hex || '#2d3748'}; display:inline-flex; align-items:center; gap:4px;">${zIcon} ${escapeHtml(zone.title)}</span>
                </div>
                ${formatStatsHtml(zSt)}
            </div>
        `;

        const rootNodesInZone = (currentNodes || []).filter(n =>
            n.zone_id === zone.id &&
            n.block_type !== 'note' &&
            n.doc_number !== 'NOTE' &&
            n.doc_number !== 'TODO' &&
            !(currentEdges || []).some(e => e.target === n.id)
        );
        rootNodesInZone.sort((a, b) => (parseFloat(a.pos_y) || 0) - (parseFloat(b.pos_y) || 0));
        rootNodesInZone.forEach(n => printNodeTree(n.id, level + 1));

        const childZones = sortZonesByOrder((currentZones || []).filter(z => z.parent_zone_id === zone.id));
        childZones.forEach(cz => printZoneAndChildren(cz.id, level + 1));
    };

    const topZones = sortZonesByOrder((currentZones || []).filter(z => !z.parent_zone_id));
    topZones.forEach(tz => printZoneAndChildren(tz.id, 0));

    const unzonedRootNodes = (currentNodes || []).filter(n =>
        !n.zone_id &&
        n.block_type !== 'note' &&
        n.doc_number !== 'NOTE' &&
        n.doc_number !== 'TODO' &&
        !(currentEdges || []).some(e => e.target === n.id)
    );
    unzonedRootNodes.sort((a, b) => (parseFloat(a.pos_y) || 0) - (parseFloat(b.pos_y) || 0));

    if (unzonedRootNodes.length > 0) {
        html += `<div class="struct-row" style="background: #edf2f7; font-weight: bold; margin-top: 15px;"><span>📌 Freie Blöcke (Ohne Rahmenzuweisung)</span></div>`;
        unzonedRootNodes.forEach(n => printNodeTree(n.id, 1));
    }

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
}

/**
* =============================================================================
* Projekt: CAD Time Manager
* Domain: UI Controller (Globaler ESC-Key Modal & Dialog Closer)
* HINZUFÜGEN IN: ui.js (Am Ende der Datei)
* Zeitstempel: 2026-09-17 20:20:00 CEST
* Breadcrumbs:
*   - [2026-09-17 20:20:00 CEST]: Capture-Phase Keydown-Listener für 'Escape' integriert.
*     Schließt offene Modals (z.B. configModal) und Dialoge zuverlässig auch dann,
*     wenn der Fokus in einem Textfeld oder auf einem Range-Slider liegt.
* =============================================================================
*/
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
        // 1. Geöffneten Bestätigungs- / Prompt-Dialog abbrechen
        const dialog = document.getElementById('dialogModal');
        if (dialog && (dialog.style.display === 'flex' || getComputedStyle(dialog).display === 'flex')) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof closeDialog === 'function') closeDialog(false);
            return;
        }

        // 2. Alle aktuell geöffneten Modals ermitteln (außer dem Login-Overlay)
        const openModals = Array.from(document.querySelectorAll('.modal-backdrop')).filter(m =>
            m.id !== 'userLoginOverlay' &&
            (m.style.display === 'flex' || getComputedStyle(m).display === 'flex')
        );

        if (openModals.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            // Das oberste geöffnete Modal schließen (äquivalent zum Klick auf "Abbrechen")
            const topModal = openModals[openModals.length - 1];
            if (typeof closeModal === 'function') {
                closeModal(topModal.id);
            }
        }
    }
}, true); // 'true' = Capture-Phase: feuert vor eventuellen Input-Blockaden

/**
* =============================================================================
* Projekt: CAD Time Manager
* Domain: UI Controller (Manager-Canvas Switcher & Sortier-Engine)
* HINZUFÜGEN IN: ui.js (Am Ende der Datei)
* Zeitstempel: 2026-09-17 21:05:00 CEST
* Breadcrumbs:
*   - [2026-09-17 21:05:00 CEST]: switchCanvasMode toggelt zwischen Konstruktions-
*     und Management-Ansicht. autoArrangeManagerCanvas ordnet alle Blöcke nach
*     Farben in Spalten und alphabetisch nach Namen an.
* =============================================================================
*/

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Fortschritts-Board State & Interaktionen)
 * ERSETZEN IN: ui.js (Am Ende der Datei ab window.activeCanvasMode)
 * Zeitstempel: 2026-09-17 21:50:00 CEST
 * =============================================================================
 */

window.activeCanvasMode = localStorage.getItem('cad_tm_canvas_mode') || 'main';

// Lädt den Board-Zustand für das aktive Projekt
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Fortschritts-Board State & Placements Guard)
 * ERSETZEN IN: ui.js (Funktion window.getManagerLayout)
 * Zeitstempel: 2026-09-17 21:35:00 CEST
 * Breadcrumbs:
 *   - [2026-09-17 21:50:00 CEST]: Board-Zustand Laden & Fallbacks.
 *   - [2026-09-17 21:35:00 CEST]: placements-Objekt Guard ergänzt gegen 
 *     'Cannot set properties of undefined' bei unvollständigen Datensätzen.
 * =============================================================================
 */
window.getManagerLayout = function () {
    const proj = (typeof getCurrentProject === 'function') ? getCurrentProject() : null;

    if (proj && proj.manager_layout && Array.isArray(proj.manager_layout.zones)) {
        if (!proj.manager_layout.placements || typeof proj.manager_layout.placements !== 'object') {
            proj.manager_layout.placements = {};
        }
        return proj.manager_layout;
    }

    const key = `cad_tm_mgr_layout_${activeProjectId}`;
    let layout = JSON.parse(localStorage.getItem(key) || 'null');

    if (!layout || !Array.isArray(layout.zones)) {
        layout = {
            zones: [
                { id: 'mz_1', title: 'Förderband 01 (GB 1200)', doc_number: 'FB-01', color_hex: '#2563eb', pos_x: 60, pos_y: 80, width: 620, height: 440 },
                { id: 'mz_2', title: 'Förderband 02 (GB 1600)', doc_number: 'FB-02', color_hex: '#16a34a', pos_x: 720, pos_y: 80, width: 620, height: 440 }
            ],
            placements: {}
        };

        let curX = 90, curY = 140;
        (currentNodes || []).filter(n => n.block_type !== 'note').forEach((n, idx) => {
            const targetZId = idx < 2 ? 'mz_1' : (idx < 4 ? 'mz_2' : null);
            layout.placements[n.id] = {
                pos_x: targetZId ? (targetZId === 'mz_1' ? curX : curX + 660) : 1380,
                pos_y: curY,
                zone_id: targetZId
            };
            curY += (idx % 2 === 1) ? 140 : 0;
            if (curY > 380) curY = 140;
        });
    }

    if (!layout.placements || typeof layout.placements !== 'object') {
        layout.placements = {};
    }

    return layout;
};

window.saveManagerLayout = async function (layout) {
    const key = `cad_tm_mgr_layout_${activeProjectId}`;
    localStorage.setItem(key, JSON.stringify(layout));

    const proj = (currentProjects || []).find(p => p.id === activeProjectId);
    if (proj) proj.manager_layout = layout;

    if (db && activeProjectId) {
        try {
            await db.from('projects').update({ manager_layout: layout }).eq('id', activeProjectId);
        } catch (err) {
            console.error("Fehler beim Speichern des Layouts:", err);
        }
    }
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Mode-Switch mit getrenntem Viewport-State & Zone-Lock)
 * ERSETZEN IN: ui.js (Ab window.switchCanvasMode bis Dateiende)
 * Zeitstempel: 2026-09-17 21:55:00 CEST
 * Breadcrumbs:
 *   - [2026-09-17 21:35:00 CEST]: Placements Guard.
 *   - [2026-09-17 21:55:00 CEST]: Speichern von Pan/Zoom getrennt nach Modus 
 *     (cad_tm_panX_main / cad_tm_panX_manager), Zone-Lock Toggle & Zone Delete.
 * =============================================================================
 */
window.switchCanvasMode = function (mode) {
    const prevMode = window.activeCanvasMode || 'main';

    // 1. Kameraposition des vorherigen Modus sichern
    localStorage.setItem(`cad_tm_panX_${prevMode}`, window.currentPanX);
    localStorage.setItem(`cad_tm_panY_${prevMode}`, window.currentPanY);
    localStorage.setItem(`cad_tm_scale_${prevMode}`, window.currentScale);

    window.activeCanvasMode = mode;
    localStorage.setItem('cad_tm_canvas_mode', mode);

    const btnMain = document.getElementById('btnModeMain');
    const btnManager = document.getElementById('btnModeManager');
    const btnSort = document.getElementById('btnAutoSortManager');

    if (btnMain && btnManager) {
        btnMain.classList.toggle('active', mode === 'main');
        btnManager.classList.toggle('active', mode === 'manager');
    }

    if (btnSort) {
        btnSort.style.display = mode === 'manager' ? 'inline-block' : 'none';
    }

    // 2. Kameraposition des Zielmodus wiederherstellen oder zentrieren
    const savedX = localStorage.getItem(`cad_tm_panX_${mode}`);
    const savedY = localStorage.getItem(`cad_tm_panY_${mode}`);
    const savedScale = localStorage.getItem(`cad_tm_scale_${mode}`);

    if (savedX !== null && savedY !== null && savedScale !== null) {
        window.currentPanX = parseFloat(savedX);
        window.currentPanY = parseFloat(savedY);
        window.currentScale = parseFloat(savedScale);
        if (typeof applyCanvasTransform === 'function') applyCanvasTransform(false);
    } else {
        if (typeof window.centerViewOnVisible === 'function') {
            setTimeout(() => window.centerViewOnVisible(), 60);
        }
    }

    showToast(mode === 'manager' ? 'Fortschritts-Board aktiv' : 'CAD-Konstruktionsplan aktiv', 'info');

    if (typeof renderCanvas === 'function') renderCanvas();
    if (typeof renderSidebarZones === 'function') renderSidebarZones();
};

window.toggleManagerZoneLock = function (e, zoneId) {
    if (e) e.stopPropagation();
    const layout = getManagerLayout();
    const zone = (layout.zones || []).find(z => z.id === zoneId);
    if (!zone) return;

    zone.is_locked = !zone.is_locked;
    saveManagerLayout(layout);
    showToast(`Rahmen ${zone.is_locked ? 'gesperrt (Durchklicken zum Pan aktiv)' : 'entsperrt'}`, 'info');
    renderCanvas();
};

window.deleteManagerZone = async function (zoneId) {
    const layout = getManagerLayout();
    const zone = (layout.zones || []).find(z => z.id === zoneId);
    if (!zone) return;

    const confirmed = await customConfirm(
        'Übersichts-Rahmen entfernen',
        `Möchtest du den Rahmen "${zone.title}" vom Board löschen? (Darin liegende Bauteile und Unterrahmen bleiben erhalten)`
    );

    if (confirmed) {
        // Untergeordnete Rahmen werden eine Ebene nach oben freigegeben
        (layout.zones || []).forEach(z => {
            if (z.parent_zone_id === zoneId) {
                z.parent_zone_id = zone.parent_zone_id || null;
            }
        });

        layout.zones = (layout.zones || []).filter(z => z.id !== zoneId);

        // Blöcke im gelöschten Rahmen werden wieder frei auf das Board gelegt
        Object.keys(layout.placements || {}).forEach(k => {
            if (layout.placements[k].zone_id === zoneId) {
                layout.placements[k].zone_id = zone.parent_zone_id || null;
            }
        });

        saveManagerLayout(layout);
        showToast('Übersichts-Rahmen entfernt', 'info');
        renderCanvas();
    }
};

// Automatisches Anordnen im Board
window.autoArrangeManagerCanvas = function () {
    const layout = getManagerLayout();
    const nodes = (currentNodes || []).filter(n => n.block_type !== 'note');
    if (nodes.length === 0) return;

    const colorOrder = (typeof COLOR_PRESETS !== 'undefined') ? COLOR_PRESETS.map(c => c.hex.toLowerCase()) : [];
    const groups = {};
    nodes.forEach(n => {
        const c = (n.color_hex || '#2b6cb0').toLowerCase();
        if (!groups[c]) groups[c] = [];
        groups[c].push(n);
    });

    Object.keys(groups).forEach(c => {
        groups[c].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    });

    const sortedColors = Object.keys(groups).sort((a, b) => {
        const idxA = colorOrder.indexOf(a);
        const idxB = colorOrder.indexOf(b);
        return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
    });

    let startX = 60;
    sortedColors.forEach(color => {
        let startY = 80;
        groups[color].forEach(node => {
            layout.placements[node.id] = { pos_x: startX, pos_y: startY, zone_id: null };
            startY += 180;
        });
        startX += 320;
    });

    saveManagerLayout(layout);
    showToast('Bauteile nach Farbe & Name ausgerichtet', 'success');
    renderCanvas();
    if (typeof window.centerViewOnVisible === 'function') setTimeout(() => window.centerViewOnVisible(), 100);
};

// Modal zur Block-Platzierung
let pendingMgrPlaceCoords = { x: 100, y: 100 };
window.openAddExistingBlockModal = function (x, y) {
    pendingMgrPlaceCoords = { x, y };
    const selNode = document.getElementById('mgrSelectExistingNode');
    const selZone = document.getElementById('mgrSelectTargetZone');
    const layout = getManagerLayout();

    if (!selNode || !selZone) return;
    selNode.innerHTML = '';
    selZone.innerHTML = '<option value="">-- Frei auf Board (Kein Rahmen) --</option>';

    (currentNodes || []).filter(n => n.block_type !== 'note').forEach(n => {
        const doc = n.doc_number ? `[${n.doc_number}] ` : '';
        selNode.appendChild(new Option(`${doc}${n.name}`, n.id));
    });

    layout.zones.forEach(z => {
        const doc = z.doc_number ? `[${z.doc_number}] ` : '';
        selZone.appendChild(new Option(`${doc}${z.title}`, z.id));
    });

    openModal('mgrAddBlockModal');
};

window.confirmAddExistingBlockToManager = function () {
    const selNode = document.getElementById('mgrSelectExistingNode');
    const selZone = document.getElementById('mgrSelectTargetZone');
    if (!selNode || !selNode.value) return;

    const nodeId = selNode.value;
    const zoneId = selZone.value || null;
    const layout = getManagerLayout();

    layout.placements[nodeId] = {
        pos_x: Math.round(pendingMgrPlaceCoords.x),
        pos_y: Math.round(pendingMgrPlaceCoords.y),
        zone_id: zoneId
    };

    saveManagerLayout(layout);
    closeModal('mgrAddBlockModal');
    showToast('Block auf Fortschritts-Board platziert', 'success');
    renderCanvas();
    if (typeof renderSidebarZones === 'function') renderSidebarZones();
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: UI Controller (Manager-Zonen mit automatischer Verschachtelung)
 * ERSETZEN IN: ui.js (Funktionen handleCreateManagerZone & deleteManagerZone)
 * Zeitstempel: 2026-09-17 22:15:00 CEST
 * Breadcrumbs:
 *   - [2026-09-17 21:55:00 CEST]: Basis-Erstellung.
 *   - [2026-09-17 22:15:00 CEST]: Erkennt beim Erstellen an den Klick-Koordinaten
 *     automatisch den übergeordneten Manager-Rahmen (parent_zone_id).
 * =============================================================================
 */
window.handleCreateManagerZone = async function (x, y) {
    const res = await customPromptDual(
        'Übersichts-Rahmen anlegen',
        'Neuen Rahmen für das Fortschritts-Board erstellen:',
        'Rahmen-Bezeichnung:',
        'Förderband ',
        'System- / DOC-Nr (z.B. FB-03):',
        ''
    );
    if (!res || !res.val1) return;

    const layout = getManagerLayout();

    // Erkennt, ob der neue Rahmen innerhalb eines bereits existierenden Rahmens geklickt wurde
    const parentZone = (typeof getDeepestMgrZoneAt === 'function')
        ? getDeepestMgrZoneAt(x + 100, y + 50, [], layout.zones)
        : null;

    const newZone = {
        id: 'mz_' + Date.now(),
        title: res.val1,
        doc_number: res.val2 || '',
        color_hex: '#2b6cb0',
        pos_x: Math.round(x),
        pos_y: Math.round(y),
        width: parentZone ? 500 : 620,
        height: parentZone ? 360 : 440,
        parent_zone_id: parentZone ? parentZone.id : null,
        is_locked: false
    };

    layout.zones.push(newZone);
    saveManagerLayout(layout);
    showToast(`Übersichts-Rahmen "${res.val1}" erstellt${parentZone ? ` (in "${parentZone.title}")` : ''}`, 'success');
    renderCanvas();
};

window.addBlockToManagerCanvas = function (nodeId, targetX = null, targetY = null) {
    const layout = getManagerLayout();
    const node = (currentNodes || []).find(n => n.id === nodeId);
    if (!node) return;

    let posX = targetX;
    let posY = targetY;

    if (posX === null || posY === null) {
        const viewport = document.getElementById('viewport');
        const vw = viewport ? viewport.clientWidth : 800;
        const vh = viewport ? viewport.clientHeight : 600;
        const center = getCanvasCoords(vw / 2, vh / 2);
        posX = Math.round(center.x - 145);
        posY = Math.round(center.y - 40);
    }

    let matchedZoneId = null;
    for (const mz of layout.zones) {
        if (posX >= mz.pos_x && posX <= (mz.pos_x + mz.width) &&
            posY >= mz.pos_y && posY <= (mz.pos_y + mz.height)) {
            matchedZoneId = mz.id;
            break;
        }
    }

    layout.placements[nodeId] = {
        pos_x: posX,
        pos_y: posY,
        zone_id: matchedZoneId
    };

    saveManagerLayout(layout);
    showToast(`"${node.name}" auf Board platziert`, 'success');

    if (typeof renderCanvas === 'function') renderCanvas();
    if (typeof renderSidebarZones === 'function') renderSidebarZones();
};

window.removeBlockFromManagerCanvas = function (nodeId) {
    const layout = getManagerLayout();
    if (layout.placements && layout.placements[nodeId]) {
        delete layout.placements[nodeId];
        saveManagerLayout(layout);
        showToast('Aus Fortschritts-Board entfernt', 'info');

        if (typeof renderCanvas === 'function') renderCanvas();
        if (typeof renderSidebarZones === 'function') renderSidebarZones();
    }
};

window.centerOnManagerBlock = function (nodeId) {
    const layout = getManagerLayout();
    const p = layout.placements ? layout.placements[nodeId] : null;
    if (!p) return;

    const viewport = document.getElementById('viewport');
    if (!viewport) return;

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;

    window.currentPanX = (vw / 2) - ((p.pos_x + 145) * window.currentScale);
    window.currentPanY = (vh / 2) - ((p.pos_y + 50) * window.currentScale);

    if (typeof applyCanvasTransform === 'function') applyCanvasTransform(true);

    const el = document.getElementById(nodeId);
    if (el) {
        el.style.transition = 'box-shadow 0.2s ease';
        el.style.boxShadow = '0 0 20px 4px #3182ce';
        setTimeout(() => { el.style.boxShadow = ''; }, 1200);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const viewport = document.getElementById('viewport');
    if (viewport) {
        viewport.addEventListener('dragover', (e) => {
            if (window.activeCanvasMode === 'manager') {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            }
        });

        viewport.addEventListener('drop', (e) => {
            if (window.activeCanvasMode === 'manager') {
                const nodeId = e.dataTransfer.getData('text/plain');
                if (nodeId && (currentNodes || []).some(n => n.id === nodeId)) {
                    e.preventDefault();
                    const coords = getCanvasCoords(e.clientX, e.clientY);
                    window.addBlockToManagerCanvas(nodeId, Math.round(coords.x - 145), Math.round(coords.y - 40));
                }
            }
        });
    }

    setTimeout(() => {
        if (window.activeCanvasMode === 'manager') {
            window.switchCanvasMode('manager');
        }
    }, 300);
});