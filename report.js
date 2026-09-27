/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Reporting, Stichtags-Rekonstruktion & PDF Export (html2pdf.js)
 * Zeitstempel: 2026-08-22 18:30:00 CEST
 * =============================================================================
 */

// --- Datumshilfen ---
function getISOWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getStartAndEndOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay() === 0 ? 7 : d.getDay();
    const diffToMonday = d.getDate() - day + 1;
    const start = new Date(d.setDate(diffToMonday));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

function getStartAndEndOfMonth(date) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

// Formatierung zu YYYY-MM-DD für Input-Felder
function formatDateForInput(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// --- Initialisierung & UI Steuerung ---
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Reporting (Standard Heute & PDF für alle Benutzer freigeschaltet)
 * ERSETZEN IN: report.js (Funktion openReportModal)
 * Zeitstempel: 2026-08-30 14:30:00 CEST
 * Breadcrumbs:
 *   - [2026-08-22 18:30:00 CEST]: Initiale Reporting-Steuerung.
 *   - [2026-08-30 14:30:00 CEST]: 1. Standard-Zeitraum auf 'today' gesetzt.
 *     2. PDF-Button für alle Benutzer sichtbar geschaltet (Einfache User exportieren
 *     automatisch gefiltert auf ihr eigenes Kürzel).
 * =============================================================================
 */
window.openReportModal = function () {
    populateReportFilters();

    // Standardmäßig den heutigen Tag auswählen
    const timeframeSelect = document.getElementById('repTimeframe');
    if (timeframeSelect) timeframeSelect.value = 'today';

    handleTimeframeChange();

    // PDF-Export-Button für alle Mitarbeiter anzeigen
    const btnPdf = document.getElementById('btnExportPDF');
    if (btnPdf) btnPdf.style.display = 'inline-block';

    openModal('reportModal');
};
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Reporting (Zonen-Sortierung analog zur Sidebar)
 * ERSETZEN IN: report.js (Funktion populateReportFilters)
 * Zeitstempel: 2026-08-30 21:55:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 21:55:00 CEST]: Filterauswahl 'Bereich / Kasten' sortiert Rahmen
 *     analog zur Sidebar nach sort_order und Fläche (statt ungeordnetem Default-Array).
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Reporting (Strikte sort_order Sortierung)
 * ERSETZEN IN: report.js (Funktion populateReportFilters)
 * Zeitstempel: 2026-08-30 22:05:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 22:05:00 CEST]: Filterauswahl 'Bereich / Kasten' sortiert Rahmen
 *     ausschließlich nach sort_order (Drag & Drop) ohne Flächenberechnung.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Reporting Filter (Container-Kategorie)
 * ERSETZEN IN: report.js (Funktion populateReportFilters)
 * Zeitstempel: 2026-08-31 18:10:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 22:05:00 CEST]: Strikte sort_order Sortierung.
 *   - [2026-08-31 18:10:00 CEST]: Icon-Auswahl um 'container' (⬚) erweitert.
 * =============================================================================
 */
