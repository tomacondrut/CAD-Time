/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Reporting, Stichtags-Rekonstruktion, Status-Tracking & PDF-Export
 * ERSETZEN IN: report.js (Gesamte Datei komplett ersetzen)
 * Zeitstempel: 2026-10-03 09:25:00 CEST
 * Breadcrumbs:
 *   - [2026-08-22 bis 2026-08-31]: Initiale Stichtags-Engine, Zonen-Sortierung,
 *     KW-Aufschlüsselung und 3-spaltige Summenkacheln.
 *   - [2026-09-27 16:35:00 CEST]: Hierarchischer Rollup ab oberstem Rahmen,
 *     Top-Down Sortierung nach Aufwand und Snapshot-B-Differenzmatrix.
 *   - [2026-10-03 08:48:00 CEST]: Inline Data-Bars mit Überhangs- und Null-Budget-Schutz.
 *   - [2026-10-03 09:25:00 CEST]: VOLLSTÄNDIGER STATUS-AUSBAU:
 *     1. Status-Erkennung (Erledigt ✅ / Freigabe ⏳ / Offen %) für Blöcke & Zonen.
 *     2. Zonen-Fertigstellungszähler (z.B. "3/4 Erledigt").
 *     3. FilterrepFilterStatus für gezieltes Controlling offener vs. erledigter Elemente.
 *     4. Top-5 Kostentreiber-Balkendiagramm und Section-Toggles integriert.
 * =============================================================================
 */

// =============================================================================
// 1. DATUMS- & ZEITHILFEN
// =============================================================================

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

function formatDateForInput(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// =============================================================================
// 2. INITIALISIERUNG & FILTER-STEUERUNG
// =============================================================================

window.openReportModal = function () {
    populateReportFilters();

    const timeframeSelect = document.getElementById('repTimeframe');
    if (timeframeSelect) timeframeSelect.value = 'today';

    handleTimeframeChange();

    const btnPdf = document.getElementById('btnExportPDF');
    if (btnPdf) btnPdf.style.display = 'inline-block';

    if (typeof window.toggleReportSections === 'function') {
        window.toggleReportSections();
    }

    openModal('reportModal');
};

window.populateReportFilters = function () {
    const selUser = document.getElementById('repFilterUser');
    const selZone = document.getElementById('repFilterZone');
    const selBlock = document.getElementById('repFilterBlock');
    const selStatus = document.getElementById('repFilterStatus');

    if (selUser) {
        selUser.innerHTML = '';
        if (isAdmin) {
            selUser.add(new Option('Alle Mitarbeiter', 'all'));
            (currentUsers || []).forEach(u => selUser.add(new Option(u.code, u.code)));
            selUser.disabled = false;
            selUser.value = 'all';
        } else {
            selUser.add(new Option(activeUserCode || 'COT', activeUserCode || 'COT'));
            selUser.value = activeUserCode || 'COT';
            selUser.disabled = true;
        }
    }

    if (selZone) {
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
    }

    if (selBlock) {
        selBlock.innerHTML = '<option value="all">Alle Blöcke</option>';
        (currentNodes || []).forEach(n => {
            if (n.block_type === 'note') return;
            const type = n.block_type === 'part' ? 'Bauteil' : 'Baugruppe';
            selBlock.add(new Option(`[${type}] ${n.name}`, n.id));
        });
    }

    if (selStatus) {
        selStatus.value = 'all';
    }
};

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

window.toggleReportSections = function () {
    const tStatus = document.getElementById('repToggleStatus');
    const tSummary = document.getElementById('repToggleSummary');
    const tTable = document.getElementById('repToggleTable');

    const sStatus = document.getElementById('repSectionStatus');
    const sSummary = document.getElementById('repSectionSummary');
    const sTable = document.getElementById('repSectionTable');

    if (sStatus && tStatus) sStatus.style.display = tStatus.checked ? 'block' : 'none';
    if (sSummary && tSummary) sSummary.style.display = tSummary.checked ? 'block' : 'none';
    if (sTable && tTable) sTable.style.display = tTable.checked ? 'flex' : 'none';
};

// Canvas Donut-Chart Generator für HTML & PDF
function createPieChartImage(spent, budget, baseColor) {
    const cvs = document.createElement('canvas');
    cvs.width = 120;
    cvs.height = 120;
    const ctx = cvs.getContext('2d');

    const b = Math.max(0.1, parseFloat(budget) || 1);
    const pct = Math.min((spent / b), 1);
    const isOver = spent > b;
    const fillCol = isOver ? '#e53e3e' : baseColor;

    // Hintergrund
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

    // Inneres Loch
    ctx.beginPath();
    ctx.arc(60, 60, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Zentrierter Prozentwert
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(pct * 100)}%`, 60, 60);

    return cvs.toDataURL('image/png');
}

// =============================================================================
// 3. DATENAUFBEREITUNG & HAUPT-DISPATCHER
// =============================================================================

let reportState = { logs: [], startDate: null, endDate: null, projData: null };

window.updateReportData = function () {
    const filterUser = document.getElementById('repFilterUser')?.value || 'all';
    const timeframe = document.getElementById('repTimeframe')?.value || 'today';
    const filterZone = document.getElementById('repFilterZone')?.value || 'all';
    const filterBlock = document.getElementById('repFilterBlock')?.value || 'all';

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
            endDate = new Date();
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
        const sVal = document.getElementById('repStartDate')?.value;
        const eVal = document.getElementById('repEndDate')?.value;
        startDate = sVal ? new Date(sVal + 'T00:00:00Z') : new Date(0);
        endDate = eVal ? new Date(eVal + 'T23:59:59Z') : new Date();
    }

    // 1. Stichtags-Rekonstruktion Gesamtprojekt
    const proj = getCurrentProject();
    let projTotalD = 0, projTotalDr = 0;

    (currentTimeLogs || []).filter(l => new Date(l.logged_at) <= endDate).forEach(l => {
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

    const statusContainer = document.getElementById('repProjectStatusContainer');
    if (statusContainer) {
        statusContainer.innerHTML = `
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
    }

    // 2. Gefilterte Logs für das gewählte Intervall
    let filteredLogs = (currentTimeLogs || []).filter(log => {
        const logDate = new Date(log.logged_at);
        if (logDate < startDate || logDate > endDate) return false;
        if (filterUser !== 'all' && log.user_code !== filterUser) return false;
        if (filterBlock !== 'all' && log.node_id !== filterBlock) return false;

        if (filterZone !== 'all') {
            if (log.zone_id && log.zone_id === filterZone) return true;
            const node = (currentNodes || []).find(n => n.id === log.node_id);
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

// =============================================================================
// 4. REVIEW-SNAPSHOT VERGLEICHS-REPORT (MIT STATUS & HIERARCHIE)
// =============================================================================

function renderSnapshotReviewReport(snapA, snapB, intervalLogs, startDate, endDate) {
    const summaryContainer = document.getElementById('repSummaryContainer');
    const detailsContainer = document.getElementById('repDetailsContainer');
    const filterStatus = document.getElementById('repFilterStatus')?.value || 'all';
    if (!summaryContainer || !detailsContainer) return;

    // Ermittelt Status und Fortschritt zum gewählten Stichtag (Snapshot B oder Live)
    const getNodeStatus = (nodeId) => {
        if (snapB && snapB.snapshot_data && snapB.snapshot_data.nodes) {
            const snapNode = snapB.snapshot_data.nodes.find(x => x.id === nodeId);
            if (snapNode) {
                return {
                    status: snapNode.completion_status || 'open',
                    pDesign: snapNode.progress_design || 0,
                    pDrafting: snapNode.progress_drafting || 0
                };
            }
        }
        const liveNode = (currentNodes || []).find(x => x.id === nodeId);
        return {
            status: liveNode ? (liveNode.completion_status || 'open') : 'open',
            pDesign: liveNode ? (liveNode.progress_design || 0) : 0,
            pDrafting: liveNode ? (liveNode.progress_drafting || 0) : 0
        };
    };

    // 1. Intervall-Stunden pro Element berechnen
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
        } else if (l.zone_id) {
            if (!intervalHoursZone[l.zone_id]) intervalHoursZone[l.zone_id] = { cad: 0, draft: 0, total: 0 };
            if (l.task_type === 'design') intervalHoursZone[l.zone_id].cad += hrs;
            if (l.task_type === 'drafting') intervalHoursZone[l.zone_id].draft += hrs;
            intervalHoursZone[l.zone_id].total += hrs;
        }
    });

    // 2. Kumulierte Gesamtstunden bis Stichtag (Spalte 5)
    const totalSpentToDateNode = {};
    const totalSpentToDateZone = {};

    (currentTimeLogs || []).forEach(l => {
        if (new Date(l.logged_at) <= endDate) {
            const hrs = parseFloat(l.hours) || 0;
            if (l.node_id) {
                totalSpentToDateNode[l.node_id] = (totalSpentToDateNode[l.node_id] || 0) + hrs;
            } else if (l.zone_id) {
                totalSpentToDateZone[l.zone_id] = (totalSpentToDateZone[l.zone_id] || 0) + hrs;
            }
        }
    });

    const getZoneDirectEffort = (zId) => (intervalHoursZone[zId]?.total || 0);
    const getNodeEffort = (nId) => (intervalHoursNode[nId]?.total || 0);

    function calculateSubtreeIntervalEffort(zoneId) {
        let sum = getZoneDirectEffort(zoneId);
        (currentNodes || []).filter(n => n.zone_id === zoneId && n.block_type !== 'note').forEach(n => {
            sum += getNodeEffort(n.id);
        });
        (currentZones || []).filter(z => z.parent_zone_id === zoneId).forEach(cz => {
            sum += calculateSubtreeIntervalEffort(cz.id);
        });
        return sum;
    }

    function calculateSubtreeTotalSpent(zoneId) {
        let sum = totalSpentToDateZone[zoneId] || 0;
        (currentNodes || []).filter(n => n.zone_id === zoneId && n.block_type !== 'note').forEach(n => {
            sum += (totalSpentToDateNode[n.id] || 0);
        });
        (currentZones || []).filter(z => z.parent_zone_id === zoneId).forEach(cz => {
            sum += calculateSubtreeTotalSpent(cz.id);
        });
        return sum;
    }

    function getZoneCompletionStats(zoneId) {
        let total = 0, done = 0;
        (currentNodes || []).filter(n => n.zone_id === zoneId && n.block_type !== 'note').forEach(n => {
            total++;
            const st = getNodeStatus(n.id);
            if (st.status === 'completed' || (st.pDesign === 100 && st.pDrafting === 100)) done++;
        });
        (currentZones || []).filter(z => z.parent_zone_id === zoneId).forEach(cz => {
            const sub = getZoneCompletionStats(cz.id);
            total += sub.total;
            done += sub.done;
        });
        return { total, done };
    }

    const topZones = (currentZones || []).filter(z => !z.parent_zone_id).map(z => ({
        zone: z,
        subtreeEffort: calculateSubtreeIntervalEffort(z.id)
    }));
    topZones.sort((a, b) => b.subtreeEffort - a.subtreeEffort);

    let globalTotalNodes = 0, globalDoneNodes = 0;
    (currentNodes || []).filter(n => n.block_type !== 'note').forEach(n => {
        globalTotalNodes++;
        const st = getNodeStatus(n.id);
        if (st.status === 'completed' || (st.pDesign === 100 && st.pDrafting === 100)) globalDoneNodes++;
    });

    const sADateStr = new Date(snapA.review_date).toLocaleDateString('de-DE');
    const sBDateStr = snapB ? new Date(snapB.review_date).toLocaleDateString('de-DE') : 'Heute (Live)';
    const sBTitle = snapB ? snapB.title : 'Live-Stand';

    // 4. Header-Kacheln mit KPI
    summaryContainer.innerHTML = `
        <div style="background: #ebf8ff; border: 1px solid #bee3f8; border-radius: 6px; padding: 10px 14px; margin-bottom: 8px;">
            <div style="font-size: 11px; font-weight: bold; color: #2b6cb0;">
                🚩 REVIEW-INTERVALL: ${escapeHtml(snapA.title)} (${sADateStr}) ➔ ${escapeHtml(sBTitle)} (${sBDateStr})
            </div>
            ${snapA.note ? `<div style="font-size: 11px; color: #4a5568; margin-top: 2px;"><em>Notiz: ${escapeHtml(snapA.note)}</em></div>` : ''}
        </div>
        <div style="display: flex; gap: 10px; width: 100%; margin-bottom: 8px; flex-wrap: wrap;">
            <div style="background: #edf2f7; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 140px; border: 1px solid #e2e8f0;">
                <div style="font-size: 10px; color: #4a5568; text-transform: uppercase; font-weight: bold;">Zusätzliches CAD</div>
                <div style="font-size: 16px; font-weight: bold; color: #2b6cb0; margin-top: 2px;">+${formatHoursToHM(totalCAD)}</div>
            </div>
            <div style="background: #edf2f7; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 140px; border: 1px solid #e2e8f0;">
                <div style="font-size: 10px; color: #4a5568; text-transform: uppercase; font-weight: bold;">Zusätzliche Zeichn.</div>
                <div style="font-size: 16px; font-weight: bold; color: #38a169; margin-top: 2px;">+${formatHoursToHM(totalDraft)}</div>
            </div>
            <div style="background: #2d3748; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 140px;">
                <div style="font-size: 10px; color: #a0aec0; text-transform: uppercase; font-weight: bold;">Intervall Gesamt</div>
                <div style="font-size: 16px; font-weight: bold; color: #fff; margin-top: 2px;">+${formatHoursToHM(totalCAD + totalDraft)}</div>
            </div>
            <div style="background: #f0fff4; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 140px; border: 1px solid #c6f6d5;">
                <div style="font-size: 10px; color: #276749; text-transform: uppercase; font-weight: bold;">Erledigte Baugruppen</div>
                <div style="font-size: 16px; font-weight: bold; color: #22543d; margin-top: 2px;">
                    ${globalDoneNodes} / ${globalTotalNodes} <span style="font-size: 11px; font-weight: normal; color: #2f855a;">(${globalTotalNodes > 0 ? Math.round((globalDoneNodes / globalTotalNodes) * 100) : 0}%)</span>
                </div>
            </div>
        </div>
    `;

    // 5. Strukturierte Tabelle
    let tableHtml = `
        <table class="log-table">
            <thead>
                <tr>
                    <th>Bereich / Baugruppe (Sortiert nach Aufwand)</th>
                    <th style="text-align: right; width: 110px;">Im Intervall gebucht</th>
                    <th style="text-align: right; width: 120px;">Budget (Alt ➔ Neu)</th>
                    <th style="text-align: right; width: 90px;">Budget-Delta</th>
                    <th style="text-align: right; width: 110px;">Gesamt-Iststand</th>
                </tr>
            </thead>
            <tbody>
    `;

    const oldNodeBudgets = {};
    const oldZoneBudgets = {};
    const newNodeBudgets = {};
    const newZoneBudgets = {};

    if (snapA.snapshot_data) {
        (snapA.snapshot_data.nodes || []).forEach(n => { oldNodeBudgets[n.id] = (n.budget_design || 0) + (n.budget_drafting || 0); });
        (snapA.snapshot_data.zones || []).forEach(z => { oldZoneBudgets[z.id] = (z.budget_design || 0) + (z.budget_drafting || 0); });
    }

    if (snapB && snapB.snapshot_data) {
        (snapB.snapshot_data.nodes || []).forEach(n => { newNodeBudgets[n.id] = (n.budget_design || 0) + (n.budget_drafting || 0); });
        (snapB.snapshot_data.zones || []).forEach(z => { newZoneBudgets[z.id] = (z.budget_design || 0) + (z.budget_drafting || 0); });
    }

    function renderZoneRows(zoneObj, level) {
        const z = zoneObj.zone;
        const zEffort = zoneObj.subtreeEffort;
        const zTotalSpent = calculateSubtreeTotalSpent(z.id);
        const zComp = getZoneCompletionStats(z.id);

        const curBud = newZoneBudgets[z.id] !== undefined
            ? newZoneBudgets[z.id]
            : (parseFloat(z.budget_design_hours) || 0) + (parseFloat(z.budget_drafting_hours) || 0);

        const oldBud = oldZoneBudgets[z.id] !== undefined ? oldZoneBudgets[z.id] : curBud;
        const diffBud = curBud - oldBud;

        let diffBudHtml = '<span style="color:#718096;">±0h</span>';
        if (diffBud > 0.01) diffBudHtml = `<span style="color:#e53e3e; font-weight:bold;">▲ +${formatHoursToHM(diffBud)}</span>`;
        else if (diffBud < -0.01) diffBudHtml = `<span style="color:#38a169; font-weight:bold;">▼ -${formatHoursToHM(Math.abs(diffBud))}</span>`;

        const indentPx = level * 18;
        const bgCol = level === 0 ? '#edf2f7' : '#f8fafc';
        const docLabel = z.doc_number ? `[${escapeHtml(z.doc_number)}] ` : '';

        let zoneDoneBadge = '';
        if (zComp.total > 0) {
            const isAllDone = (zComp.done === zComp.total);
            const badgeBg = isAllDone ? '#c6f6d5' : '#e2e8f0';
            const badgeCol = isAllDone ? '#22543d' : '#4a5568';
            zoneDoneBadge = `<span style="font-size: 9px; font-weight: bold; background: ${badgeBg}; color: ${badgeCol}; padding: 1px 6px; border-radius: 10px; margin-left: 6px;">${isAllDone ? '✅ Alle ' : ''}${zComp.done}/${zComp.total} Erledigt</span>`;
        }

        tableHtml += `
            <tr style="background: ${bgCol}; font-weight: bold; border-top: 2px solid #cbd5e0;">
                <td style="padding-left: ${indentPx + 6}px; padding-top: 6px; padding-bottom: 6px;">
                    <span style="color:${z.color_hex || '#2b6cb0'}; font-size:13px; margin-right:4px;">📁</span>
                    ${docLabel}${escapeHtml(z.title)}
                    ${zoneDoneBadge}
                </td>
                <td style="text-align: right; color:#2b6cb0; font-family:monospace; font-size:12px;">+${formatHoursToHM(zEffort)}</td>
                <td style="text-align: right; color:#4a5568; font-family:monospace;">${formatHoursToHM(oldBud)} ➔ ${formatHoursToHM(curBud)}</td>
                <td style="text-align: right;">${diffBudHtml}</td>
                <td style="text-align: right; color:#2d3748; font-family:monospace; font-weight:bold;">${formatHoursToHM(zTotalSpent)}</td>
            </tr>
        `;

        const childNodes = (currentNodes || [])
            .filter(n => n.zone_id === z.id && n.block_type !== 'note')
            .map(n => ({ node: n, effort: getNodeEffort(n.id) }));

        childNodes.sort((a, b) => b.effort - a.effort);

        childNodes.forEach(({ node: n, effort: nEffort }) => {
            const nSt = getNodeStatus(n.id);
            const isDone = (nSt.status === 'completed') || (nSt.pDesign === 100 && nSt.pDrafting === 100);
            const isPending = (nSt.status === 'pending_approval');

            if (filterStatus === 'completed' && !isDone) return;
            if (filterStatus === 'open' && isDone) return;

            const nTotal = totalSpentToDateNode[n.id] || 0;
            const nCurBud = newNodeBudgets[n.id] !== undefined
                ? newNodeBudgets[n.id]
                : (parseFloat(n.budget_design_hours) || 0) + (parseFloat(n.budget_drafting_hours) || 0);

            const nOldBud = oldNodeBudgets[n.id] !== undefined ? oldNodeBudgets[n.id] : nCurBud;
            const nDiffBud = nCurBud - nOldBud;

            let nDiffHtml = '<span style="color:#a0aec0;">±0h</span>';
            if (nDiffBud > 0.01) nDiffHtml = `<span style="color:#e53e3e; font-weight:bold;">▲ +${formatHoursToHM(nDiffBud)}</span>`;
            else if (nDiffBud < -0.01) nDiffHtml = `<span style="color:#38a169; font-weight:bold;">▼ -${formatHoursToHM(Math.abs(nDiffBud))}</span>`;

            const nDoc = n.doc_number || (n.article_number ? `ART-${n.article_number}` : '');
            const nDocBadge = nDoc ? `<span style="font-family:monospace; font-size:9px; background:#e2e8f0; padding:1px 4px; border-radius:3px; margin-right:4px;">${escapeHtml(nDoc)}</span>` : '';
            const iconSvg = n.block_type === 'part' ? (window.CAD_ICONS ? CAD_ICONS.part : '⚙️') : (window.CAD_ICONS ? CAD_ICONS.assembly : '📦');

            let statusBadge = '';
            if (isDone) {
                statusBadge = `<span style="font-size:9px; font-weight:bold; background:#c6f6d5; color:#22543d; padding:1px 6px; border-radius:3px; margin-left:6px; display:inline-flex; align-items:center; gap:2px;">✅ Erledigt</span>`;
            } else if (isPending) {
                statusBadge = `<span style="font-size:9px; font-weight:bold; background:#feebc8; color:#c05621; padding:1px 6px; border-radius:3px; margin-left:6px; display:inline-flex; align-items:center; gap:2px;">⏳ Freigabe</span>`;
            } else {
                const totalPct = Math.round((nSt.pDesign * 0.5) + (nSt.pDrafting * 0.5));
                statusBadge = `<span style="font-size:9px; color:#718096; background:#edf2f7; padding:1px 5px; border-radius:3px; margin-left:6px;">${totalPct}%</span>`;
            }

            const hasBudget = nCurBud > 0;
            const actualPct = hasBudget ? Math.round((nTotal / nCurBud) * 100) : 0;
            const barWidthPct = hasBudget ? Math.min(actualPct, 100) : (nTotal > 0 ? 100 : 0);
            const isOver = hasBudget && (nTotal > nCurBud);
            const barColor = isDone ? '#38a169' : (!hasBudget ? '#a0aec0' : (isOver ? '#e53e3e' : '#3182ce'));
            const pctLabel = hasBudget ? `${actualPct}%` : '—';

            tableHtml += `
                <tr style="transition: background 0.15s ease;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                    <td style="padding-left: ${indentPx + 24}px; padding-top: 6px; padding-bottom: 6px;">
                        <span style="color:#a0aec0; margin-right:4px;">└──</span>
                        ${nDocBadge}${iconSvg} ${escapeHtml(n.name)}
                        ${statusBadge}
                    </td>
                    <td style="text-align: right; font-weight:bold; color:${nEffort > 0 ? '#2b6cb0' : '#a0aec0'}; font-family:monospace;">+${formatHoursToHM(nEffort)}</td>
                    <td style="text-align: right; color:#718096; font-family:monospace;">${formatHoursToHM(nOldBud)} ➔ ${formatHoursToHM(nCurBud)}</td>
                    <td style="text-align: right;">${nDiffHtml}</td>
                    <td style="text-align: right; color:#4a5568; font-family:monospace; padding-right: 15px;">
                        <div style="display:flex; flex-direction:column; align-items:flex-end;">
                            <div style="display:flex; justify-content:space-between; width:100%; max-width:95px; font-size:10px; margin-bottom: 2px;">
                                <span style="font-weight:bold; color:${isOver ? '#e53e3e' : '#2d3748'};">${formatHoursToHM(nTotal)}</span>
                                <span style="font-weight:${isOver ? 'bold' : 'normal'}; color:${isOver ? '#e53e3e' : '#718096'};">${pctLabel}</span>
                            </div>
                            <div style="width: 100%; max-width: 95px; height: 5px; background: #edf2f7; border-radius: 3px; overflow: hidden;">
                                <div style="width: ${barWidthPct}%; height: 100%; background: ${barColor};"></div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });

        const subZones = (currentZones || [])
            .filter(cz => cz.parent_zone_id === z.id)
            .map(cz => ({ zone: cz, subtreeEffort: calculateSubtreeIntervalEffort(cz.id) }));

        subZones.sort((a, b) => b.subtreeEffort - a.subtreeEffort);
        subZones.forEach(subZoneObj => renderZoneRows(subZoneObj, level + 1));
    }

    topZones.forEach(topZoneObj => { renderZoneRows(topZoneObj, 0); });

    // Freie Blöcke ohne Rahmen
    const unzonedNodes = (currentNodes || [])
        .filter(n => !n.zone_id && n.block_type !== 'note')
        .map(n => ({ node: n, effort: getNodeEffort(n.id) }));

    if (unzonedNodes.length > 0) {
        unzonedNodes.sort((a, b) => b.effort - a.effort);
        const unzonedTotal = unzonedNodes.reduce((acc, curr) => acc + curr.effort, 0);

        tableHtml += `
            <tr style="background: #edf2f7; font-weight: bold; border-top: 2px solid #cbd5e0;">
                <td style="padding-left: 6px; padding-top: 6px; padding-bottom: 6px;">📌 Freie Blöcke (Ohne Rahmenzuweisung)</td>
                <td style="text-align: right; color:#2b6cb0; font-family:monospace; font-size:12px;">+${formatHoursToHM(unzonedTotal)}</td>
                <td colspan="3"></td>
            </tr>
        `;

        unzonedNodes.forEach(({ node: n, effort: nEffort }) => {
            const nSt = getNodeStatus(n.id);
            const isDone = (nSt.status === 'completed') || (nSt.pDesign === 100 && nSt.pDrafting === 100);
            const isPending = (nSt.status === 'pending_approval');

            if (filterStatus === 'completed' && !isDone) return;
            if (filterStatus === 'open' && isDone) return;

            const nTotal = totalSpentToDateNode[n.id] || 0;
            const nCurBud = newNodeBudgets[n.id] !== undefined
                ? newNodeBudgets[n.id]
                : (parseFloat(n.budget_design_hours) || 0) + (parseFloat(n.budget_drafting_hours) || 0);

            const nOldBud = oldNodeBudgets[n.id] !== undefined ? oldNodeBudgets[n.id] : nCurBud;
            const nDiffBud = nCurBud - nOldBud;

            let nDiffHtml = '<span style="color:#a0aec0;">±0h</span>';
            if (nDiffBud > 0.01) nDiffHtml = `<span style="color:#e53e3e; font-weight:bold;">▲ +${formatHoursToHM(nDiffBud)}</span>`;
            else if (nDiffBud < -0.01) nDiffHtml = `<span style="color:#38a169; font-weight:bold;">▼ -${formatHoursToHM(Math.abs(nDiffBud))}</span>`;

            const nDoc = n.doc_number || (n.article_number ? `ART-${n.article_number}` : '');
            const nDocBadge = nDoc ? `<span style="font-family:monospace; font-size:9px; background:#e2e8f0; padding:1px 4px; border-radius:3px; margin-right:4px;">${escapeHtml(nDoc)}</span>` : '';
            const iconSvg = n.block_type === 'part' ? (window.CAD_ICONS ? CAD_ICONS.part : '⚙️') : (window.CAD_ICONS ? CAD_ICONS.assembly : '📦');

            let statusBadge = '';
            if (isDone) {
                statusBadge = `<span style="font-size:9px; font-weight:bold; background:#c6f6d5; color:#22543d; padding:1px 6px; border-radius:3px; margin-left:6px; display:inline-flex; align-items:center; gap:2px;">✅ Erledigt</span>`;
            } else if (isPending) {
                statusBadge = `<span style="font-size:9px; font-weight:bold; background:#feebc8; color:#c05621; padding:1px 6px; border-radius:3px; margin-left:6px; display:inline-flex; align-items:center; gap:2px;">⏳ Freigabe</span>`;
            }

            const hasBudget = nCurBud > 0;
            const actualPct = hasBudget ? Math.round((nTotal / nCurBud) * 100) : 0;
            const barWidthPct = hasBudget ? Math.min(actualPct, 100) : (nTotal > 0 ? 100 : 0);
            const isOver = hasBudget && (nTotal > nCurBud);
            const barColor = isDone ? '#38a169' : (!hasBudget ? '#a0aec0' : (isOver ? '#e53e3e' : '#3182ce'));
            const pctLabel = hasBudget ? `${actualPct}%` : '—';

            tableHtml += `
                <tr style="transition: background 0.15s ease;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                    <td style="padding-left: 24px; padding-top: 6px; padding-bottom: 6px;">
                        <span style="color:#a0aec0; margin-right:4px;">└──</span>
                        ${nDocBadge}${iconSvg} ${escapeHtml(n.name)}
                        ${statusBadge}
                    </td>
                    <td style="text-align: right; font-weight:bold; color:${nEffort > 0 ? '#2b6cb0' : '#a0aec0'}; font-family:monospace;">+${formatHoursToHM(nEffort)}</td>
                    <td style="text-align: right; color:#718096; font-family:monospace;">${formatHoursToHM(nOldBud)} ➔ ${formatHoursToHM(nCurBud)}</td>
                    <td style="text-align: right;">${nDiffHtml}</td>
                    <td style="text-align: right; color:#4a5568; font-family:monospace; padding-right: 15px;">
                        <div style="display:flex; flex-direction:column; align-items:flex-end;">
                            <div style="display:flex; justify-content:space-between; width:100%; max-width:95px; font-size:10px; margin-bottom: 2px;">
                                <span style="font-weight:bold; color:${isOver ? '#e53e3e' : '#2d3748'};">${formatHoursToHM(nTotal)}</span>
                                <span style="font-weight:${isOver ? 'bold' : 'normal'}; color:${isOver ? '#e53e3e' : '#718096'};">${pctLabel}</span>
                            </div>
                            <div style="width: 100%; max-width: 95px; height: 5px; background: #edf2f7; border-radius: 3px; overflow: hidden;">
                                <div style="width: ${barWidthPct}%; height: 100%; background: ${barColor};"></div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    tableHtml += `</tbody></table>`;
    detailsContainer.innerHTML = tableHtml;
}

// =============================================================================
// 5. STANDARD-SUMMARY (KACHELN, TOP-5 BAR CHART & KW-TABELLE)
// =============================================================================

function renderReportSummary(logs, timeframe) {
    const container = document.getElementById('repSummaryContainer');
    if (!container) return;

    let totalCAD = 0, totalDraft = 0;
    const weeklyData = {};
    const nodeStats = {};

    logs.forEach(log => {
        const hrs = parseFloat(log.hours) || 0;
        if (log.task_type === 'design') totalCAD += hrs;
        if (log.task_type === 'drafting') totalDraft += hrs;

        const identifierId = log.node_id || log.zone_id || 'unknown';
        if (!nodeStats[identifierId]) {
            let name = 'Unbekannt';
            if (log.node_id) {
                const n = (currentNodes || []).find(x => x.id === log.node_id);
                if (n) name = n.name;
            } else if (log.zone_id) {
                const z = (currentZones || []).find(x => x.id === log.zone_id);
                if (z) name = `[Rahmen] ${z.title}`;
            }
            nodeStats[identifierId] = { name, hours: 0, cad: 0, draft: 0 };
        }
        nodeStats[identifierId].hours += hrs;
        if (log.task_type === 'design') nodeStats[identifierId].cad += hrs;
        if (log.task_type === 'drafting') nodeStats[identifierId].draft += hrs;

        if (timeframe === 'month' || timeframe === 'custom') {
            const kw = getISOWeekNumber(new Date(log.logged_at));
            if (!weeklyData[kw]) weeklyData[kw] = { cad: 0, draft: 0 };
            if (log.task_type === 'design') weeklyData[kw].cad += hrs;
            if (log.task_type === 'drafting') weeklyData[kw].draft += hrs;
        }
    });

    const cardsHtml = `
        <div style="display: flex; gap: 12px; width: 100%;">
            <div style="background: #ebf8ff; padding: 12px 16px; border-radius: 6px; flex: 1; border: 1px solid #bee3f8;">
                <div style="font-size: 11px; color: #2b6cb0; text-transform: uppercase; font-weight: bold;">Summe CAD (Intervall)</div>
                <div style="font-size: 20px; font-weight: bold; color: #2c3e50; margin-top: 4px;">${formatHoursToHM(totalCAD)}</div>
            </div>
            <div style="background: #f0fff4; padding: 12px 16px; border-radius: 6px; flex: 1; border: 1px solid #c6f6d5;">
                <div style="font-size: 11px; color: #2f855a; text-transform: uppercase; font-weight: bold;">Summe Zeichnung (Intervall)</div>
                <div style="font-size: 20px; font-weight: bold; color: #2c3e50; margin-top: 4px;">${formatHoursToHM(totalDraft)}</div>
            </div>
            <div style="background: #2d3748; padding: 12px 16px; border-radius: 6px; flex: 1;">
                <div style="font-size: 11px; color: #a0aec0; text-transform: uppercase; font-weight: bold;">Gesamtaufwand</div>
                <div style="font-size: 20px; font-weight: bold; color: #fff; margin-top: 4px;">${formatHoursToHM(totalCAD + totalDraft)}</div>
            </div>
        </div>
    `;

    let visualChartHtml = '';
    const sortedNodes = Object.values(nodeStats).sort((a, b) => b.hours - a.hours).slice(0, 5);

    if (sortedNodes.length > 0 && (totalCAD + totalDraft) > 0) {
        const maxNodeHours = sortedNodes[0].hours;

        const barsHtml = sortedNodes.map(n => {
            const cadPct = (n.cad / maxNodeHours) * 100;
            const draftPct = (n.draft / maxNodeHours) * 100;
            return `
                <div style="display: flex; align-items: center; gap: 10px; font-size: 11px; margin-bottom: 8px;">
                    <div style="width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #4a5568; font-weight: 600;" title="${escapeHtml(n.name)}">${escapeHtml(n.name)}</div>
                    <div style="flex: 1; height: 16px; background: #edf2f7; border-radius: 4px; display: flex; overflow: hidden;">
                        <div style="width: ${cadPct}%; background: #3182ce;" title="CAD: ${formatHoursToHM(n.cad)}"></div>
                        <div style="width: ${draftPct}%; background: #38a169;" title="Zeichnung: ${formatHoursToHM(n.draft)}"></div>
                    </div>
                    <div style="width: 65px; text-align: right; font-family: monospace; font-weight: bold; color: #2d3748;">${formatHoursToHM(n.hours)}</div>
                </div>
            `;
        }).join('');

        visualChartHtml = `
            <div style="margin-top: 15px; background: #f8fafc; border: 1px solid #edf2f7; border-radius: 6px; padding: 15px;">
                <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #718096; margin-bottom: 12px;">Top 5 Kostentreiber (Im Intervall)</div>
                ${barsHtml}
                <div style="display:flex; justify-content:flex-end; gap: 12px; margin-top: 8px; font-size: 10px; color: #718096;">
                    <span style="display:flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; background:#3182ce; border-radius:2px;"></span> CAD</span>
                    <span style="display:flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; background:#38a169; border-radius:2px;"></span> Zeichnung</span>
                </div>
            </div>
        `;
    }

    let weekBreakdownHtml = '';
    if ((timeframe === 'month' || timeframe === 'custom') && Object.keys(weeklyData).length > 0) {
        weekBreakdownHtml = `<div style="width: 100%; margin-top: 8px; font-size: 11px;">`;
        weekBreakdownHtml += `<table class="log-table"><thead><tr><th>Kalenderwoche</th><th>CAD</th><th>Zeichnung</th><th>Summe KW</th></tr></thead><tbody>`;

        const sortedKWs = Object.keys(weeklyData).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
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
            ${visualChartHtml}
            ${weekBreakdownHtml}
        </div>
    `;
}

// =============================================================================
// 6. STANDARD-LOGBUCH TABELLE (MIT STATUS-BADGES)
// =============================================================================

function renderReportDetailsTable(logs) {
    const container = document.getElementById('repDetailsContainer');
    const filterStatus = document.getElementById('repFilterStatus')?.value || 'all';
    if (!container) return;

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
          <th>Baugruppe (Status)</th>
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
        let statusBadge = '';

        if (log.node_id) {
            const node = (currentNodes || []).find(n => n.id === log.node_id);
            if (node) {
                nodeName = node.name;
                const isDone = (node.completion_status === 'completed') || (node.progress_design === 100 && node.progress_drafting === 100);
                const isPending = (node.completion_status === 'pending_approval');

                if (filterStatus === 'completed' && !isDone) return;
                if (filterStatus === 'open' && isDone) return;

                if (isDone) {
                    statusBadge = ` <span style="font-size: 9px; font-weight: bold; background: #c6f6d5; color: #22543d; padding: 1px 5px; border-radius: 3px;">✅ Erledigt</span>`;
                } else if (isPending) {
                    statusBadge = ` <span style="font-size: 9px; font-weight: bold; background: #feebc8; color: #c05621; padding: 1px 5px; border-radius: 3px;">⏳ Freigabe</span>`;
                }

                if (node.zone_id) {
                    const zone = (currentZones || []).find(z => z.id === node.zone_id);
                    if (zone) zoneName = zone.title;
                }
            }
        } else if (log.zone_id) {
            const zone = (currentZones || []).find(z => z.id === log.zone_id);
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
          <td>${escapeHtml(nodeName)}${statusBadge}</td>
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
// 7. PDF EXPORT GENERATOR (HTML2PDF)
// =============================================================================

window.generatePDF = async function () {
    const btn = document.getElementById('btnExportPDF');
    if (!btn) return;

    const originalText = btn.innerText;
    btn.innerText = 'Wird generiert...';
    btn.disabled = true;

    try {
        const pData = reportState.projData;
        const selUser = document.getElementById('repFilterUser');
        const filterUserName = selUser ? selUser.options[selUser.selectedIndex].text : 'Alle Mitarbeiter';
        const timeframe = document.getElementById('repTimeframe').value;

        const dStart = reportState.startDate ? `${reportState.startDate.getDate().toString().padStart(2, '0')}.${(reportState.startDate.getMonth() + 1).toString().padStart(2, '0')}.${reportState.startDate.getFullYear()}` : '';
        const dEnd = reportState.endDate ? `${reportState.endDate.getDate().toString().padStart(2, '0')}.${(reportState.endDate.getMonth() + 1).toString().padStart(2, '0')}.${reportState.endDate.getFullYear()}` : '';

        const safeProjName = (pData.name || 'Projekt').replace(/[^a-zA-Z0-9\-_ÄÖÜäöü]/g, '_');
        let exportFileName = `Auswertung_${pData.obj}_${safeProjName}_${dEnd}.pdf`;

        const pieDUrl = createPieChartImage(pData.spentD, pData.budD, '#3182ce');
        const pieDrUrl = createPieChartImage(pData.spentDr, pData.budDr, '#38a169');

        const pdfContainer = document.createElement('div');
        pdfContainer.style.width = '750px';
        pdfContainer.style.background = '#fff';
        pdfContainer.style.boxSizing = 'border-box';

        const pdfCss = `
            <style>
                .pdf-page { background: white; padding: 25px 30px; box-sizing: border-box; font-family: Arial, sans-serif; font-size: 11px; line-height: 1.5; color: #333; }
                .pdf-header { border-bottom: 2px solid #3182ce; padding-bottom: 10px; margin-bottom: 12px; }
                .pdf-header h1 { color: #2c3e50; margin: 0 0 4px 0; font-size: 18px; }
                .pdf-header-meta { display: flex; justify-content: space-between; font-size: 10px; color: #666; }
                .pdf-section-title { background: #f4f4f9; padding: 6px 10px; font-size: 11px; border-left: 4px solid #3182ce; margin: 14px 0 8px 0; color: #2c3e50; font-weight: bold; }
                .pdf-box { background: #f9f9f9; padding: 10px 14px; border-radius: 4px; margin-bottom: 10px; border: 1px solid #edf2f7; }
                table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
                th, td { border-bottom: 1px solid #edf2f7; padding: 5px 4px; text-align: left; }
                th { background: #f7fafc; color: #4a5568; font-weight: bold; }
                tr { page-break-inside: avoid; }
                .log-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
                .log-table th { background: #edf2f7; color: #2d3748; font-weight: bold; padding: 6px 4px; border-bottom: 2px solid #cbd5e0; }
                .log-table td { padding: 4px; border-bottom: 1px solid #edf2f7; }
            </style>
        `;

        if (timeframe === 'snapshot_compare') {
            const selAId = document.getElementById('repSelectSnapshotA')?.value;
            const selBId = document.getElementById('repSelectSnapshotB')?.value;

            const snapA = (window.currentSnapshots || []).find(s => s.id === selAId) || null;
            const snapB = (window.currentSnapshots || []).find(s => s.id === selBId) || null;

            const sADateStr = snapA ? new Date(snapA.review_date).toLocaleDateString('de-DE') : dStart;
            const sBDateStr = snapB ? new Date(snapB.review_date).toLocaleDateString('de-DE') : 'Heute (Live)';
            const sBTitle = snapB ? snapB.title : 'Live-Stand';
            const sATitle = snapA ? snapA.title : 'Snapshot';

            exportFileName = `Review_Vergleich_${pData.obj}_${safeProjName}_${dEnd}.pdf`;

            const summaryHtml = document.getElementById('repSummaryContainer')?.innerHTML || '';
            const detailsHtml = document.getElementById('repDetailsContainer')?.innerHTML || '';

            pdfContainer.innerHTML = pdfCss + `
                <div class="pdf-page">
                    <div class="pdf-header">
                        <h1>Review-Vergleich &amp; Controlling-Bericht</h1>
                        <div class="pdf-header-meta">
                            <div><strong>Projekt:</strong> ${escapeHtml(pData.obj)} – ${escapeHtml(pData.name)}</div>
                            <div><strong>Intervall:</strong> ${escapeHtml(sATitle)} (${sADateStr}) ➔ ${escapeHtml(sBTitle)} (${sBDateStr})</div>
                            <div><strong>Generiert am:</strong> ${new Date().toLocaleDateString('de-DE')}</div>
                        </div>
                    </div>

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
                        ${filterUserName !== 'Alle Mitarbeiter' ? `
                            <div style="margin-left: auto; font-size: 11px;">
                                <strong>Mitarbeiter:</strong> <span style="background:#2b6cb0; color:#fff; padding:2px 6px; border-radius:3px; font-weight:bold;">${escapeHtml(filterUserName)}</span>
                            </div>
                        ` : ''}
                    </div>

                    <div class="pdf-section-title" style="border-color: #e67e22; margin-top: 15px;">Intervall-Aufwand &amp; Delta</div>
                    <div style="margin-bottom: 10px;">
                        ${summaryHtml}
                    </div>

                    <div class="pdf-section-title" style="border-color: #2b6cb0; margin-top: 15px;">Hierarchischer Soll-/Ist-Vergleich (Vom obersten Bereich absteigend)</div>
                    <div style="width: 100%;">
                        ${detailsHtml || '<div style="padding:10px; color:#718096;">Keine Daten für dieses Intervall vorhanden.</div>'}
                    </div>
                </div>
            `;
        } else {
            const pageHeader = `
                <div class="pdf-header">
                    <h1>Projekt-Controlling &amp; Zeitauswertung</h1>
                    <div class="pdf-header-meta">
                        <div><strong>Projekt:</strong> ${escapeHtml(pData.obj)} – ${escapeHtml(pData.name)}</div>
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
                let statusBadge = '';

                if (log.node_id) {
                    const node = (currentNodes || []).find(n => n.id === log.node_id);
                    if (node) {
                        nodeName = node.name;
                        const isDone = (node.completion_status === 'completed') || (node.progress_design === 100 && node.progress_drafting === 100);
                        if (isDone) statusBadge = ' [✅ Erledigt]';
                        else if (node.completion_status === 'pending_approval') statusBadge = ' [⏳ Freigabe]';

                        if (node.zone_id) {
                            const zone = (currentZones || []).find(z => z.id === node.zone_id);
                            if (zone) zoneName = zone.title;
                        }
                    }
                } else if (log.zone_id) {
                    const zone = (currentZones || []).find(z => z.id === log.zone_id);
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
                        <td>${escapeHtml(nodeName)}${statusBadge}</td>
                        <td>${kat}</td>
                        <td><strong>${timeStr}</strong></td>
                        <td style="color:#718096; font-style:italic;">${escapeHtml(log.note || '-')}</td>
                    </tr>
                `;
            });

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

                const sortedKWs = Object.keys(weeklyData).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
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

                    <div class="pdf-section-title" style="border-color: #e67e22; margin-top: 15px;">Gefilterter Aufwand: ${escapeHtml(filterUserName)}</div>
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
        }

        const opt = {
            margin: [10, 10, 15, 10],
            filename: exportFileName,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
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