window.populateReportFilters = function () {
    const selUser = document.getElementById('repFilterUser');
    const selZone = document.getElementById('repFilterZone');
    const selBlock = document.getElementById('repFilterBlock');

    selUser.innerHTML = '';
    if (isAdmin) {
        selUser.add(new Option('Alle Mitarbeiter', 'all'));
        currentUsers.forEach(u => selUser.add(new Option(u.code, u.code)));
        selUser.disabled = false;
        selUser.value = 'all';
    } else {
        selUser.add(new Option(activeUserCode, activeUserCode));
        selUser.value = activeUserCode;
        selUser.disabled = true;
    }

    selZone.innerHTML = '<option value="all">Alle Bereiche</option>';

    const sortZonesByOrder = (zones) => {
        return [...zones].sort((a, b) => {
            const ordA = (a.sort_order !== null && a.sort_order !== undefined) ? a.sort_order : 9999;
            const ordB = (b.sort_order !== null && b.sort_order !== undefined) ? b.sort_order : 9999;
            return ordA - ordB;
        });
    };

    const sortedZones = sortZonesByOrder(currentZones || []);
    sortedZones.forEach(z => {
        let zIcon = '📍';
        if (z.zone_type === 'assembly') zIcon = '📦';
        else if (z.zone_type === 'comment') zIcon = '💬';
        else if (z.zone_type === 'container') zIcon = '⬚';

        selZone.add(new Option(`${zIcon} ${z.title}`, z.id));
    });

    selBlock.innerHTML = '<option value="all">Alle Blöcke</option>';
    currentNodes.forEach(n => {
        const type = n.block_type === 'part' ? 'Bauteil' : 'Baugruppe';
        selBlock.add(new Option(`[${type}] ${n.name}`, n.id));
    });
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Reporting & Filter-Steuerung
 * ERSETZEN IN: report.js (Funktionen handleTimeframeChange & updateReportData)
 * Zeitstempel: 2026-08-27 17:45:00 CEST
 * Breadcrumbs:
 *   - [2026-08-22 18:30:00 CEST]: Initiale Stichtags-Rekonstruktion & PDF-Export.
 *   - [2026-08-27 17:45:00 CEST]: Filter-Optionen 'today' und 'yesterday' integriert,
 *     Zonen-Logs (zone_id) in die Auswertungstabelle und den Filter-Scope aufgenommen.
 * =============================================================================
 */

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Reporting (Review-Snapshot Vergleich mit hierarchischem Rollup)
 * ERSETZEN IN: report.js (Ab handleTimeframeChange bis Dateiende von renderReportSummary)
 * Zeitstempel: 2026-09-27 15:55:00 CEST
 * Breadcrumbs:
 *   - [2026-08-31]: Horizontale Kacheln.
 *   - [2026-09-27 15:55:00 CEST]: 1. Hierarchischer Bottom-Up Rollup:
 *     Stunden von Unterrahmen und Bauteilen fließen in den obersten Hauptrahmen ein.
 *   - [2026-09-27 15:55:00 CEST]: 2. Top-Down Sortierung: Oberste Rahmen 
 *     werden absteigend nach Intervall-Aufwand gelistet, darin liegende Bauteile 
 *     ebenfalls absteigend.
 *   - [2026-09-27 15:55:00 CEST]: 3. Differenz-Matrix für Zeitbudgets (Alt vs. Neu).
 * =============================================================================
 */

window.handleTimeframeChange = function () {
    const timeframe = document.getElementById('repTimeframe').value;
    const customDiv = document.getElementById('repCustomDates');
    const snapDiv = document.getElementById('repSnapshotSelectContainer');
    const now = new Date();

    if (customDiv) customDiv.style.display = (timeframe === 'custom') ? 'flex' : 'none';
    if (snapDiv) snapDiv.style.display = (timeframe === 'snapshot_compare') ? 'flex' : 'none';

    if (timeframe === 'snapshot_compare') {
        const selA = document.getElementById('repSelectSnapshotA');
        const selB = document.getElementById('repSelectSnapshotB');
        if (selA && selB) {
            selA.innerHTML = '';
            selB.innerHTML = '<option value="live">🔴 Aktueller Live-Stand (Heute)</option>';

            if (!window.currentSnapshots || window.currentSnapshots.length === 0) {
                selA.innerHTML = '<option value="">Keine Snapshots vorhanden (Bitte oben über 🚩 anlegen)</option>';
            } else {
                window.currentSnapshots.forEach(s => {
                    const dFormatted = new Date(s.review_date).toLocaleDateString('de-DE');
                    selA.add(new Option(`🚩 ${s.title} (${dFormatted})`, s.id));
                    selB.add(new Option(`🚩 ${s.title} (${dFormatted})`, s.id));
                });
            }
        }
    }

    if (timeframe === 'custom') {
        const range = getStartAndEndOfMonth(now);
        document.getElementById('repStartDate').value = formatDateForInput(range.start);
        document.getElementById('repEndDate').value = formatDateForInput(range.end);
    }

    updateReportData();
};

// --- Echter Canvas Pie-Chart Generator (sicher für PDF) ---
function createPieChartImage(spent, budget, baseColor) {
    const cvs = document.createElement('canvas');
    cvs.width = 120;
    cvs.height = 120;
    const ctx = cvs.getContext('2d');

    const b = Math.max(0.1, parseFloat(budget) || 1);
    const pct = Math.min((spent / b), 1);
    const isOver = spent > b;
    const fillCol = isOver ? '#e53e3e' : baseColor;

    // Hintergrund (grau)
    ctx.beginPath();
    ctx.moveTo(60, 60);
    ctx.arc(60, 60, 50, 0, 2 * Math.PI);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();

    // Gefüllter Sektor
    ctx.beginPath();
    ctx.moveTo(60, 60);
    ctx.arc(60, 60, 50, -Math.PI / 2, -Math.PI / 2 + (pct * 2 * Math.PI));
    ctx.fillStyle = fillCol;
    ctx.fill();

    // Innerer Kreis (Donut-Loch)
    ctx.beginPath();
    ctx.arc(60, 60, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Text in der Mitte
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(pct * 100)}%`, 60, 60);

    return cvs.toDataURL('image/png');
}

// --- Engine & Datenaufbereitung ---
let reportState = { logs: [], startDate: null, endDate: null, projData: null };

window.updateReportData = function () {
    const filterUser = document.getElementById('repFilterUser').value;
    const timeframe = document.getElementById('repTimeframe').value;
    const filterZone = document.getElementById('repFilterZone').value;
    const filterBlock = document.getElementById('repFilterBlock').value;

    const now = new Date();
    let startDate, endDate;
    let snapA = null, snapB = null;

    if (timeframe === 'snapshot_compare') {
        const selAId = document.getElementById('repSelectSnapshotA')?.value;
        const selBId = document.getElementById('repSelectSnapshotB')?.value;

        snapA = (window.currentSnapshots || []).find(s => s.id === selAId) || null;
        if (!snapA) {
            document.getElementById('repSummaryContainer').innerHTML = '<div style="font-size:12px; color:#e53e3e; padding:10px;">Bitte zuerst einen Start-Snapshot über das 🚩-Icon anlegen.</div>';
            document.getElementById('repDetailsContainer').innerHTML = '';
            return;
        }

        startDate = new Date(snapA.review_date);

        if (selBId === 'live' || !selBId) {
            endDate = new Date(); // Bis jetzt
        } else {
            snapB = (window.currentSnapshots || []).find(s => s.id === selBId) || null;
            endDate = snapB ? new Date(snapB.review_date) : new Date();
        }
    } else if (timeframe === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (timeframe === 'yesterday') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    } else if (timeframe === 'week') {
        const range = getStartAndEndOfWeek(now);
        startDate = range.start;
        endDate = range.end;
    } else if (timeframe === 'month') {
        const range = getStartAndEndOfMonth(now);
        startDate = range.start;
        endDate = range.end;
    } else {
        const sVal = document.getElementById('repStartDate').value;
        const eVal = document.getElementById('repEndDate').value;
        startDate = sVal ? new Date(sVal + 'T00:00:00Z') : new Date(0);
        endDate = eVal ? new Date(eVal + 'T23:59:59Z') : new Date();
    }

    // 1. STICHTAGS-REKONSTRUKTION GESAMTPROJEKT
    const proj = getCurrentProject();
    let projTotalD = 0, projTotalDr = 0;

    currentTimeLogs.filter(l => new Date(l.logged_at) <= endDate).forEach(l => {
        const hrs = parseFloat(l.hours) || 0;
        if (l.task_type === 'design') projTotalD += hrs;
        if (l.task_type === 'drafting') projTotalDr += hrs;
    });

    reportState.projData = {
        name: proj.name,
        obj: proj.object_number,
        budD: parseFloat(proj.total_budget_design) || 1,
        budDr: parseFloat(proj.total_budget_drafting) || 1,
        spentD: projTotalD,
        spentDr: projTotalDr
    };

    const pieDUrl = createPieChartImage(projTotalD, reportState.projData.budD, '#3182ce');
    const pieDrUrl = createPieChartImage(projTotalDr, reportState.projData.budDr, '#38a169');

    document.getElementById('repProjectStatusContainer').innerHTML = `
        <div style="flex:1; display:flex; align-items:center; gap:15px;">
            <img src="${pieDUrl}" style="width: 50px; height: 50px;">
            <div>
                <div style="font-size:10px; color:#a0aec0; text-transform:uppercase;">Projekt CAD Stichtag</div>
                <div style="font-size:13px; font-weight:bold; color:#2c3e50;">${formatHoursToHM(projTotalD)} / ${formatHoursToHM(reportState.projData.budD)}</div>
            </div>
        </div>
        <div style="flex:1; display:flex; align-items:center; gap:15px;">
            <img src="${pieDrUrl}" style="width: 50px; height: 50px;">
            <div>
                <div style="font-size:10px; color:#a0aec0; text-transform:uppercase;">Projekt Zeichnung Stichtag</div>
                <div style="font-size:13px; font-weight:bold; color:#2c3e50;">${formatHoursToHM(projTotalDr)} / ${formatHoursToHM(reportState.projData.budDr)}</div>
            </div>
        </div>
    `;

    // 2. GEFILTERTE LOGS FÜR DAS GEWÄHLTE INTERVALL
    let filteredLogs = currentTimeLogs.filter(log => {
        const logDate = new Date(log.logged_at);
        if (logDate < startDate || logDate > endDate) return false;
        if (filterUser !== 'all' && log.user_code !== filterUser) return false;
        if (filterBlock !== 'all' && log.node_id !== filterBlock) return false;

        if (filterZone !== 'all') {
            if (log.zone_id && log.zone_id === filterZone) return true;
            const node = currentNodes.find(n => n.id === log.node_id);
            if (!node || node.zone_id !== filterZone) return false;
        }
        return true;
    });

    reportState.logs = filteredLogs;
    reportState.startDate = startDate;
    reportState.endDate = endDate;

    if (timeframe === 'snapshot_compare') {
        renderSnapshotReviewReport(snapA, snapB, filteredLogs, startDate, endDate);
    } else {
        renderReportSummary(filteredLogs, timeframe);
        renderReportDetailsTable(filteredLogs);
    }
};

/**
 * =============================================================================
 * Hierarchischer Rollup & Absteigende Sortierung (Vom obersten Rahmen weg)
 * =============================================================================
 */
function renderSnapshotReviewReport(snapA, snapB, intervalLogs, startDate, endDate) {
    const summaryContainer = document.getElementById('repSummaryContainer');
    const detailsContainer = document.getElementById('repDetailsContainer');
    if (!summaryContainer || !detailsContainer) return;

    // 1. INTERVALL-STUNDEN PRO ELEMENT BERECHNEN
    const intervalHoursNode = {};
    const intervalHoursZone = {};
    let totalCAD = 0, totalDraft = 0;

    intervalLogs.forEach(l => {
        const hrs = parseFloat(l.hours) || 0;
        if (l.task_type === 'design') totalCAD += hrs;
        if (l.task_type === 'drafting') totalDraft += hrs;

        if (l.node_id) {
            if (!intervalHoursNode[l.node_id]) intervalHoursNode[l.node_id] = { cad: 0, draft: 0, total: 0 };
            if (l.task_type === 'design') intervalHoursNode[l.node_id].cad += hrs;
            if (l.task_type === 'drafting') intervalHoursNode[l.node_id].draft += hrs;
            intervalHoursNode[l.node_id].total += hrs;
        }
        if (l.zone_id) {
            if (!intervalHoursZone[l.zone_id]) intervalHoursZone[l.zone_id] = { cad: 0, draft: 0, total: 0 };
            if (l.task_type === 'design') intervalHoursZone[l.zone_id].cad += hrs;
            if (l.task_type === 'drafting') intervalHoursZone[l.zone_id].draft += hrs;
            intervalHoursZone[l.zone_id].total += hrs;
        }
    });

    // 2. BOTTOM-UP HIERARCHIE-ROLLUP: Unterrahmen & Bauteile rollen in den Oberrahmen
    const getZoneDirectEffort = (zId) => (intervalHoursZone[zId]?.total || 0);

    const getNodeEffort = (nId) => (intervalHoursNode[nId]?.total || 0);

    // Rekursiver Rollup für einen Rahmen inklusive aller Unterstrukturen
    function calculateSubtreeIntervalEffort(zoneId) {
        let sum = getZoneDirectEffort(zoneId);

        // Blöcke im Rahmen summieren
        (currentNodes || []).filter(n => n.zone_id === zoneId && n.block_type !== 'note').forEach(n => {
            sum += getNodeEffort(n.id);
        });

        // Unterrahmen rekursiv summieren
        (currentZones || []).filter(z => z.parent_zone_id === zoneId).forEach(cz => {
            sum += calculateSubtreeIntervalEffort(cz.id);
        });

        return sum;
    }

    // 3. TOP-DOWN SORTIERUNG: Oberste Rahmen nach Gesamtaufwand absteigend sortieren
    const topZones = (currentZones || []).filter(z => !z.parent_zone_id).map(z => {
        return {
            zone: z,
            subtreeEffort: calculateSubtreeIntervalEffort(z.id)
        };
    });

    // Sortierung der obersten Rahmen (Absteigend nach Gesamtaufwand im Intervall)
    topZones.sort((a, b) => b.subtreeEffort - a.subtreeEffort);

    // 4. HEADER-KACHELN FÜR DAS REVIEW-INTERVALL
    const sADateStr = new Date(snapA.review_date).toLocaleDateString('de-DE');
    const sBDateStr = snapB ? new Date(snapB.review_date).toLocaleDateString('de-DE') : 'Heute (Live)';
    const sBTitle = snapB ? snapB.title : 'Live-Stand';

    summaryContainer.innerHTML = `
        <div style="background: #ebf8ff; border: 1px solid #bee3f8; border-radius: 6px; padding: 10px 14px; margin-bottom: 8px;">
            <div style="font-size: 11px; font-weight: bold; color: #2b6cb0;">
                🚩 REVIEW-INTERVALL: ${escapeHtml(snapA.title)} (${sADateStr}) ➔ ${escapeHtml(sBTitle)} (${sBDateStr})
            </div>
            ${snapA.note ? `<div style="font-size: 11px; color: #4a5568; margin-top: 2px;"><em>Notiz: ${escapeHtml(snapA.note)}</em></div>` : ''}
        </div>
        <div style="display: flex; gap: 12px; width: 100%; margin-bottom: 8px;">
            <div style="background: #edf2f7; padding: 10px 14px; border-radius: 6px; flex: 1; border: 1px solid #e2e8f0;">
                <div style="font-size: 10px; color: #4a5568; text-transform: uppercase; font-weight: bold;">Zusätzliches CAD (3D)</div>
                <div style="font-size: 18px; font-weight: bold; color: #2b6cb0; margin-top: 2px;">+${formatHoursToHM(totalCAD)}</div>
            </div>
            <div style="background: #edf2f7; padding: 10px 14px; border-radius: 6px; flex: 1; border: 1px solid #e2e8f0;">
                <div style="font-size: 10px; color: #4a5568; text-transform: uppercase; font-weight: bold;">Zusätzliche Zeichnung (2D)</div>
                <div style="font-size: 18px; font-weight: bold; color: #38a169; margin-top: 2px;">+${formatHoursToHM(totalDraft)}</div>
            </div>
            <div style="background: #2d3748; padding: 10px 14px; border-radius: 6px; flex: 1;">
                <div style="font-size: 10px; color: #a0aec0; text-transform: uppercase; font-weight: bold;">Intervall-Gesamtaufwand</div>
                <div style="font-size: 18px; font-weight: bold; color: #fff; margin-top: 2px;">+${formatHoursToHM(totalCAD + totalDraft)}</div>
            </div>
        </div>
    `;

    // 5. STRUKTURIERTE TABELLE: HIERARCHISCH & ABSTEIGEND SORTIERT
    let tableHtml = `
        <table class="log-table">
            <thead>
                <tr>
                    <th>Bereich / Baugruppe (Nach Aufwand sortiert)</th>
                    <th style="text-align: right; width: 110px;">Im Intervall gebucht</th>
                    <th style="text-align: right; width: 110px;">Budget (Alt ➔ Neu)</th>
                    <th style="text-align: right; width: 90px;">Budget-Delta</th>
                    <th style="text-align: right; width: 110px;">Gesamt-Iststand</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Map alter Budgets aus SnapA
    const oldNodeBudgets = {};
    const oldZoneBudgets = {};
    if (snapA.snapshot_data) {
        (snapA.snapshot_data.nodes || []).forEach(n => {
            oldNodeBudgets[n.id] = (n.budget_design || 0) + (n.budget_drafting || 0);
        });
        (snapA.snapshot_data.zones || []).forEach(z => {
            oldZoneBudgets[z.id] = (z.budget_design || 0) + (z.budget_drafting || 0);
        });
    }

    // Rekursiver Tabellen-Renderer (sortiert Unterstrukturen intern absteigend)
    function renderZoneRows(zoneObj, level) {
        const z = zoneObj.zone;
        const zEffort = zoneObj.subtreeEffort;
        const curBud = (parseFloat(z.budget_design_hours) || 0) + (parseFloat(z.budget_drafting_hours) || 0);
        const oldBud = oldZoneBudgets[z.id] !== undefined ? oldZoneBudgets[z.id] : curBud;
        const diffBud = curBud - oldBud;

        let diffBudHtml = '<span style="color:#718096;">±0h</span>';
        if (diffBud > 0.01) diffBudHtml = `<span style="color:#e53e3e; font-weight:bold;">▲ +${formatHoursToHM(diffBud)}</span>`;
        else if (diffBud < -0.01) diffBudHtml = `<span style="color:#38a169; font-weight:bold;">▼ -${formatHoursToHM(Math.abs(diffBud))}</span>`;

        const indentPx = level * 18;
        const bgCol = level === 0 ? '#edf2f7' : '#f8fafc';
        const docLabel = z.doc_number ? `[${escapeHtml(z.doc_number)}] ` : '';

        tableHtml += `
            <tr style="background: ${bgCol}; font-weight: bold; border-top: 2px solid #cbd5e0;">
                <td style="padding-left: ${indentPx + 6}px;">
                    <span style="color:${z.color_hex || '#2b6cb0'}; font-size:13px; margin-right:4px;">📁</span>
                    ${docLabel}${escapeHtml(z.title)}
                </td>
                <td style="text-align: right; color:#2b6cb0; font-family:monospace; font-size:12px;">+${formatHoursToHM(zEffort)}</td>
                <td style="text-align: right; color:#4a5568; font-family:monospace;">${formatHoursToHM(oldBud)} ➔ ${formatHoursToHM(curBud)}</td>
                <td style="text-align: right;">${diffBudHtml}</td>
                <td style="text-align: right; color:#718096; font-family:monospace;">${formatHoursToHM(zEffort)}</td>
            </tr>
        `;

        // 1. Untergeordnete Blöcke nach Aufwand absteigend sortieren
        const childNodes = (currentNodes || [])
            .filter(n => n.zone_id === z.id && n.block_type !== 'note')
            .map(n => ({ node: n, effort: getNodeEffort(n.id) }));

        childNodes.sort((a, b) => b.effort - a.effort);

        childNodes.forEach(({ node: n, effort: nEffort }) => {
            const nCurBud = (parseFloat(n.budget_design_hours) || 0) + (parseFloat(n.budget_drafting_hours) || 0);
            const nOldBud = oldNodeBudgets[n.id] !== undefined ? oldNodeBudgets[n.id] : nCurBud;
            const nDiffBud = nCurBud - nOldBud;

            let nDiffHtml = '<span style="color:#a0aec0;">±0h</span>';
            if (nDiffBud > 0.01) nDiffHtml = `<span style="color:#e53e3e; font-weight:bold;">▲ +${formatHoursToHM(nDiffBud)}</span>`;
            else if (nDiffBud < -0.01) nDiffHtml = `<span style="color:#38a169; font-weight:bold;">▼ -${formatHoursToHM(Math.abs(nDiffBud))}</span>`;

            const nDoc = n.doc_number || (n.article_number ? `ART-${n.article_number}` : '');
            const nDocBadge = nDoc ? `<span style="font-family:monospace; font-size:9px; background:#e2e8f0; padding:1px 4px; border-radius:3px; margin-right:4px;">${escapeHtml(nDoc)}</span>` : '';
            const iconSvg = n.block_type === 'part' ? (window.CAD_ICONS ? CAD_ICONS.part : '⚙️') : (window.CAD_ICONS ? CAD_ICONS.assembly : '📦');

            tableHtml += `
                <tr>
                    <td style="padding-left: ${indentPx + 24}px;">
                        <span style="color:#a0aec0; margin-right:4px;">└──</span>
                        ${nDocBadge}${iconSvg} ${escapeHtml(n.name)}
                    </td>
                    <td style="text-align: right; font-weight:bold; color:${nEffort > 0 ? '#2d3748' : '#a0aec0'}; font-family:monospace;">+${formatHoursToHM(nEffort)}</td>
                    <td style="text-align: right; color:#718096; font-family:monospace;">${formatHoursToHM(nOldBud)} ➔ ${formatHoursToHM(nCurBud)}</td>
                    <td style="text-align: right;">${nDiffHtml}</td>
                    <td style="text-align: right; color:#718096; font-family:monospace;">${formatHoursToHM(nEffort)}</td>
                </tr>
            `;
        });

        // 2. Untergeordnete Rahmen ebenfalls absteigend nach Intervall-Aufwand sortieren
        const subZones = (currentZones || [])
            .filter(cz => cz.parent_zone_id === z.id)
            .map(cz => ({ zone: cz, subtreeEffort: calculateSubtreeIntervalEffort(cz.id) }));

        subZones.sort((a, b) => b.subtreeEffort - a.subtreeEffort);

        subZones.forEach(subZoneObj => renderZoneRows(subZoneObj, level + 1));
    }

    // Hauptdurchlauf: Oberste Rahmen ausgeben
    topZones.forEach(topZoneObj => {
        renderZoneRows(topZoneObj, 0);
    });

    // Freie Blöcke (ohne Rahmen) am Ende ausgeben
    const unzonedNodes = (currentNodes || [])
        .filter(n => !n.zone_id && n.block_type !== 'note')
        .map(n => ({ node: n, effort: getNodeEffort(n.id) }));

    if (unzonedNodes.length > 0) {
        unzonedNodes.sort((a, b) => b.effort - a.effort);
        const unzonedTotal = unzonedNodes.reduce((acc, curr) => acc + curr.effort, 0);

        tableHtml += `
            <tr style="background: #edf2f7; font-weight: bold; border-top: 2px solid #cbd5e0;">
                <td style="padding-left: 6px;">📌 Freie Blöcke (Ohne Rahmenzuweisung)</td>
                <td style="text-align: right; color:#2b6cb0; font-family:monospace; font-size:12px;">+${formatHoursToHM(unzonedTotal)}</td>
                <td colspan="3"></td>
            </tr>
        `;

        unzonedNodes.forEach(({ node: n, effort: nEffort }) => {
            const nCurBud = (parseFloat(n.budget_design_hours) || 0) + (parseFloat(n.budget_drafting_hours) || 0);
            const nOldBud = oldNodeBudgets[n.id] !== undefined ? oldNodeBudgets[n.id] : nCurBud;
            const nDiffBud = nCurBud - nOldBud;

            let nDiffHtml = '<span style="color:#a0aec0;">±0h</span>';
            if (nDiffBud > 0.01) nDiffHtml = `<span style="color:#e53e3e; font-weight:bold;">▲ +${formatHoursToHM(nDiffBud)}</span>`;
            else if (nDiffBud < -0.01) nDiffHtml = `<span style="color:#38a169; font-weight:bold;">▼ -${formatHoursToHM(Math.abs(nDiffBud))}</span>`;

            tableHtml += `
                <tr>
                    <td style="padding-left: 24px;">└── ${escapeHtml(n.name)}</td>
                    <td style="text-align: right; font-weight:bold; color:#2d3748; font-family:monospace;">+${formatHoursToHM(nEffort)}</td>
                    <td style="text-align: right; color:#718096; font-family:monospace;">${formatHoursToHM(nOldBud)} ➔ ${formatHoursToHM(nCurBud)}</td>
                    <td style="text-align: right;">${nDiffHtml}</td>
                    <td style="text-align: right; color:#718096; font-family:monospace;">${formatHoursToHM(nEffort)}</td>
                </tr>
            `;
        });
    }

    tableHtml += `</tbody></table>`;
    detailsContainer.innerHTML = tableHtml;
}

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Reporting (Horizontale Summenkacheln Nebeneinander)
 * ERSETZEN IN: report.js (Funktion renderReportSummary)
 * Zeitstempel: 2026-08-31 18:55:00 CEST
 * Breadcrumbs:
 *   - [2026-08-22 18:30:00 CEST]: Initiale Summenberechnung.
 *   - [2026-08-31 18:55:00 CEST]: Kacheln für CAD, Zeichnung und Gesamtaufwand
 *     strikte horizontale Anordnung (flex-row) mit flex: 1 zugewiesen.
 * =============================================================================
 */
function renderReportSummary(logs, timeframe) {
    const container = document.getElementById('repSummaryContainer');
    if (!container) return;

    let totalCAD = 0, totalDraft = 0;
    const weeklyData = {};

    logs.forEach(log => {
        const hrs = parseFloat(log.hours) || 0;
        if (log.task_type === 'design') totalCAD += hrs;
        if (log.task_type === 'drafting') totalDraft += hrs;

        if (timeframe === 'month' || timeframe === 'custom') {
            const kw = getISOWeekNumber(new Date(log.logged_at));
            if (!weeklyData[kw]) weeklyData[kw] = { cad: 0, draft: 0 };
            if (log.task_type === 'design') weeklyData[kw].cad += hrs;
            if (log.task_type === 'drafting') weeklyData[kw].draft += hrs;
        }
    });

    const cardsHtml = `
        <div style="display: flex; gap: 12px; width: 100%;">
            <div style="background: #edf2f7; padding: 10px 14px; border-radius: 6px; flex: 1; border: 1px solid #e2e8f0; min-width: 0;">
                <div style="font-size: 10px; color: #4a5568; text-transform: uppercase; font-weight: bold;">Summe CAD</div>
                <div style="font-size: 18px; font-weight: bold; color: #2b6cb0; margin-top: 2px;">${formatHoursToHM(totalCAD)}</div>
            </div>
            <div style="background: #edf2f7; padding: 10px 14px; border-radius: 6px; flex: 1; border: 1px solid #e2e8f0; min-width: 0;">
                <div style="font-size: 10px; color: #4a5568; text-transform: uppercase; font-weight: bold;">Summe Zeichnung</div>
                <div style="font-size: 18px; font-weight: bold; color: #38a169; margin-top: 2px;">${formatHoursToHM(totalDraft)}</div>
            </div>
            <div style="background: #2d3748; padding: 10px 14px; border-radius: 6px; flex: 1; min-width: 0;">
                <div style="font-size: 10px; color: #a0aec0; text-transform: uppercase; font-weight: bold;">Gesamtaufwand</div>
                <div style="font-size: 18px; font-weight: bold; color: #fff; margin-top: 2px;">${formatHoursToHM(totalCAD + totalDraft)}</div>
            </div>
        </div>
    `;

    let weekBreakdownHtml = '';
    if ((timeframe === 'month' || timeframe === 'custom') && Object.keys(weeklyData).length > 0) {
        weekBreakdownHtml = `<div style="width: 100%; margin-top: 8px; font-size: 11px;">`;
        weekBreakdownHtml += `<table class="log-table"><thead><tr><th>Kalenderwoche</th><th>CAD</th><th>Zeichnung</th><th>Summe KW</th></tr></thead><tbody>`;

        const sortedKWs = Object.keys(weeklyData).sort((a, b) => parseInt(a) - parseInt(b));
        sortedKWs.forEach(kw => {
            const wCAD = weeklyData[kw].cad;
            const wDraft = weeklyData[kw].draft;
            weekBreakdownHtml += `
                <tr>
                    <td><strong>KW ${kw}</strong></td>
                    <td style="color:#2b6cb0;">${formatHoursToHM(wCAD)}</td>
                    <td style="color:#38a169;">${formatHoursToHM(wDraft)}</td>
                    <td><strong>${formatHoursToHM(wCAD + wDraft)}</strong></td>
                </tr>
            `;
        });
        weekBreakdownHtml += `</tbody></table></div>`;
    }

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; width: 100%; gap: 6px;">
            ${cardsHtml}
            ${weekBreakdownHtml}
        </div>
    `;
}

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Reporting & Tabellen-Rendering (Zonen-Logs Auflösung)
 * ERSETZEN IN: report.js (Funktionen renderReportDetailsTable & generatePDF)
 * Zeitstempel: 2026-08-28 21:30:00 CEST
 * Breadcrumbs:
 *   - [2026-08-27 17:45:00 CEST]: Filter-Optionen 'today'/'yesterday'.
 *   - [2026-08-28 21:30:00 CEST]: Zonen-Logs Auflösung korrigiert. Wenn log.zone_id 
 *     vorliegt (node_id = null), wird der Rahmenname sauber als Bereich und 
 *     als Baugruppe "[Rahmen / Kasten]" ausgegeben, statt "-" und "Unbekannt".
 * =============================================================================
 */

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Reporting & Tabellen-Rendering (Zonen-Logs Textbereinigung)
 * ERSETZEN IN: report.js (Funktion renderReportDetailsTable)
 * Zeitstempel: 2026-08-28 20:33:00 CEST
 * Breadcrumbs:
 *   - [2026-08-28 21:30:00 CEST]: Zonen-Logs Auflösung korrigiert.
 *   - [2026-08-28 20:33:00 CEST]: Pin-Symbol und Zusatz "(Direktbuchung)" entfernt.
 *     Ausgabe erfolgt nun schlicht mit dem reinen Rahmen-/Zonennamen.
 * =============================================================================
 */

function renderReportDetailsTable(logs) {
    const container = document.getElementById('repDetailsContainer');
    if (logs.length === 0) {
        container.innerHTML = '<div style="font-size:12px; color:#718096; padding:10px;">Keine Zeiteinträge gefunden.</div>';
        return;
    }

    let html = `
    <table class="log-table">
      <thead>
        <tr>
          <th>Datum</th>
          <th>Kürzel</th>
          <th>Bereich / Rahmen</th>
          <th>Baugruppe</th>
          <th>Kat.</th>
          <th>Zeit</th>
          <th>Kommentar</th>
        </tr>
      </thead>
      <tbody>
    `;

    logs.forEach(log => {
        let nodeName = 'Unbekannt';
        let zoneName = '-';

        if (log.node_id) {
            const node = currentNodes.find(n => n.id === log.node_id);
            if (node) {
                nodeName = node.name;
                if (node.zone_id) {
                    const zone = currentZones.find(z => z.id === node.zone_id);
                    if (zone) zoneName = zone.title;
                }
            }
        } else if (log.zone_id) {
            const zone = currentZones.find(z => z.id === log.zone_id);
            if (zone) {
                zoneName = zone.title;
                nodeName = zone.title;
            }
        }

        const d = new Date(log.logged_at);
        const dateStr = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;

        let kat = log.task_type === 'design' ? '<span style="color:#2b6cb0; font-weight:bold;">CAD</span>' :
            (log.task_type === 'drafting' ? '<span style="color:#38a169; font-weight:bold;">Zeichn.</span>' : 'Status');

        let timeStr = formatHoursToHM(log.hours);
        if (log.task_type === 'completion') {
            timeStr = log.note && (log.note.includes('Revision') || log.note.includes('Ablehnen')) ? '↺' : '✔';
        }

        html += `
        <tr>
          <td>${dateStr}</td>
          <td><strong>${escapeHtml(log.user_code)}</strong></td>
          <td style="color:#718096;">${escapeHtml(zoneName)}</td>
          <td>${escapeHtml(nodeName)}</td>
          <td>${kat}</td>
          <td><strong>${timeStr}</strong></td>
          <td style="color:#718096; font-style:italic;">${escapeHtml(log.note || '-')}</td>
        </tr>
        `;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// =============================================================================
// 4. PDF EXPORT GENERATOR
// =============================================================================
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Reporting & PDF Export (Textbereinigung & Zonen-Konsistenz)
 * ERSETZEN IN: report.js (Funktion generatePDF)
 * Zeitstempel: 2026-08-30 22:18:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 22:05:00 CEST]: Zonen-Sortierung harmonisiert.
 *   - [2026-08-30 22:18:00 CEST]: PDF-Tabelle bereinigt: Zonen-Direktbuchungen 
 *     geben analog zur HTML-Ansicht den reinen Namen ohne '📍 (Direktbuchung)' aus.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Reporting & PDF Export (KW-Aufschlüsselung & Horizontale Summen)
 * ERSETZEN IN: report.js (Funktion generatePDF)
 * Zeitstempel: 2026-08-31 19:00:00 CEST
 * Breadcrumbs:
 *   - [2026-08-30 22:18:00 CEST]: PDF-Tabelle bereinigt.
 *   - [2026-08-31 19:00:00 CEST]: 1. KW-Wochenaufschlüsselung bei Monats- und 
 *     benutzerdefinierten Zeiträumen in den PDF-Export integriert.
 *     2. Summenkacheln im PDF einheitlich 3-spaltig (CAD, Zeichnung, Gesamt) ausgerichtet.
 * =============================================================================
 */
window.generatePDF = async function () {
    const btn = document.getElementById('btnExportPDF');
    if (!btn) return;

    const originalText = btn.innerText;
    btn.innerText = 'Wird generiert...';
    btn.disabled = true;

    try {
        const pData = reportState.projData;
        const selUser = document.getElementById('repFilterUser');
        const filterUserName = selUser.options[selUser.selectedIndex].text;
        const timeframe = document.getElementById('repTimeframe').value;

        const dStart = `${reportState.startDate.getDate().toString().padStart(2, '0')}.${(reportState.startDate.getMonth() + 1).toString().padStart(2, '0')}.${reportState.startDate.getFullYear()}`;
        const dEnd = `${reportState.endDate.getDate().toString().padStart(2, '0')}.${(reportState.endDate.getMonth() + 1).toString().padStart(2, '0')}.${reportState.endDate.getFullYear()}`;

        const safeProjName = pData.name.replace(/[^a-zA-Z0-9\-_ÄÖÜäöü]/g, '_');
        const exportFileName = `Auswertung_${pData.obj}_${safeProjName}_${dEnd}.pdf`;

        const pieDUrl = createPieChartImage(pData.spentD, pData.budD, '#3182ce');
        const pieDrUrl = createPieChartImage(pData.spentDr, pData.budDr, '#38a169');

        const pdfContainer = document.createElement('div');
        pdfContainer.style.width = '750px';
        pdfContainer.style.background = '#fff';
        pdfContainer.style.boxSizing = 'border-box';

        const pdfCss = `
            <style>
                .pdf-page { background: white; padding: 30px; box-sizing: border-box; font-family: Arial, sans-serif; font-size: 11px; line-height: 1.5; color: #333; }
                .pdf-header { border-bottom: 2px solid #3182ce; padding-bottom: 10px; margin-bottom: 15px; }
                .pdf-header h1 { color: #2c3e50; margin: 0 0 4px 0; font-size: 20px; }
                .pdf-header-meta { display: flex; justify-content: space-between; font-size: 10px; color: #666; }
                .pdf-section-title { background: #f4f4f9; padding: 6px 10px; font-size: 12px; border-left: 4px solid; margin: 0 0 10px 0; color: #2c3e50; font-weight: bold; }
                .pdf-box { background: #f9f9f9; padding: 10px 14px; border-radius: 4px; margin-bottom: 12px; border: 1px solid #edf2f7; }
                table { width: 100%; border-collapse: collapse; font-size: 10px; }
                th, td { border-bottom: 1px solid #edf2f7; padding: 6px 4px; text-align: left; }
                th { background: #f7fafc; color: #4a5568; font-weight: bold; }
            </style>
        `;

        const pageHeader = `
            <div class="pdf-header">
                <h1>Projekt-Controlling & Zeitauswertung</h1>
                <div class="pdf-header-meta">
                    <div><strong>Projekt:</strong> ${pData.obj} - ${pData.name}</div>
                    <div><strong>Auswertungszeitraum:</strong> ${dStart} bis ${dEnd}</div>
                    <div><strong>Generiert am:</strong> ${new Date().toLocaleDateString('de-DE')}</div>
                </div>
            </div>
        `;

        let tableRows = '';
        let filterTotalD = 0, filterTotalDr = 0;
        const weeklyData = {};

        reportState.logs.forEach(log => {
            let nodeName = 'Unbekannt';
            let zoneName = '-';

            if (log.node_id) {
                const node = currentNodes.find(n => n.id === log.node_id);
                if (node) {
                    nodeName = node.name;
                    if (node.zone_id) {
                        const zone = currentZones.find(z => z.id === node.zone_id);
                        if (zone) zoneName = zone.title;
                    }
                }
            } else if (log.zone_id) {
                const zone = currentZones.find(z => z.id === log.zone_id);
                if (zone) {
                    zoneName = zone.title;
                    nodeName = zone.title;
                }
            }

            const d = new Date(log.logged_at);
            const dateStr = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            let kat = log.task_type === 'design' ? 'CAD' : (log.task_type === 'drafting' ? 'Zeichnung' : 'Status');
            let timeStr = formatHoursToHM(log.hours);

            const hrs = parseFloat(log.hours) || 0;
            if (log.task_type === 'completion') {
                timeStr = 'Status-Flag';
            } else {
                if (log.task_type === 'design') filterTotalD += hrs;
                if (log.task_type === 'drafting') filterTotalDr += hrs;

                if (timeframe === 'month' || timeframe === 'custom') {
                    const kw = getISOWeekNumber(d);
                    if (!weeklyData[kw]) weeklyData[kw] = { cad: 0, draft: 0 };
                    if (log.task_type === 'design') weeklyData[kw].cad += hrs;
                    if (log.task_type === 'drafting') weeklyData[kw].draft += hrs;
                }
            }

            tableRows += `
                <tr>
                    <td>${dateStr}</td>
                    <td><strong>${escapeHtml(log.user_code)}</strong></td>
                    <td style="color:#718096;">${escapeHtml(zoneName)}</td>
                    <td>${escapeHtml(nodeName)}</td>
                    <td>${kat}</td>
                    <td><strong>${timeStr}</strong></td>
                    <td style="color:#718096; font-style:italic;">${escapeHtml(log.note || '-')}</td>
                </tr>
            `;
        });

        // Kalenderwochen-Tabelle für das PDF aufbereiten
        let pdfWeeklyHtml = '';
        if ((timeframe === 'month' || timeframe === 'custom') && Object.keys(weeklyData).length > 0) {
            pdfWeeklyHtml = `
                <div class="pdf-section-title" style="border-color: #3182ce; margin-top: 15px;">Wochenaufschlüsselung (Kalenderwochen)</div>
                <table style="margin-bottom: 15px;">
                    <thead>
                        <tr>
                            <th style="width: 25%;">Kalenderwoche</th>
                            <th style="width: 25%;">CAD</th>
                            <th style="width: 25%;">Zeichnung</th>
                            <th style="width: 25%;">Summe KW</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            const sortedKWs = Object.keys(weeklyData).sort((a, b) => parseInt(a) - parseInt(b));
            sortedKWs.forEach(kw => {
                const wCAD = weeklyData[kw].cad;
                const wDraft = weeklyData[kw].draft;
                pdfWeeklyHtml += `
                    <tr>
                        <td><strong>KW ${kw}</strong></td>
                        <td style="color:#2b6cb0;">${formatHoursToHM(wCAD)}</td>
                        <td style="color:#38a169;">${formatHoursToHM(wDraft)}</td>
                        <td><strong>${formatHoursToHM(wCAD + wDraft)}</strong></td>
                    </tr>
                `;
            });

            pdfWeeklyHtml += `</tbody></table>`;
        }

        pdfContainer.innerHTML = pdfCss + `
            <div class="pdf-page">
                ${pageHeader}
                
                <div class="pdf-section-title" style="border-color: #3182ce;">Gesamtprojekt-Status zum Stichtag (${dEnd})</div>
                <div class="pdf-box" style="display: flex; gap: 40px; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="${pieDUrl}" style="width: 50px; height: 50px;">
                        <div>
                            <div style="font-size:10px; color:#a0aec0; text-transform:uppercase; font-weight:bold;">Total CAD</div>
                            <div style="font-size:13px; color:#2c3e50;"><strong>${formatHoursToHM(pData.spentD)}</strong> von ${formatHoursToHM(pData.budD)}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="${pieDrUrl}" style="width: 50px; height: 50px;">
                        <div>
                            <div style="font-size:10px; color:#a0aec0; text-transform:uppercase; font-weight:bold;">Total Zeichnung</div>
                            <div style="font-size:13px; color:#2c3e50;"><strong>${formatHoursToHM(pData.spentDr)}</strong> von ${formatHoursToHM(pData.budDr)}</div>
                        </div>
                    </div>
                </div>

                <div class="pdf-section-title" style="border-color: #e67e22; margin-top: 15px;">Gefilterter Aufwand: ${filterUserName}</div>
                <div class="pdf-box" style="display: flex; gap: 20px; justify-content: space-between;">
                    <div><strong>Summe CAD:</strong> <span style="color:#2b6cb0; font-size: 13px;">${formatHoursToHM(filterTotalD)}</span></div>
                    <div><strong>Summe Zeichnung:</strong> <span style="color:#38a169; font-size: 13px;">${formatHoursToHM(filterTotalDr)}</span></div>
                    <div><strong>Gesamtaufwand:</strong> <span style="color:#2d3748; font-weight: bold; font-size: 13px;">${formatHoursToHM(filterTotalD + filterTotalDr)}</span></div>
                </div>

                ${pdfWeeklyHtml}

                <div class="pdf-section-title" style="border-color: #4a5568; margin-top: 15px;">Logbuch-Auszug</div>
                <table>
                    <thead>
                        <tr>
                            <th>Datum</th><th>User</th><th>Bereich</th><th>Baugruppe</th><th>Kat.</th><th>Dauer</th><th>Kommentar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows || '<tr><td colspan="7">Keine Einträge vorhanden.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;

        const opt = {
            margin: [10, 10, 15, 10],
            filename: exportFileName,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const worker = html2pdf().set(opt).from(pdfContainer).toPdf().get('pdf').then((pdf) => {
            const totalPages = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(9);
                pdf.setTextColor(130, 130, 130);
                pdf.text(`Seite ${i} von ${totalPages}`, pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 8, { align: 'center' });
            }
        }).save();

        await worker;

        btn.innerText = originalText;
        btn.disabled = false;

    } catch (error) {
        console.error("PDF Generierungsfehler:", error);
        alert("Es ist ein Fehler beim PDF-Export aufgetreten.");
        btn.innerText = originalText;
        btn.disabled = false;
    }
};