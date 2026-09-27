/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: NATIVE Canvas Engine, Dual-Mode (CAD & Manager) & Hierarchie-Engine
 * ERSETZEN IN: canvas.js (Gesamte Datei)
 * Zeitstempel: 2026-09-17 22:50:00 CEST
 * Breadcrumbs:
 *   - [2026-08-23 bis 2026-08-31]: Nativer Canvas, Splines, Materialfluss,
 *     Sticky Notes mit Checklisten, Zonen-Hierarchien & Multi-Selektions-Drag.
 *   - [2026-09-17 22:45:00 CEST]: Vollständige Konsolidierung: CAD-Konstruktionsplan 
 *     & Manager-Board mit verschachtelten Rahmen und dedupliziertem Budget.
 *   - [2026-09-17 22:50:00 CEST]: Wiederherstellung der ursprünglichen Native Pan/Zoom-Engine 
 *     (Mousewheel, Middle-Click, ContextMenu, Canvas-Coords) unter vollständigem Erhalt aller Erweiterungen.
 * =============================================================================
 */

// Globale State-Variablen für das native Panning/Zooming
window.currentScale = parseFloat(localStorage.getItem('cad_tm_scale')) || 1;
window.currentPanX = parseFloat(localStorage.getItem('cad_tm_panX')) || 100;
window.currentPanY = parseFloat(localStorage.getItem('cad_tm_panY')) || 100;
window.hoveredNodeId = null;
window.copiedNodeIds = [];
window.isDraggingAnything = false;

// Dummy-Proxy für Abwärtskompatibilität
window.panzoomInstance = { getScale: () => window.currentScale };

let connectingFirstNodeId = null;
let connectingFirstPoint = null;
let connectingFlowZoneId = null;
let contextMenuCoords = { x: 100, y: 100 };
let contextTargetNodeId = null;
window.contextTargetZoneId = null;

// =============================================================================
// NATIVE ENGINE: PAN, ZOOM & EVENTS (Wiederhergestellt)
// =============================================================================
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Native Canvas Engine (High-Performance Transform & Debounced Cache)
 * ERSETZEN IN: canvas.js (Funktion applyCanvasTransform)
 * Zeitstempel: 2026-09-27 12:05:00 CEST
 * Breadcrumbs:
 *   - [2026-09-17 22:50:00 CEST]: Basis Canvas-Transform.
 *   - [2026-09-27 12:05:00 CEST]: PERF-FIX: 1. Synchrones localStorage.setItem
 *     aus dem Render-Loop entfernt (nur noch debounced nach 300ms Idle).
 *     2. CPU-Repaint des Punkt-Rasters eliminiert (Raster liegt nun auf #canvas).
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Native Canvas Engine (Performantes Transform mit Viewport-Grid-Sync)
 * ERSETZEN IN: canvas.js (Funktion applyCanvasTransform)
 * Zeitstempel: 2026-09-27 12:15:00 CEST
 * Breadcrumbs:
 *   - [2026-09-27 12:05:00 CEST]: Debounced localStorage.
 *   - [2026-09-27 12:15:00 CEST]: Viewport-Grid-Sync wiederhergestellt, damit
 *     die Rasterpunkte unendlich über den gesamten Bildschirm mitgleiten.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Native Canvas Engine (Transform mit Viewport-Grid-Sync & Debounce)
 * ERSETZEN IN: canvas.js (Funktion applyCanvasTransform)
 * Zeitstempel: 2026-09-27 12:45:00 CEST
 * Breadcrumbs:
 *   - [2026-09-27 12:05:00 CEST]: Debounced localStorage.
 *   - [2026-09-27 12:45:00 CEST]: Viewport-Grid-Sync wiederhergestellt, damit
 *     die Rasterpunkte beim Pannen/Zoomen millimetergenau mitwandern.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Native Canvas Engine (GPU-Schonender Grid-Sync ohne Dauer-Repaint)
 * ERSETZEN IN: canvas.js (Funktion applyCanvasTransform)
 * Zeitstempel: 2026-09-27 13:10:00 CEST
 * Breadcrumbs:
 *   - [2026-09-27 12:45:00 CEST]: Viewport-Grid-Sync.
 *   - [2026-09-27 13:10:00 CEST]: PERF-FIX MOBILE: backgroundSize wird strikt
 *     NUR noch neu berechnet, wenn sich window.currentScale tatsächlich ändert.
 *     1-Finger-Panning löst keine teure Gradient-Neuberechnung mehr aus.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Native Canvas Engine (Direkte GPU-Transformation ohne Inline-Resets)
 * ERSETZEN IN: canvas.js (Funktion applyCanvasTransform)
 * Zeitstempel: 2026-09-27 13:40:00 CEST
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Native Canvas Engine (Jitterfreier 1:1 Viewport-Grid-Sync)
 * ERSETZEN IN: canvas.js (Funktion applyCanvasTransform)
 * Zeitstempel: 2026-09-27 13:50:00 CEST
 * Breadcrumbs:
 *   - [2026-09-27 13:10:00 CEST]: 0.005 Threshold (verursachte Verspringen/Jitter).
 *   - [2026-09-27 13:50:00 CEST]: BUGFIX GRID-JITTER: 1. Starre 0.005-Schwelle
 *     entfernt. Beim Zoomen werden backgroundSize und backgroundPosition in
 *     jedem Frame 100% phasensynchron berechnet (kein Nachspringen der Dots).
 *     2. Beim Pannen bleibt backgroundSize unberührt (Scale ändert sich nicht, 0% CPU-Last).
 * =============================================================================
 */
let saveTransformTimeout = null;
let lastRenderedGridScale = -1;

function applyCanvasTransform(animate = false) {
    const canvasEl = document.getElementById('canvas');
    const viewportEl = document.getElementById('viewport');
    if (!canvasEl) return;

    if (animate) {
        canvasEl.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
        if (viewportEl) {
            viewportEl.style.transition = 'background-position 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-size 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
        }
        setTimeout(() => {
            canvasEl.style.transition = 'none';
            if (viewportEl) viewportEl.style.transition = 'none';
        }, 200);
    }

    canvasEl.style.transform = `translate3d(${window.currentPanX}px, ${window.currentPanY}px, 0) scale(${window.currentScale})`;

    if (viewportEl) {
        // Exakter Sync beim Zoomen; keine Neuberechnung beim reinen Pannen
        if (lastRenderedGridScale !== window.currentScale) {
            const scaledGridSize = 24 * window.currentScale;
            viewportEl.style.backgroundSize = `${scaledGridSize}px ${scaledGridSize}px`;
            lastRenderedGridScale = window.currentScale;
        }
        viewportEl.style.backgroundPosition = `${window.currentPanX}px ${window.currentPanY}px`;
    }

    clearTimeout(saveTransformTimeout);
    saveTransformTimeout = setTimeout(() => {
        localStorage.setItem('cad_tm_panX', window.currentPanX);
        localStorage.setItem('cad_tm_panY', window.currentPanY);
        localStorage.setItem('cad_tm_scale', window.currentScale);
    }, 300);
}

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Native Canvas Engine (Pan, Zoom & Events)
 * ERSETZEN IN: canvas.js (Funktion initNativeCanvasEngine komplett ersetzen)
 * Zeitstempel: 2026-09-17 22:50:00 CEST
 * Breadcrumbs:
 *   - [2026-09-17 22:50:00 CEST]: BUGFIX: Linksklick-Panning auf Hintergrund aktiviert, 
 *     Touch-Events für Wisch-Panning auf mobilen Geräten hinzugefügt.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Native Canvas Engine (Pan, Zoom & Events)
 * ERSETZEN IN: canvas.js (Funktion initNativeCanvasEngine komplett ersetzen)
 * Zeitstempel: 2026-09-17 23:05:00 CEST
 * Breadcrumbs:
 *   - [2026-09-17 22:50:00 CEST]: Sichere Initialisierung.
 *   - [2026-09-17 23:05:00 CEST]: 1. Multiplikativer Zoom für weichere & natürlichere 
 *     Skalierung mit präzisem Maus-Fokus. 2. Panning-Filter verfeinert: Linksklick-Pan
 *     funktioniert jetzt auch auf den leeren Flächen der Manager-Rahmen.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Native Canvas Engine (Pan, Zoom & Events)
 * ERSETZEN IN: canvas.js (Funktion initNativeCanvasEngine komplett ersetzen)
 * Zeitstempel: 2026-09-17 23:15:00 CEST
 * Breadcrumbs:
 *   - [2026-09-17 23:05:00 CEST]: Multiplikativer Zoom & Pan-Filter.
 *   - [2026-09-17 23:15:00 CEST]: BUGFIX: "Event-Swallowing" beim Zoomen behoben. 
 *     Scroll-Filter auf echte Tabellen (.inline-logs-container, .log-table, .zone-body) reduziert.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Native Canvas Engine (Pan-Filter & Ghost-Image Prevention)
 * ERSETZEN IN: canvas.js (Funktion initNativeCanvasEngine)
 * Zeitstempel: 2026-09-26 13:40:00 CEST
 * Breadcrumbs:
 *   - [2026-09-17 23:15:00 CEST]: Multiplikativer Zoom.
 *   - [2026-09-26 13:40:00 CEST]: BUGFIX: 1. Natives dragstart auf Canvas unterbunden
 *     (verhindert, dass der Canvas als transparentes Bild verschoben wird).
 *     2. .project-zone in isInteractive aufgenommen (ungesperrte Rahmen starten 
 *     kein Canvas-Panning mehr; gesperrte Rahmen lassen Pan gezielt durch).
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Native Canvas Engine (Manager-Canvas Ghosting-Eliminierung & Pan-Fix)
 * ERSETZEN IN: canvas.js (Funktion initNativeCanvasEngine)
 * Zeitstempel: 2026-09-26 13:50:00 CEST
 * Breadcrumbs:
 *   - [2026-09-26 13:40:00 CEST]: Pan-Filter & e.preventDefault() Basis.
 *   - [2026-09-26 13:50:00 CEST]: BUGFIX: Viewport-weites dragstart-Interception
 *     aktiviert. Blockiert das Ghosting im Manager-Canvas vollständig,
 *     während das Hineinziehen aus der Sidebar (.sb-pool-item) erhalten bleibt.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Native Canvas Engine (Rechtsklick- & Panning-Reparatur)
 * ERSETZEN IN: canvas.js (Funktion initNativeCanvasEngine)
 * Zeitstempel: 2026-09-26 14:10:00 CEST
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Native Canvas Engine (Pan, 2-Finger-Pinch-Zoom & Gesture-Guard)
 * ERSETZEN IN: canvas.js (Funktion initNativeCanvasEngine komplett ersetzen)
 * Zeitstempel: 2026-09-27 11:15:00 CEST
 * Breadcrumbs:
 *   - [2026-09-26 14:10:00 CEST]: Pan-Filter & Rechtsklick-Schutz.
 *   - [2026-09-27 11:15:00 CEST]: BUGFIX: Natives Browser-Zoomen unterbunden 
 *     (iOS gesturestart & multi-touch preventDefault). 2-Finger-Pinch-Zoom 
 *     direkt auf dem Canvas mit dynamischem Mittelpunkt implementiert.
 * =============================================================================
 */
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Native Canvas Engine (Pan, 2-Finger-Pinch-Zoom & Gesture-Guard)
 * ERSETZEN IN: canvas.js (Funktion initNativeCanvasEngine komplett ersetzen)
 * Zeitstempel: 2026-09-27 11:45:00 CEST
 * Breadcrumbs:
 *   - [2026-09-27 11:15:00 CEST]: Basis Multi-Touch.
 *   - [2026-09-27 11:45:00 CEST]: BUGFIX: 1. Scope-Fehler behoben: window.isPinching 
 *     einheitlich genutzt (zuvor blockierte let isPinching im Closure den Zoom-Aufruf).
 *     2. On-the-fly Pinch-Initialisierung in touchmove integriert.
 *     3. window.isPinching im touchend/touchcancel zuverlässig zurückgesetzt.
 * =============================================================================
 */
function initNativeCanvasEngine() {
    const viewport = document.getElementById('viewport');
    if (!viewport) return;

    viewport.addEventListener('dragstart', (e) => {
        if (!e.target.closest('#sidebar')) {
            e.preventDefault();
            return false;
        }
    });

    // ---------------------------------------------------------
    // SAFARI / CHROME GESTURE-BLOCKER (Verhindert Browser-Skalierung)
    // ---------------------------------------------------------
    const preventBrowserGesture = (e) => {
        if (e.cancelable) e.preventDefault();
    };
    document.addEventListener('gesturestart', preventBrowserGesture, { passive: false });
    document.addEventListener('gesturechange', preventBrowserGesture, { passive: false });
    document.addEventListener('gestureend', preventBrowserGesture, { passive: false });

    let isPanning = false;
    let startX = 0, startY = 0;
    let startPanX = 0, startPanY = 0;

    // Pinch-to-Zoom State (konsistent an window gebunden)
    window.isPinching = false;
    let pinchStartDist = 0;
    let pinchStartScale = 1;
    let pinchWorldX = 0;
    let pinchWorldY = 0;

    const startPan = (clientX, clientY) => {
        isPanning = true;
        startX = clientX;
        startY = clientY;
        startPanX = window.currentPanX;
        startPanY = window.currentPanY;
        viewport.style.cursor = 'grabbing';
    };

    /**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Native Canvas Engine (PC-Pan Restore & Mobile Zero-Repaint Pipeline)
 * ERSETZEN IN: canvas.js (In initNativeCanvasEngine -> Ab mousedown bis stopPanOrPinch)
 * Zeitstempel: 2026-09-27 13:35:00 CEST
 * Breadcrumbs:
 *   - [2026-09-27 13:15:00 CEST]: Touch-rAF.
 *   - [2026-09-27 13:35:00 CEST]: BUGFIX: 1. window mousemove Event für PC-Panning
 *     vollständig wiederhergestellt. 2. .is-zooming strikt auf echten 2-Finger-Pinch
 *     begrenzt. 1-Finger-Pan läuft als reine GPU-Verschiebung ohne Re-Paints der Blöcke.
 * =============================================================================
 */

    // ---------------------------------------------------------
    // PANNING (Desktop Maus)
    // ---------------------------------------------------------
    viewport.addEventListener('mousedown', (e) => {
        if (window.isDraggingAnything) return;
        if (e.button === 2) return;

        const interactiveEl = e.target.closest('.assembly-card, .project-zone, .note-card, button, input, select, textarea, .ep-handle, .mgr-prog-slider, .zone-resize-handle, .note-resize-handle');
        if (interactiveEl) {
            const isLockedZone = interactiveEl.classList.contains('zone-locked') || interactiveEl.closest('.zone-locked');
            const isManagerZoneBody = (window.activeCanvasMode === 'manager') && interactiveEl.classList.contains('project-zone') && !e.target.closest('.project-zone-header, .zone-actions, .zone-resize-handle');
            const isButtonOrAction = e.target.closest('button, .zone-actions, input, select');

            if ((isLockedZone || isManagerZoneBody) && !isButtonOrAction) {
                // Panning durch gesperrte Zonen erlauben
            } else {
                if (e.button === 0 && !e.altKey) return;
            }
        }

        if (e.button === 0 || e.button === 1) {
            e.preventDefault();
            startPan(e.clientX, e.clientY);
        }
    });

    // Wiederhergestellter PC-Maus-Listener
    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        window.currentPanX = startPanX + dx;
        window.currentPanY = startPanY + dy;
        applyCanvasTransform(false);
    });

    let touchRafPending = false;
    const requestTouchTransform = () => {
        if (!touchRafPending) {
            touchRafPending = true;
            requestAnimationFrame(() => {
                applyCanvasTransform(false);
                touchRafPending = false;
            });
        }
    };

    // ---------------------------------------------------------
    // TOUCH EVENTS (Mobile 1-Finger Pan & 2-Finger Pinch-Zoom)
    // ---------------------------------------------------------
    viewport.addEventListener('touchstart', (e) => {
        if (e.touches.length >= 2) {
            if (e.cancelable) e.preventDefault();
            window.isPinching = true;
            window.isDraggingAnything = false;
            isPanning = false;
            viewport.classList.add('is-zooming'); // Nur beim Skalieren Effekte reduzieren

            const t1 = e.touches[0];
            const t2 = e.touches[1];
            pinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            pinchStartScale = window.currentScale || 1;

            const rect = viewport.getBoundingClientRect();
            const midX = ((t1.clientX + t2.clientX) / 2) - rect.left;
            const midY = ((t1.clientY + t2.clientY) / 2) - rect.top;

            pinchWorldX = (midX - window.currentPanX) / pinchStartScale;
            pinchWorldY = (midY - window.currentPanY) / pinchStartScale;
            return;
        }

        if (window.isDraggingAnything || window.isPinching) return;

        const interactiveEl = e.target.closest('.assembly-card, .project-zone, .note-card, button, input, select, textarea, .ep-handle, .mgr-prog-slider, .zone-resize-handle, .note-resize-handle');
        if (interactiveEl) {
            const isLockedZone = interactiveEl.classList.contains('zone-locked') || interactiveEl.closest('.zone-locked');
            const isManagerZoneBody = (window.activeCanvasMode === 'manager') && interactiveEl.classList.contains('project-zone') && !e.target.closest('.project-zone-header, .zone-actions, .zone-resize-handle');
            const isButtonOrAction = e.target.closest('button, .zone-actions, input, select');
            if ((!isLockedZone && !isManagerZoneBody) || isButtonOrAction) return;
        }

        if (e.touches.length === 1 && !window.isPinching) {
            startPan(e.touches[0].clientX, e.touches[0].clientY);
            // Kein is-zooming beim 1-Finger Pan -> verhindert Neurendern aller Karten
        }
    }, { capture: true, passive: false });

    window.addEventListener('touchmove', (e) => {
        // 2-Finger Pinch Zooming
        if (e.touches.length === 2) {
            if (e.cancelable) e.preventDefault();

            if (!window.isPinching || pinchStartDist <= 0) {
                window.isPinching = true;
                window.isDraggingAnything = false;
                isPanning = false;
                viewport.classList.add('is-zooming');

                const t1 = e.touches[0];
                const t2 = e.touches[1];
                pinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
                pinchStartScale = window.currentScale || 1;

                const rect = viewport.getBoundingClientRect();
                const midX = ((t1.clientX + t2.clientX) / 2) - rect.left;
                const midY = ((t1.clientY + t2.clientY) / 2) - rect.top;

                pinchWorldX = (midX - window.currentPanX) / pinchStartScale;
                pinchWorldY = (midY - window.currentPanY) / pinchStartScale;
                return;
            }

            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const curDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            if (pinchStartDist <= 0) return;

            const factor = curDist / pinchStartDist;
            const newScale = Math.min(Math.max(0.05, pinchStartScale * factor), 3.0);

            const rect = viewport.getBoundingClientRect();
            const curMidX = ((t1.clientX + t2.clientX) / 2) - rect.left;
            const curMidY = ((t1.clientY + t2.clientY) / 2) - rect.top;

            window.currentScale = newScale;
            window.currentPanX = curMidX - (pinchWorldX * newScale);
            window.currentPanY = curMidY - (pinchWorldY * newScale);

            requestTouchTransform();
            return;
        }

        // 1-Finger Canvas Panning (Reines GPU-Blitting)
        if (isPanning && e.touches.length === 1 && !window.isPinching) {
            if (e.cancelable) e.preventDefault();
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;
            window.currentPanX = startPanX + dx;
            window.currentPanY = startPanY + dy;

            requestTouchTransform();
        }
    }, { passive: false });

    const stopPanOrPinch = (e) => {
        if (window.isPinching) {
            if (!e.touches || e.touches.length === 0) {
                window.isPinching = false;
                window.isDraggingAnything = false;
                pinchStartDist = 0;
            } else if (e.touches.length === 1) {
                window.isPinching = false;
                window.isDraggingAnything = false;
                pinchStartDist = 0;
                startPan(e.touches[0].clientX, e.touches[0].clientY);
            }
        }
        if (isPanning && (!e.touches || e.touches.length === 0)) {
            isPanning = false;
            viewport.style.cursor = 'default';
        }

        if (!e.touches || e.touches.length === 0) {
            viewport.classList.remove('is-zooming');
            applyCanvasTransform(false);
        }
    };

    window.addEventListener('mouseup', stopPanOrPinch);
    window.addEventListener('touchend', stopPanOrPinch);
    window.addEventListener('touchcancel', stopPanOrPinch);

    /**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Native Canvas Engine (Smooth LERP Zoom & MX Master High-Res Engine)
 * ERSETZEN IN: canvas.js (In initNativeCanvasEngine -> MAUSRAD-ZOOM Bereich)
 * Zeitstempel: 2026-09-27 11:55:00 CEST
 * Breadcrumbs:
 *   - [2026-09-17 23:15:00 CEST]: Basis-Mausradzoom (starr 0.9/1.1).
 *   - [2026-09-27 11:55:00 CEST]: 1. deltaMode- & deltaY-Normalisierung für 
 *     Logitech MX Master (MagSpeed Freilauf / High-Res Scrolling) und Trackpads.
 *     2. LERP-Interpolation via requestAnimationFrame für butterweiches 120Hz-Zoomen.
 *     3. Mausfokus bleibt während der Animation stabil unter dem Cursor verankert.
 * =============================================================================
 */

    /**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Native Canvas Engine (Exakter Cursor-Anker & Smooth LERP-Zoom)
 * ERSETZEN IN: canvas.js (In initNativeCanvasEngine -> MAUSRAD-ZOOM Bereich)
 * Zeitstempel: 2026-09-27 12:05:00 CEST
 * Breadcrumbs:
 *   - [2026-09-27 11:55:00 CEST]: Erste LERP-Version.
 *   - [2026-09-27 12:05:00 CEST]: BUGFIX: Drift an Mausposition behoben.
 *     Mauspunkt wird in Weltkoordinaten verankert; PanX/PanY werden im Render-Loop
 *     strikt synchron an Scale gekoppelt. Klasse .is-zooming schaltet teure Effekte ab.
 * =============================================================================
 */

    // ---------------------------------------------------------
    // SMOOTH MAUSRAD-ZOOM (Logitech MX Master & Exakter Maus-Fokus)
    // ---------------------------------------------------------
    let zoomTargetScale = window.currentScale;
    let anchorWorldX = 0;
    let anchorWorldY = 0;
    let anchorMouseX = 0;
    let anchorMouseY = 0;
    let zoomAnimFrameId = null;

    const stopZoomAnimation = () => {
        zoomTargetScale = window.currentScale;
        if (zoomAnimFrameId) {
            cancelAnimationFrame(zoomAnimFrameId);
            zoomAnimFrameId = null;
            viewport.classList.remove('is-zooming');
        }
    };

    viewport.addEventListener('mousedown', stopZoomAnimation, { capture: true });
    viewport.addEventListener('touchstart', stopZoomAnimation, { capture: true });

    viewport.addEventListener('wheel', (e) => {
        if (e.target.closest('.inline-logs-container, .log-table, .zone-body, .time-inputs-row, .live-timer-time-inputs') && !e.ctrlKey && !e.metaKey) {
            return;
        }
        e.preventDefault();

        // 1. deltaMode vereinheitlichen (0 = Pixel [Trackpad/Freilauf], 1 = Zeilen [Raster], 2 = Seiten)
        let dy = e.deltaY;
        if (e.deltaMode === 1) {
            dy *= 28;
        } else if (e.deltaMode === 2) {
            dy *= 350;
        }
        dy = Math.max(-600, Math.min(600, dy));

        // 2. Cursor-Position im Viewport ermitteln
        const rect = viewport.getBoundingClientRect();
        anchorMouseX = e.clientX - rect.left;
        anchorMouseY = e.clientY - rect.top;

        // 3. Exakter Weltpunkt unter dem Fadenkreuz zum aktuellen Zeitpunkt
        anchorWorldX = (anchorMouseX - window.currentPanX) / window.currentScale;
        anchorWorldY = (anchorMouseY - window.currentPanY) / window.currentScale;

        // 4. Exponentielle Skalierung
        const zoomIntensity = 0.0015;
        const zoomFactor = Math.exp(-dy * zoomIntensity);
        zoomTargetScale = Math.min(Math.max(0.05, zoomTargetScale * zoomFactor), 3.0);

        // 5. Animations-Schleife (60–144 Hz)
        if (!zoomAnimFrameId) {
            viewport.classList.add('is-zooming'); // Schaltet teure Schatten & Animationen temporär ab

            const smoothZoomLoop = () => {
                const diffScale = zoomTargetScale - window.currentScale;

                // Abbruchschwelle
                if (Math.abs(diffScale) < 0.0006) {
                    window.currentScale = zoomTargetScale;
                    window.currentPanX = anchorMouseX - (anchorWorldX * window.currentScale);
                    window.currentPanY = anchorMouseY - (anchorWorldY * window.currentScale);
                    applyCanvasTransform(false);

                    zoomAnimFrameId = null;
                    viewport.classList.remove('is-zooming');
                    return;
                }

                // Dämpfungsfaktor (0.24 = weiches, gleitendes CAD-Gefühl)
                window.currentScale += diffScale * 0.24;

                // Mathematisch perfekte Zentrierung: Keine separate Pan-Dämpfung!
                window.currentPanX = anchorMouseX - (anchorWorldX * window.currentScale);
                window.currentPanY = anchorMouseY - (anchorWorldY * window.currentScale);

                applyCanvasTransform(false);
                zoomAnimFrameId = requestAnimationFrame(smoothZoomLoop);
            };

            zoomAnimFrameId = requestAnimationFrame(smoothZoomLoop);
        }
    }, { passive: false });

    // ---------------------------------------------------------
    // KONTEXTMENÜ
    // ---------------------------------------------------------
    viewport.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (window.isDraggingAnything || isPanning || window.isPinching) return;

        const menu = document.getElementById('canvasContextMenu');
        if (menu) {
            contextMenuCoords = window.getCanvasCoords(e.clientX, e.clientY);

            const nodeCard = e.target.closest('.assembly-card, .note-card');
            const zoneCard = e.target.closest('.project-zone');

            contextTargetNodeId = nodeCard ? nodeCard.id : null;
            window.contextTargetZoneId = zoneCard ? zoneCard.id : null;

            menu.style.left = `${e.clientX}px`;
            menu.style.top = `${e.clientY}px`;
            menu.style.display = 'block';

            if (typeof window.updateContextMenuVisibility === 'function') {
                window.updateContextMenuVisibility(contextTargetNodeId, window.contextTargetZoneId);
            }
        }
    });
}

// Global Click um Kontextmenü zu schließen
window.addEventListener('click', (e) => {
    const menu = document.getElementById('canvasContextMenu');
    if (menu && !e.target.closest('#canvasContextMenu')) {
        menu.style.display = 'none';
    }
});

// Tastatur-Shortcuts (Copy/Paste, Escape)
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'Escape') {
        connectingFirstNodeId = null;
        connectingFirstPoint = null;
        window.connectingFirstHandle = null;
        window.removeEventListener('mousemove', handleLiveSplineMove);
        renderConnections();

        const menu = document.getElementById('canvasContextMenu');
        if (menu) menu.style.display = 'none';
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (window.selectedNodeIds && window.selectedNodeIds.size > 0) {
            window.copiedNodeIds = Array.from(window.selectedNodeIds);
            showToast(`${window.copiedNodeIds.length} Instanz(en) kopiert`, 'info');
        }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (window.copiedNodeIds && window.copiedNodeIds.length > 0) {
            window.handlePasteNodes();
        }
    }
});

// Initialization Call (stellt sicher, dass Engine lädt)
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Sichere Initialisierung
 * ERSETZEN IN: canvas.js (Aufruf am Dateiende komplett ersetzen)
 * Zeitstempel: 2026-09-17 22:50:00 CEST
 * =============================================================================
 */
const initCanvasEngineSafely = () => {
    initNativeCanvasEngine();
    applyCanvasTransform(true);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCanvasEngineSafely);
} else {
    initCanvasEngineSafely();
}

// =============================================================================
// VERBINDUNGS-HANDLING & BREADCRUMBS
// =============================================================================

window.handleLiveSplineMove = function (e) {
    if (connectingFirstNodeId) {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        renderConnections(coords);
    }
};

window.handleEndpointClick = function (e, nodeId, handle) {
    e.stopPropagation();
    if (!connectingFirstNodeId) {
        connectingFirstNodeId = nodeId;
        window.connectingFirstHandle = handle;
        connectingFirstPoint = getCanvasCoords(e.clientX, e.clientY);
        window.addEventListener('mousemove', handleLiveSplineMove);
        showToast('Ziel-Knoten für Verbindung wählen', 'info');
    } else {
        if (connectingFirstNodeId !== nodeId) {
            if (typeof window.saveConnection === 'function') {
                window.saveConnection(connectingFirstNodeId, nodeId, window.connectingFirstHandle, handle);
            }
        }
        connectingFirstNodeId = null;
        connectingFirstPoint = null;
        window.connectingFirstHandle = null;
        window.removeEventListener('mousemove', handleLiveSplineMove);
        renderConnections();
    }
};

window.handleDisconnectClick = async function (source, target) {
    if (await customConfirm("Verbindung löschen", "Möchtest du diese Verbindung wirklich löschen?")) {
        if (typeof window.deleteConnection === 'function') window.deleteConnection(source, target);
    }
};

window.toggleSubtreeCollapse = function (e, nodeId) {
    if (e) e.stopPropagation();
    if (!window.collapsedParents) window.collapsedParents = new Set();

    if (window.collapsedParents.has(nodeId)) {
        window.collapsedParents.delete(nodeId);
    } else {
        window.collapsedParents.add(nodeId);
    }

    if (typeof renderCanvas === 'function') renderCanvas();
};

/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Canvas Engine (Exklusives Log-Ausklappen pro Rahmen)
 * ERSETZEN IN: canvas.js (Funktion window.toggleInlineLogs)
 * Zeitstempel: 2026-09-26 14:40:00 CEST
 * Breadcrumb: [2026-09-26] Pro Rahmen darf strikt nur ein Block (oder das Rahmen-Log)
 * ausgeklappt sein. Öffnen eines Blocks schließt automatisch Geschwister im selben Rahmen.
 * =============================================================================
 */
window.toggleInlineLogs = function (nodeId) {
    if (!window.expandedNodes) window.expandedNodes = new Set();
    if (!window.expandedZones) window.expandedZones = new Set();

    const isCurrentlyOpen = window.expandedNodes.has(nodeId);

    if (isCurrentlyOpen) {
        window.expandedNodes.delete(nodeId);
    } else {
        const node = (currentNodes || []).find(n => n.id === nodeId);
        const targetZoneId = node ? node.zone_id : null;

        if (targetZoneId) {
            // 1. Rahmen-eigenes Log schließen
            window.expandedZones.delete(targetZoneId);
            // 2. Andere Blöcke im selben Rahmen schließen
            (currentNodes || []).forEach(n => {
                if (n.zone_id === targetZoneId && n.id !== nodeId) {
                    window.expandedNodes.delete(n.id);
                }
            });
        } else {
            // Für freie Blöcke ohne Rahmen: andere freie Blöcke schließen
            (currentNodes || []).forEach(n => {
                if (!n.zone_id && n.id !== nodeId) {
                    window.expandedNodes.delete(n.id);
                }
            });
        }

        window.expandedNodes.add(nodeId);
    }

    renderCanvas();
};

window.isNodeHiddenByAncestor = function (nodeId) {
    if (!window.collapsedParents || window.collapsedParents.size === 0) return false;
    let edge = (typeof currentEdges !== 'undefined' ? currentEdges : []).find(e => e.target === nodeId);
    let currentParentId = edge ? edge.source : null;

    while (currentParentId) {
        if (window.collapsedParents.has(currentParentId)) return true;
        let nextEdge = (typeof currentEdges !== 'undefined' ? currentEdges : []).find(e => e.target === currentParentId);
        currentParentId = nextEdge ? nextEdge.source : null;
    }
    return false;
};

window.toggleNoteCollapse = async function (e, nodeId) {
    if (e) e.stopPropagation();
    const node = currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    node.completion_status = node.completion_status === 'collapsed' ? 'open' : 'collapsed';
    if (typeof renderCanvas === 'function') renderCanvas();
    await db.from('project_nodes').update({ completion_status: node.completion_status }).eq('id', nodeId);
};

// =============================================================================
// HIERARCHIE-HILFSFUNKTIONEN (CAD & MANAGER)
// =============================================================================
function getZoneDepth(zoneId) {
    let depth = 0;
    let current = currentZones.find(z => z.id === zoneId);
    while (current && current.parent_zone_id && depth < 10) {
        depth++;
        current = currentZones.find(z => z.id === current.parent_zone_id);
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
        if (x >= z.pos_x && x <= z.pos_x + z.width && y >= z.pos_y && y <= z.pos_y + z.height) {
            const depth = getZoneDepth(z.id);
            if (depth > maxDepth) {
                maxDepth = depth;
                deepestZone = z;
            }
        }
    }
    return deepestZone;
}

function getMgrZoneDepth(zoneId, zones) {
    let depth = 0;
    let cur = (zones || []).find(z => z.id === zoneId);
    while (cur && cur.parent_zone_id && depth < 10) {
        depth++;
        cur = zones.find(z => z.id === cur.parent_zone_id);
    }
    return depth;
}

function getAllDescendantMgrZones(zoneId, zones) {
    const desc = [];
    const queue = [zoneId];
    while (queue.length > 0) {
        const curId = queue.shift();
        const children = (zones || []).filter(z => z.parent_zone_id === curId);
        children.forEach(c => {
            desc.push(c.id);
            queue.push(c.id);
        });
    }
    return desc;
}

function getDeepestMgrZoneAt(x, y, excludeZoneIds = [], zones = []) {
    let deepest = null;
    let maxDepth = -1;
    (zones || []).forEach(z => {
        if (excludeZoneIds.includes(z.id)) return;
        const zX = parseFloat(z.pos_x) || 0;
        const zY = parseFloat(z.pos_y) || 0;
        const zW = parseFloat(z.width) || 620;
        const zH = parseFloat(z.height) || 440;

        if (x >= zX && x <= (zX + zW) && y >= zY && y <= (zY + zH)) {
            const d = getMgrZoneDepth(z.id, zones);
            if (d > maxDepth) {
                maxDepth = d;
                deepest = z;
            }
        }
    });
    return deepest;
}

window.isZoneHidden = function (zoneId) {
    if (!zoneId || !window.hiddenTopZoneIds || window.hiddenTopZoneIds.size === 0) return false;
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

// =============================================================================
// FORTSCHRITTS-SLIDER HANDLER (MANAGER-BOARD ADMINS)
// =============================================================================
window.handleManagerProgressInput = function (nodeId, type, val) {
    const num = parseInt(val, 10) || 0;
    const lbl = document.getElementById(type === 'design' ? `mgr-prog-val-d-${nodeId}` : `mgr-prog-val-dr-${nodeId}`);
    if (lbl) lbl.textContent = `${num}%`;

    const otherLbl = document.getElementById(type === 'design' ? `mgr-prog-val-dr-${nodeId}` : `mgr-prog-val-d-${nodeId}`);
    const otherVal = otherLbl ? (parseInt(otherLbl.textContent, 10) || 0) : 0;

    const dVal = type === 'design' ? num : otherVal;
    const drVal = type === 'drafting' ? num : otherVal;
    const tot = Math.round((dVal * 0.5) + (drVal * 0.5));

    const totBadge = document.getElementById(`mgr-tot-badge-${nodeId}`);
    if (totBadge) {
        totBadge.textContent = `${tot}% Gesamt`;
        totBadge.style.background = tot === 100 ? '#c6f6d5' : (tot > 50 ? '#bee3f8' : '#edf2f7');
        totBadge.style.color = tot === 100 ? '#22543d' : (tot > 50 ? '#2b6cb0' : '#4a5568');
    }
};

window.handleManagerProgressChange = async function (nodeId, type, val) {
    const node = currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    const masterNode = node.linked_id
        ? (currentNodes.find(n => n.linked_id === node.linked_id) || node)
        : node;

    const num = Math.min(100, Math.max(0, parseInt(val, 10) || 0));

    if (type === 'design') {
        masterNode.progress_design = num;
    } else {
        masterNode.progress_drafting = num;
    }

    const curD = masterNode.progress_design || 0;
    const curDr = masterNode.progress_drafting || 0;

    let newStatus = masterNode.completion_status || 'open';
    if (curD === 100 && curDr === 100) {
        newStatus = 'completed';
    } else if (newStatus === 'completed') {
        newStatus = 'open';
    }
    masterNode.completion_status = newStatus;

    const updatePayload = {
        progress_design: masterNode.progress_design,
        progress_drafting: masterNode.progress_drafting,
        completion_status: masterNode.completion_status
    };

    if (masterNode.linked_id) {
        const related = currentNodes.filter(n => n.linked_id === masterNode.linked_id);
        related.forEach(rn => Object.assign(rn, updatePayload));
        const updates = related.map(rn => db.from('project_nodes').update(updatePayload).eq('id', rn.id));
        await Promise.all(updates);
    } else {
        Object.assign(node, updatePayload);
        await db.from('project_nodes').update(updatePayload).eq('id', masterNode.id);
    }

    showToast(`Fortschritt "${masterNode.name}" synchronisiert`, 'success');
    renderCanvas();
};

// =============================================================================
// HAUPT-RENDERING (renderCanvas)
// =============================================================================
function renderCanvas() {
    const canvas = document.getElementById('canvas');
    const svgLayer = document.getElementById('connections-layer');
    if (!canvas || !svgLayer) return;

    const isManagerMode = (window.activeCanvasMode === 'manager');
    const mgrLayout = isManagerMode ? (typeof getManagerLayout === 'function' ? getManagerLayout() : { zones: [], placements: {} }) : null;

    if (!window.selectedNodeIds) window.selectedNodeIds = new Set();
    if (!window.expandedNodes) window.expandedNodes = new Set();
    if (!window.expandedZones) window.expandedZones = new Set();
    if (!window.collapsedParents) window.collapsedParents = new Set();
    if (!window.hiddenTopZoneIds) window.hiddenTopZoneIds = new Set();

    const existingCards = canvas.querySelectorAll('.assembly-card, .project-zone, .note-card');
    existingCards.forEach(c => c.remove());
    svgLayer.innerHTML = '';

    const rollups = (typeof calculateRollups === 'function') ? calculateRollups() : {};

    // =========================================================================
    // 1. ZONEN RENDERN (STATUS-BOARD VS. HAUPT-ZONEN)
    // =========================================================================
    if (isManagerMode && mgrLayout && Array.isArray(mgrLayout.zones)) {
        // Während der Sortier-Hilfe werden Hintergrundrahmen ausgeblendet, um Kollisionen zu verhindern
        if (!window.isManagerSortHelperActive) {
            const sortedMgrZones = [...mgrLayout.zones].sort((a, b) => {
                return getMgrZoneDepth(a.id, mgrLayout.zones) - getMgrZoneDepth(b.id, mgrLayout.zones);
            });

            /**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Canvas Engine (Manager-Zonen: Vollständige Budget-Mathematik & Popovers)
 * ERSETZEN IN: canvas.js (In renderCanvas() -> sortedMgrZones.forEach)
 * Zeitstempel: 2026-09-26 15:10:00 CEST
 * Breadcrumbs:
 *   - [2026-09-26 14:40:00 CEST]: Info-Popovers ergänzt.
 *   - [2026-09-26 15:10:00 CEST]: BUGFIX: ReferenceError (zoneSpentD / zoneProgress 
 *     is not defined) behoben. Zonen-Budget- und Puffer-Mathematik wiederhergestellt 
 *     und mit den Status-Popovers nahtlos verknüpft.
 * =============================================================================
 */
            sortedMgrZones.forEach(zone => {
                const depth = getMgrZoneDepth(zone.id, mgrLayout.zones);
                const isLocked = !!zone.is_locked;

                const zoneEl = document.createElement('div');
                zoneEl.id = zone.id;
                zoneEl.className = `project-zone ${isLocked ? 'zone-locked' : 'no-pan'} draggable-enabled`;
                zoneEl.style.left = `${zone.pos_x}px`;
                zoneEl.style.top = `${zone.pos_y}px`;
                zoneEl.style.width = `${zone.width}px`;
                zoneEl.style.height = `${zone.height}px`;
                zoneEl.style.borderColor = zone.color_hex || '#2b6cb0';
                zoneEl.style.backgroundColor = depth > 0 ? 'rgba(237, 242, 247, 0.65)' : 'rgba(237, 242, 247, 0.35)';
                zoneEl.style.zIndex = `${10 + (depth * 5)}`;

                const descendantZoneIds = getAllDescendantMgrZones(zone.id, mgrLayout.zones);
                const allIncludedZoneIds = [zone.id, ...descendantZoneIds];

                const containedBlocks = [];
                Object.keys(mgrLayout.placements || {}).forEach(nId => {
                    const pl = mgrLayout.placements[nId];
                    if (pl && allIncludedZoneIds.includes(pl.zone_id)) {
                        const blockNode = (currentNodes || []).find(n => n.id === nId);
                        if (blockNode) containedBlocks.push(blockNode);
                    }
                });

                // 1. FORTSCHRITT & STATUS-LISTEN BERECHNEN
                let totalWeightedScore = 0;
                let totalWeights = 0;
                const listDone = [];
                const listWarning = [];
                const listReady2D = [];

                containedBlocks.forEach(bn => {
                    const masterObj = bn.linked_id ? (currentNodes.find(x => x.linked_id === bn.linked_id) || bn) : bn;
                    const isDone = (masterObj.completion_status === 'completed') || (bn.completion_status === 'completed');
                    const pD = isDone ? 100 : ((masterObj.progress_design !== null && masterObj.progress_design !== undefined) ? masterObj.progress_design : 0);
                    const pDr = isDone ? 100 : ((masterObj.progress_drafting !== null && masterObj.progress_drafting !== undefined) ? masterObj.progress_drafting : 0);
                    const bTotalProg = (pD * 0.5) + (pDr * 0.5);

                    const bD = parseFloat(masterObj.budget_design_hours) || 0;
                    const bDr = parseFloat(masterObj.budget_drafting_hours) || 0;
                    const bWeight = (bD + bDr) || 1;

                    totalWeightedScore += (bTotalProg * bWeight);
                    totalWeights += bWeight;

                    // Ist-Stunden für Warnungen ermitteln
                    const rIds = masterObj.linked_id ? currentNodes.filter(x => x.linked_id === masterObj.linked_id).map(x => x.id) : [masterObj.id];
                    let bSpent = 0;
                    (typeof currentTimeLogs !== 'undefined' ? currentTimeLogs : []).filter(l => rIds.includes(l.node_id)).forEach(l => {
                        bSpent += parseFloat(l.hours) || 0;
                    });
                    const bBud = bD + bDr;

                    const docStr = masterObj.doc_number || (masterObj.article_number ? `ART-${masterObj.article_number}` : '');
                    const blockDisplayName = docStr ? `[${docStr}] ${masterObj.name}` : masterObj.name;

                    if (isDone || bTotalProg === 100) {
                        listDone.push({ id: bn.id, name: blockDisplayName, meta: '100%' });
                        if (bBud > 0 && bSpent > bBud) {
                            const over = bSpent - bBud;
                            listWarning.push({ id: bn.id, name: blockDisplayName, meta: `-${typeof formatHoursToHM === 'function' ? formatHoursToHM(over) : over.toFixed(1) + 'h'}` });
                        }
                    } else {
                        if (pD >= 85 && pDr === 0) {
                            listReady2D.push({ id: bn.id, name: blockDisplayName, meta: `CAD ${pD}%` });
                        }
                        if (bBud > 0 && bSpent > bBud) {
                            const over = bSpent - bBud;
                            listWarning.push({ id: bn.id, name: blockDisplayName, meta: `-${typeof formatHoursToHM === 'function' ? formatHoursToHM(over) : over.toFixed(1) + 'h'}` });
                        } else if (bBud > 0 && (bSpent / bBud) > ((bTotalProg + 25) / 100)) {
                            listWarning.push({ id: bn.id, name: blockDisplayName, meta: `Verzug (${bTotalProg}%)` });
                        } else if (bTotalProg === 0 && bSpent >= 1) {
                            listWarning.push({ id: bn.id, name: blockDisplayName, meta: `${typeof formatHoursToHM === 'function' ? formatHoursToHM(bSpent) : bSpent + 'h'} (0%)` });
                        }
                    }
                });

                const zoneProgress = totalWeights > 0 ? Math.round(totalWeightedScore / totalWeights) : 0;
                const barColor = zoneProgress === 100 ? '#38a169' : (zoneProgress > 50 ? '#3182ce' : '#dd6b20');

                // 2. DEDUPLIZIERTE BUDGET- & PUFFER-BERECHNUNG
                let zoneBudD = 0, zoneBudDr = 0, zoneSpentD = 0, zoneSpentDr = 0;
                const countedBudgetKeys = new Set();

                containedBlocks.forEach(bn => {
                    const masterObj = bn.linked_id ? (currentNodes.find(x => x.linked_id === bn.linked_id) || bn) : bn;
                    const uniqueKey = masterObj.linked_id || masterObj.id;

                    if (!countedBudgetKeys.has(uniqueKey)) {
                        countedBudgetKeys.add(uniqueKey);
                        zoneBudD += parseFloat(masterObj.budget_design_hours) || 0;
                        zoneBudDr += parseFloat(masterObj.budget_drafting_hours) || 0;

                        const relatedIds = masterObj.linked_id
                            ? currentNodes.filter(x => x.linked_id === masterObj.linked_id).map(x => x.id)
                            : [masterObj.id];

                        (typeof currentTimeLogs !== 'undefined' ? currentTimeLogs : []).filter(l => relatedIds.includes(l.node_id)).forEach(l => {
                            if (l.task_type === 'design') zoneSpentD += parseFloat(l.hours) || 0;
                            if (l.task_type === 'drafting') zoneSpentDr += parseFloat(l.hours) || 0;
                        });
                    }
                });

                const zoneTotBud = zoneBudD + zoneBudDr;
                const zoneTotSpent = zoneSpentD + zoneSpentDr;
                const zonePufferExact = zoneTotBud - zoneTotSpent;
                const hasZoneOverhang = zonePufferExact < -0.01;
                const pufferColor = hasZoneOverhang ? '#e53e3e' : '#38a169';
                const pufferText = hasZoneOverhang
                    ? `Überhang: -${typeof formatHoursToHM === 'function' ? formatHoursToHM(Math.abs(zonePufferExact)) : Math.abs(zonePufferExact).toFixed(1) + 'h'}`
                    : `Puffer: +${typeof formatHoursToHM === 'function' ? formatHoursToHM(zonePufferExact) : zonePufferExact.toFixed(1) + 'h'}`;

                // 3. POPOVER-HTML BAUEN
                const buildPopoverListHtml = (items) => {
                    if (!items || items.length === 0) {
                        return '<div style="font-size:10px; color:#a0aec0; font-style:italic; padding:2px 0;">Keine Baugruppen in dieser Kategorie.</div>';
                    }
                    let html = '<ul class="mgr-popover-list">';
                    items.forEach(it => {
                        html += `
                            <li onclick="event.stopPropagation(); window.centerOnManagerBlock('${it.id}')" title="Kamera auf Bauteil zentrieren">
                                <span class="p-name">${escapeHtml(it.name)}</span>
                                <span class="p-meta">${escapeHtml(it.meta)}</span>
                            </li>
                        `;
                    });
                    html += '</ul>';
                    return html;
                };

                const doneBadgeHtml = `
                    <span class="mgr-status-badge">
                        <strong style="color: #22543d;">${listDone.length} ✅</strong>
                        <div class="mgr-status-popover">
                            <div class="mgr-popover-title" style="color: #68d391;">✅ Erledigt (${listDone.length})</div>
                            <div class="mgr-popover-desc">Baugruppen sind zu 100% fertiggestellt (CAD & Zeichnung abgeschlossen). Klick zentriert Bauteil.</div>
                            ${buildPopoverListHtml(listDone)}
                        </div>
                    </span>
                `;

                const warnColor = listWarning.length > 0 ? '#e53e3e' : '#a0aec0';
                const warningBadgeHtml = `
                    <span class="mgr-status-badge">
                        <strong style="color: ${warnColor};">${listWarning.length} ⚠️</strong>
                        <div class="mgr-status-popover">
                            <div class="mgr-popover-title" style="color: #fc8181;">⚠️ Kritisch / Überhang (${listWarning.length})</div>
                            <div class="mgr-popover-desc">Budget überschritten oder Aufwand weicht stark vom Fertigstellungsgrad ab. Klick zentriert Bauteil.</div>
                            ${buildPopoverListHtml(listWarning)}
                        </div>
                    </span>
                `;

                const ready2DColor = listReady2D.length > 0 ? '#2b6cb0' : '#a0aec0';
                const ready2DBadgeHtml = `
                    <span class="mgr-status-badge">
                        <strong style="color: ${ready2DColor};">${listReady2D.length} 📄</strong>
                        <div class="mgr-status-popover">
                            <div class="mgr-popover-title" style="color: #63b3ed;">📄 Bereit für 2D (${listReady2D.length})</div>
                            <div class="mgr-popover-desc">CAD bei ≥ 85% – Modell bereit zur Zeichnungsableitung. Klick zentriert Bauteil.</div>
                            ${buildPopoverListHtml(listReady2D)}
                        </div>
                    </span>
                `;

                const zdPieStyle = typeof generatePieStyle === 'function' ? generatePieStyle(zoneSpentD, zoneBudD, zone.color_hex || '#2b6cb0') : '';
                const zdrPieStyle = typeof generatePieStyle === 'function' ? generatePieStyle(zoneSpentDr, zoneBudDr, '#38a169') : '';
                const docLabel = zone.doc_number ? `<span class="badge-doc-text">${escapeHtml(zone.doc_number)}</span>` : '';

                zoneEl.innerHTML = `
                  <div class="assembly-id-badge zone-badge-container" style="border-color: ${zone.color_hex || '#2b6cb0'};">
                    ${docLabel}
                    <div class="zone-progress-track" title="Fortschritt (anteilig gewichtet): ${zoneProgress}%">
                        <div class="zone-progress-fill" style="width: ${zoneProgress}%; background: ${barColor};"></div>
                        <span class="zone-progress-label">${zoneProgress}%</span>
                    </div>
                  </div>
                  <div class="project-zone-header no-pan" style="padding: 6px 12px; display: flex; justify-content: space-between; align-items: center; cursor: ${isLocked ? 'default' : 'move'}; overflow: visible;">
                    <div style="display: flex; flex-direction: column; gap: 2px; max-width: 52%; overflow: visible; position: relative;">
                      <span style="font-weight: bold; font-size: 13px; color: #2d3748; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(zone.title)}">📁 ${escapeHtml(zone.title)}</span>
                      <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; white-space: nowrap; overflow: visible;">
                        <span style="color: ${pufferColor}; font-weight: bold; font-family: monospace;">${pufferText}</span>
                        <span style="color: #cbd5e0;">|</span>
                        <span style="color: #718096; display: inline-flex; align-items: center; gap: 3px;">
                            ${containedBlocks.length} Blöcke (${doneBadgeHtml} · ${warningBadgeHtml} · ${ready2DBadgeHtml})
                        </span>
                      </div>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <div style="display:flex; align-items: center; gap: 4px;" title="CAD Summe (Dedupliziert)">
                            <div class="pie-chart" style="${zdPieStyle}; width: 20px; height: 20px;"><div class="pie-inner" style="width:12px; height:12px;"></div></div>
                            <span style="font-size: 10px; font-family: monospace; color:#4a5568;">${typeof formatHoursToHM === 'function' ? formatHoursToHM(zoneSpentD) : zoneSpentD} / ${typeof formatHoursToHM === 'function' ? formatHoursToHM(zoneBudD) : zoneBudD}</span>
                        </div>
                        <div style="display:flex; align-items: center; gap: 4px;" title="Zeichnung Summe (Dedupliziert)">
                            <div class="pie-chart" style="${zdrPieStyle}; width: 20px; height: 20px;"><div class="pie-inner" style="width:12px; height:12px;"></div></div>
                            <span style="font-size: 10px; font-family: monospace; color:#4a5568;">${typeof formatHoursToHM === 'function' ? formatHoursToHM(zoneSpentDr) : zoneSpentDr} / ${typeof formatHoursToHM === 'function' ? formatHoursToHM(zoneBudDr) : zoneBudDr}</span>
                        </div>
                        <div class="zone-actions" style="display:flex; gap:4px; margin-left:6px;">
                            <button type="button" class="zone-btn" title="Position sperren/entsperren" onclick="window.toggleManagerZoneLock(event, '${zone.id}')">${isLocked ? '🔒' : '🔓'}</button>
                            <button type="button" class="zone-btn" style="color:#e53e3e;" title="Rahmen entfernen" onclick="window.deleteManagerZone('${zone.id}')">✕</button>
                        </div>
                    </div>
                  </div>
                  <div class="zone-resize-handle no-pan" title="Größe anpassen"></div>
                `;

                if (!isLocked) {
                    let isDragging = false;
                    let startClientX = 0, startClientY = 0;
                    let initZLeft = 0, initZTop = 0;
                    let descZonesStartPos = [];
                    let blocksStartPos = [];
                    let allMovedZoneIds = [];

                    const startMgrZoneDrag = (e) => {
                        if (e.type === 'mousedown' && e.button !== 0) return;
                        if (e.target.closest('.zone-actions, button, input, select, .mgr-status-badge, .mgr-status-popover')) return;
                        if (e.type === 'touchstart' && e.touches.length > 1) return;
                        if (e.type === 'mousedown') e.preventDefault();
                        if (e.cancelable) e.stopPropagation();
                        window.isDraggingAnything = true;

                        isDragging = true;
                        startClientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                        startClientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
                        initZLeft = zone.pos_x;
                        initZTop = zone.pos_y;

                        const childZoneIds = getAllDescendantMgrZones(zone.id, mgrLayout.zones);
                        allMovedZoneIds = [zone.id, ...childZoneIds];

                        descZonesStartPos = childZoneIds.map(cid => {
                            const cz = mgrLayout.zones.find(z => z.id === cid);
                            return { id: cid, x: cz ? cz.pos_x : 0, y: cz ? cz.pos_y : 0 };
                        });

                        blocksStartPos = [];
                        Object.keys(mgrLayout.placements || {}).forEach(nId => {
                            const pl = mgrLayout.placements[nId];
                            if (pl && allIncludedZoneIds.includes(pl.zone_id)) {
                                blocksStartPos.push({ id: nId, x: pl.pos_x, y: pl.pos_y });
                            }
                        });

                        const onMove = (me) => {
                            if (!isDragging) return;
                            if (me.type === 'touchmove' && me.cancelable) me.preventDefault();

                            const clientX = me.type.includes('touch') ? me.touches[0].clientX : me.clientX;
                            const clientY = me.type.includes('touch') ? me.touches[0].clientY : me.clientY;
                            const scale = window.currentScale || 1;
                            const dx = (clientX - startClientX) / scale;
                            const dy = (clientY - startClientY) / scale;

                            zone.pos_x = Math.round(initZLeft + dx);
                            zone.pos_y = Math.round(initZTop + dy);
                            zoneEl.style.left = `${zone.pos_x}px`;
                            zoneEl.style.top = `${zone.pos_y}px`;

                            descZonesStartPos.forEach(dz => {
                                const zObj = mgrLayout.zones.find(x => x.id === dz.id);
                                const curX = Math.round(dz.x + dx);
                                const curY = Math.round(dz.y + dy);
                                if (zObj) { zObj.pos_x = curX; zObj.pos_y = curY; }
                                const dEl = document.getElementById(dz.id);
                                if (dEl) { dEl.style.left = `${curX}px`; dEl.style.top = `${curY}px`; }
                            });

                            blocksStartPos.forEach(bp => {
                                const curX = Math.round(bp.x + dx);
                                const curY = Math.round(bp.y + dy);
                                if (mgrLayout.placements[bp.id]) {
                                    mgrLayout.placements[bp.id].pos_x = curX;
                                    mgrLayout.placements[bp.id].pos_y = curY;
                                }
                                const bEl = document.getElementById(bp.id);
                                if (bEl) { bEl.style.left = `${curX}px`; bEl.style.top = `${curY}px`; }
                            });

                            const headerCenterX = zone.pos_x + (zone.width / 2);
                            const headerCenterY = zone.pos_y + 20;
                            const targetDropZone = getDeepestMgrZoneAt(headerCenterX, headerCenterY, allMovedZoneIds, mgrLayout.zones);

                            mgrLayout.zones.forEach(z => {
                                const el = document.getElementById(z.id);
                                if (el) {
                                    if (targetDropZone && z.id === targetDropZone.id) el.classList.add('zone-hover-highlight');
                                    else el.classList.remove('zone-hover-highlight');
                                }
                            });
                        };

                        const onUp = () => {
                            if (!isDragging) return;
                            isDragging = false;
                            window.isDraggingAnything = false;

                            window.removeEventListener('mousemove', onMove);
                            window.removeEventListener('mouseup', onUp);
                            window.removeEventListener('touchmove', onMove);
                            window.removeEventListener('touchend', onUp);
                            window.removeEventListener('touchcancel', onUp);

                            mgrLayout.zones.forEach(z => {
                                const el = document.getElementById(z.id);
                                if (el) el.classList.remove('zone-hover-highlight');
                            });

                            const headerCenterX = zone.pos_x + (zone.width / 2);
                            const headerCenterY = zone.pos_y + 20;
                            const targetDropZone = getDeepestMgrZoneAt(headerCenterX, headerCenterY, allMovedZoneIds, mgrLayout.zones);

                            zone.parent_zone_id = targetDropZone ? targetDropZone.id : null;
                            if (typeof saveManagerLayout === 'function') saveManagerLayout(mgrLayout);
                            renderCanvas();
                        };

                        window.addEventListener('mousemove', onMove);
                        window.addEventListener('mouseup', onUp);
                        window.addEventListener('touchmove', onMove, { passive: false });
                        window.addEventListener('touchend', onUp);
                        window.addEventListener('touchcancel', onUp);
                    };

                    const headerEl = zoneEl.querySelector('.project-zone-header');
                    if (headerEl) {
                        headerEl.addEventListener('mousedown', startMgrZoneDrag);
                        headerEl.addEventListener('touchstart', startMgrZoneDrag, { passive: false });
                    }
                }

                const rHandle = zoneEl.querySelector('.zone-resize-handle');
                if (rHandle) {
                    rHandle.addEventListener('mousedown', (e) => {
                        e.stopPropagation();
                        let isResizing = true;
                        window.isDraggingAnything = true;
                        const scale = window.currentScale || 1;
                        const sW = zone.width;
                        const sH = zone.height;
                        const sX = e.clientX;
                        const sY = e.clientY;

                        const onRMove = (me) => {
                            if (!isResizing) return;
                            zone.width = Math.max(300, Math.round(sW + (me.clientX - sX) / scale));
                            zone.height = Math.max(200, Math.round(sH + (me.clientY - sY) / scale));
                            zoneEl.style.width = `${zone.width}px`;
                            zoneEl.style.height = `${zone.height}px`;
                        };

                        const onRUp = () => {
                            isResizing = false;
                            window.isDraggingAnything = false;
                            window.removeEventListener('mousemove', onRMove);
                            window.removeEventListener('mouseup', onRUp);
                            if (typeof saveManagerLayout === 'function') saveManagerLayout(mgrLayout);
                            renderCanvas();
                        };

                        window.addEventListener('mousemove', onRMove);
                        window.addEventListener('mouseup', onRUp);
                    });
                }

                canvas.appendChild(zoneEl);
            });
        }
    } else {
        // HAUPT-CANVAS (CAD ZONEN)
        const nodeDirectStats = {};
        (currentNodes || []).forEach(n => {
            const logs = (typeof currentTimeLogs !== 'undefined' ? currentTimeLogs : []).filter(l => l.node_id === n.id);
            let dSpent = 0, drSpent = 0;
            logs.forEach(l => {
                if (l.task_type === 'design') dSpent += parseFloat(l.hours) || 0;
                if (l.task_type === 'drafting') drSpent += parseFloat(l.hours) || 0;
            });
            nodeDirectStats[n.id] = {
                dBudg: parseFloat(n.budget_design_hours) || 0,
                drBudg: parseFloat(n.budget_drafting_hours) || 0,
                dSpent,
                drSpent
            };
        });

        const zoneRollups = {};
        (currentZones || []).forEach(z => {
            const zLogs = (typeof currentTimeLogs !== 'undefined' ? currentTimeLogs : []).filter(l => l.zone_id === z.id || l.node_id === z.id);
            let dSpentDirect = 0, drSpentDirect = 0;
            zLogs.forEach(l => {
                if (l.task_type === 'design') dSpentDirect += parseFloat(l.hours) || 0;
                if (l.task_type === 'drafting') drSpentDirect += parseFloat(l.hours) || 0;
            });

            zoneRollups[z.id] = {
                dBudg: parseFloat(z.budget_design_hours) || 0,
                drBudg: parseFloat(z.budget_drafting_hours) || 0,
                dSpent: dSpentDirect,
                drSpent: drSpentDirect,
                directLogs: zLogs
            };
        });

        (currentNodes || []).forEach(n => {
            if (n.block_type === 'note' || n.doc_number === 'NOTE') return;
            const relatedIds = n.linked_id ? currentNodes.filter(x => x.linked_id === n.linked_id).map(x => x.id) : [n.id];
            const isEffectivelyLinked = relatedIds.length > 1;
            const masterObj = isEffectivelyLinked ? currentNodes.find(x => x.linked_id === n.linked_id) : n;
            const isMaster = !isEffectivelyLinked || (masterObj && masterObj.id === n.id);

            if (isMaster && n.zone_id && zoneRollups[n.zone_id] && nodeDirectStats[n.id]) {
                zoneRollups[n.zone_id].dBudg += nodeDirectStats[n.id].dBudg;
                zoneRollups[n.zone_id].drBudg += nodeDirectStats[n.id].drBudg;
                relatedIds.forEach(relId => {
                    if (nodeDirectStats[relId]) {
                        zoneRollups[n.zone_id].dSpent += nodeDirectStats[relId].dSpent;
                        zoneRollups[n.zone_id].drSpent += nodeDirectStats[relId].drSpent;
                    }
                });
            }
        });

        const zonesByDepthDesc = [...(currentZones || [])].sort((a, b) => getZoneDepth(b.id) - getZoneDepth(a.id));
        zonesByDepthDesc.forEach(z => {
            if (z.parent_zone_id && zoneRollups[z.parent_zone_id] && zoneRollups[z.id]) {
                zoneRollups[z.parent_zone_id].dBudg += zoneRollups[z.id].dBudg;
                zoneRollups[z.parent_zone_id].drBudg += zoneRollups[z.id].drBudg;
                zoneRollups[z.parent_zone_id].dSpent += zoneRollups[z.id].dSpent;
                zoneRollups[z.parent_zone_id].drSpent += zoneRollups[z.id].drSpent;
            }
        });

        const sortedZones = [...(currentZones || [])].sort((a, b) => getZoneDepth(a.id) - getZoneDepth(b.id));

        sortedZones.forEach(zone => {
            const zoneEl = document.createElement('div');
            zoneEl.id = zone.id;

            // Check Admin / User
            const uCode = typeof activeUserCode !== 'undefined' ? activeUserCode : '';
            const isAdminUser = typeof isAdmin !== 'undefined' ? isAdmin : false;

            const canMoveZone = (isAdminUser || (uCode && uCode === zone.created_by)) && !zone.is_locked;
            const isZoneExpanded = window.expandedZones && window.expandedZones.has(zone.id);

            zoneEl.className = `project-zone ${zone.is_locked ? 'zone-locked' : 'no-pan'} ${canMoveZone ? 'draggable-enabled' : ''}`;
            zoneEl.style.left = `${zone.pos_x}px`;
            zoneEl.style.top = `${zone.pos_y}px`;
            zoneEl.style.width = `${zone.width}px`;
            zoneEl.style.height = `${zone.height}px`;
            zoneEl.style.borderColor = zone.color_hex || '#a0aec0';
            zoneEl.style.zIndex = isZoneExpanded ? '2500' : 'auto';

            const zStats = zoneRollups[zone.id] || { dSpent: 0, dBudg: 0, drSpent: 0, drBudg: 0, directLogs: [] };
            const zdPieStyle = typeof generatePieStyle === 'function' ? generatePieStyle(zStats.dSpent, zStats.dBudg, zone.color_hex || '#a0aec0') : '';
            const zdrPieStyle = typeof generatePieStyle === 'function' ? generatePieStyle(zStats.drSpent, zStats.drBudg, '#38a169') : '';

            const allZoneIds = [zone.id, ...(typeof getAllDescendantZones === 'function' ? getAllDescendantZones(zone.id) : [])];
            const childBlocks = (currentNodes || []).filter(n => allZoneIds.includes(n.zone_id) && n.block_type !== 'note');

            let zoneProgress = 0;
            if (childBlocks.length > 0) {
                let totalWeightedScore = 0;
                let totalWeights = 0;
                childBlocks.forEach(bn => {
                    const masterObj = bn.linked_id ? (currentNodes.find(x => x.linked_id === bn.linked_id) || bn) : bn;
                    const isDone = (masterObj.completion_status === 'completed') || (bn.completion_status === 'completed');
                    const pD = isDone ? 100 : ((masterObj.progress_design !== null && masterObj.progress_design !== undefined) ? masterObj.progress_design : 0);
                    const pDr = isDone ? 100 : ((masterObj.progress_drafting !== null && masterObj.progress_drafting !== undefined) ? masterObj.progress_drafting : 0);
                    const bTotalProg = (pD * 0.5) + (pDr * 0.5);
                    const bWeight = (parseFloat(masterObj.budget_design_hours) || 0) + (parseFloat(masterObj.budget_drafting_hours) || 0) || 1;
                    totalWeightedScore += (bTotalProg * bWeight);
                    totalWeights += bWeight;
                });
                zoneProgress = Math.round(totalWeightedScore / totalWeights);
            }

            const identifier = zone.article_number || zone.doc_number || '';
            let badgeHtml = '';
            if (identifier || childBlocks.length > 0) {
                const docLabel = identifier ? `<span class="badge-doc-text">${typeof escapeHtml === 'function' ? escapeHtml(identifier) : identifier}</span>` : '';
                const barColor = zoneProgress === 100 ? '#38a169' : (zoneProgress > 50 ? '#3182ce' : '#dd6b20');
                badgeHtml = `
                    <div class="assembly-id-badge zone-badge-container" style="border-color: ${zone.color_hex || '#a0aec0'};">
                        ${docLabel}
                        <div class="zone-progress-track" title="Fortschritt Rahmen: ${zoneProgress}%">
                            <div class="zone-progress-fill" style="width: ${zoneProgress}%; background: ${barColor};"></div>
                            <span class="zone-progress-label">${zoneProgress}%</span>
                        </div>
                    </div>
                `;
            }

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
                        const canDel = isAdminUser || (log.status === 'pending' && log.user_code === uCode);
                        const delHtml = canDel ? `<span class="btn-delete-log" title="Löschen" onclick="handleDeleteLog('${log.id}')">✕</span>` : '';
                        const escNote = typeof escapeHtml === 'function' ? escapeHtml(log.note) : log.note;
                        const noteHtml = log.note ? `<span class="info-tooltip-trigger" style="font-size:10px;">ℹ️<span class="tooltip-overlay">${escNote}</span></span>` : '';

                        tableRows += `
                          <tr>
                            <td><strong>${typeof escapeHtml === 'function' ? escapeHtml(log.user_code) : log.user_code}</strong></td>
                            <td>${dateStr}</td>
                            <td>${kat}</td>
                            <td>${typeof formatHoursToHM === 'function' ? formatHoursToHM(log.hours) : log.hours} ${noteHtml}</td>
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

            let assignedBadgesHtml = '';
            if (zone.assigned_design_user) {
                assignedBadgesHtml += `<span class="author-badge" style="background:#2b6cb0; margin-left:6px;" title="CAD: ${typeof escapeHtml === 'function' ? escapeHtml(zone.assigned_design_user) : zone.assigned_design_user}">3D <strong>${typeof escapeHtml === 'function' ? escapeHtml(zone.assigned_design_user) : zone.assigned_design_user}</strong></span>`;
            }
            if (zone.assigned_drafting_user) {
                assignedBadgesHtml += `<span class="author-badge" style="background:#38a169; margin-left:4px;" title="Zeichnung: ${typeof escapeHtml === 'function' ? escapeHtml(zone.assigned_drafting_user) : zone.assigned_drafting_user}">📄 <strong>${typeof escapeHtml === 'function' ? escapeHtml(zone.assigned_drafting_user) : zone.assigned_drafting_user}</strong></span>`;
            }

            let zIcon = typeof CAD_ICONS !== 'undefined' ? CAD_ICONS.location : '📍';
            if (zone.zone_type === 'assembly') zIcon = typeof CAD_ICONS !== 'undefined' ? CAD_ICONS.assembly : '📦';
            else if (zone.zone_type === 'comment') zIcon = typeof CAD_ICONS !== 'undefined' ? CAD_ICONS.comment : '💬';
            else if (zone.zone_type === 'container') zIcon = typeof CAD_ICONS !== 'undefined' ? CAD_ICONS.container : '⬚';

            const escTitle = typeof escapeHtml === 'function' ? escapeHtml(zone.title) : zone.title;

            zoneEl.innerHTML = `
              ${badgeHtml}
              <div class="project-zone-header no-pan" style="position: relative; z-index: 50; border-bottom-color: ${zone.color_hex || '#a0aec0'}; padding-right: 140px; display: flex; flex-direction: column; gap: 5px; align-items: flex-start; padding: 8px 12px;">
                <div style="display:flex; align-items:center; overflow: hidden; white-space: nowrap; max-width: 100%;">
                  <span style="font-weight: bold; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escTitle}">${zIcon} ${escTitle}</span>
                  ${assignedBadgesHtml}
                </div>
                <div style="display:flex; gap: 24px; align-items: center; margin-top: 1px;">
                    <div style="display:flex; align-items: center; gap: 6px;" title="CAD Budget">
                        <div class="pie-chart" style="${zdPieStyle}; width: 22px; height: 22px;"><div class="pie-inner" style="width: 14px; height: 14px;"></div></div>
                        <span style="color: #718096; font-family: monospace; font-size: 10px;">${typeof formatHoursToHM === 'function' ? formatHoursToHM(zStats.dSpent) : zStats.dSpent} / ${typeof formatHoursToHM === 'function' ? formatHoursToHM(zStats.dBudg) : zStats.dBudg}</span>
                    </div>
                    <div style="display:flex; align-items: center; gap: 6px;" title="Zeichnung Budget">
                        <div class="pie-chart" style="${zdrPieStyle}; width: 22px; height: 22px;"><div class="pie-inner" style="width: 14px; height: 14px;"></div></div>
                        <span style="color: #718096; font-family: monospace; font-size: 10px;">${typeof formatHoursToHM === 'function' ? formatHoursToHM(zStats.drSpent) : zStats.drSpent} / ${typeof formatHoursToHM === 'function' ? formatHoursToHM(zStats.drBudg) : zStats.drBudg}</span>
                    </div>
                    <button type="button" class="zone-btn btn-toggle-zone-times" title="Zeiten auf Rahmen buchen & Details" style="padding: 2px 7px; font-weight: bold; border: 1px solid #cbd5e0; border-radius: 4px; background: #fff; flex-shrink: 0; font-size: 11px;">⏱️ Zeiten</button>
                </div>
                <div class="zone-actions" style="position: absolute; right: 10px; top: 8px; display: flex; gap: 6px; align-items: center; z-index: 60;">
                  <button type="button" class="zone-flow-btn" title="Materialfluss-Pfeil ziehen" onclick="handleStartZoneFlow(event, '${zone.id}')">➔ Fluss</button>
                  <button type="button" class="zone-btn" title="Position sperren/entsperren" onclick="toggleZoneLock(event, '${zone.id}')">${zone.is_locked ? '🔒' : '🔓'}</button>
                  <button type="button" class="zone-btn" title="Bearbeiten" onclick="openEditZoneModal('${zone.id}')">✏️</button>
                  ${isAdminUser || (uCode && uCode === zone.created_by) ? `<button type="button" class="zone-btn" style="color:#e53e3e;" title="Löschen" onclick="handleDeleteZone('${zone.id}')">✕</button>` : ''}
                </div>
              </div>
              ${isZoneExpanded ? `
              <div class="zone-body no-pan" style="position: absolute; top: 56px; left: 10px; z-index: 2500; background: rgba(255, 255, 255, 0.98); padding: 10px; border: 1px solid #cbd5e0; border-radius: 6px; pointer-events: auto; box-shadow: 0 6px 16px rgba(0,0,0,0.18); width: 420px; max-width: 420px;">
                <form class="log-form" onsubmit="handleZoneLog(event, '${zone.id}')">
                  <div class="time-inputs-row">
                    <select class="log-input" style="font-weight: bold; width: 60px;"><option value="${uCode}">${uCode || 'KÜR'}</option></select>
                    <select class="log-input" style="width: 75px;"><option value="drafting">Zeichn.</option><option value="design">CAD</option></select>
                    <input type="number" class="log-input input-hours" min="0" value="0" style="width: 44px;" title="Stunden (Mausrad: +/- 1h)" onwheel="handleTimeWheel(event, 'hour')" required />
                    <span>h</span>
                    <input type="number" class="log-input input-mins" min="0" step="5" value="30" style="width: 44px;" title="Minuten (Mausrad: +/- 5m)" onwheel="handleTimeWheel(event, 'min')" required />
                    <span>m</span>
                  </div>
                  <div style="display: flex; gap: 4px; margin-top: 6px;">
                    <input type="text" class="log-input" placeholder="Kommentar (optional)..." style="flex: 1;" />
                    <button type="submit" class="btn-log" style="background: ${zone.color_hex || '#2b6cb0'};">+ Log</button>
                  </div>
                </form>
                ${inlineZoneLogsHtml}
              </div>` : ''}
              <div class="zone-resize-handle no-pan" style="position: absolute; z-index: 50;" title="Größe anpassen"></div>
            `;

            const btnTimes = zoneEl.querySelector('.btn-toggle-zone-times');
            if (btnTimes) {
                btnTimes.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (typeof window.toggleZoneLogs === 'function') window.toggleZoneLogs(e, zone.id);
                });
            }

            const zoneBody = zoneEl.querySelector('.zone-body');
            if (zoneBody) {
                zoneBody.addEventListener('mousedown', (e) => e.stopPropagation());
                zoneBody.addEventListener('click', (e) => e.stopPropagation());
            }

            // Vollständiger Drag mit Zonen-Verschachtelung bis 5 Ebenen
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

                const startZoneDrag = (e) => {
                    if (e.type === 'mousedown' && e.button !== 0) return; // <--- NEU: Rechtsklick freigeben
                    if (e.target.closest('.zone-actions, .zone-resize-handle, .zone-body, input, select, button')) return;
                    if (e.type === 'touchstart' && e.touches.length > 1) return;
                    if (e.type === 'mousedown') e.preventDefault();
                    if (e.cancelable) e.stopPropagation();
                    window.isDraggingAnything = true;
                    isDragging = true;
                    const scale = window.currentScale || 1;

                    startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                    startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
                    initLeft = zone.pos_x;
                    initTop = zone.pos_y;

                    descendantZoneIds = getAllDescendantZones(zone.id);
                    allMovedZoneIds = [zone.id, ...descendantZoneIds];
                    descendantZones = currentZones.filter(z => descendantZoneIds.includes(z.id));
                    childNodes = currentNodes.filter(n => allMovedZoneIds.includes(n.zone_id));

                    childStartPos = childNodes.map(n => ({ id: n.id, x: n.pos_x, y: n.pos_y }));
                    childZonesStartPos = descendantZones.map(z => ({ id: z.id, x: z.pos_x, y: z.pos_y }));

                    if (e.cancelable) e.stopPropagation();

                    const onMouseMove = (moveEvent) => {
                        if (!isDragging) return;
                        if (moveEvent.type === 'touchmove' && moveEvent.cancelable) moveEvent.preventDefault();

                        const clientX = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientX : moveEvent.clientX;
                        const clientY = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientY : moveEvent.clientY;

                        const dx = (clientX - startX) / scale;
                        const dy = (clientY - startY) / scale;

                        const newParentX = Math.max(10, Math.round(initLeft + dx));
                        const newParentY = Math.max(10, Math.round(initTop + dy));
                        const actualDx = newParentX - initLeft;
                        const actualDy = newParentY - initTop;

                        zone.pos_x = newParentX;
                        zone.pos_y = newParentY;
                        zoneEl.style.left = `${zone.pos_x}px`;
                        zoneEl.style.top = `${zone.pos_y}px`;

                        descendantZones.forEach((z, idx) => {
                            z.pos_x = childZonesStartPos[idx].x + actualDx;
                            z.pos_y = childZonesStartPos[idx].y + actualDy;
                            const zEl = document.getElementById(z.id);
                            if (zEl) { zEl.style.left = `${z.pos_x}px`; zEl.style.top = `${z.pos_y}px`; }
                        });

                        childNodes.forEach((n, idx) => {
                            n.pos_x = childStartPos[idx].x + actualDx;
                            n.pos_y = childStartPos[idx].y + actualDy;
                            const nEl = document.getElementById(n.id);
                            if (nEl) { nEl.style.left = `${n.pos_x}px`; nEl.style.top = `${n.pos_y}px`; }
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
                        window.removeEventListener('touchmove', onMouseMove);
                        window.removeEventListener('touchend', onMouseUp);
                        window.removeEventListener('touchcancel', onMouseUp);

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
                            if (typeof fetchCanvasData === 'function') fetchCanvasData();
                        } else {
                            if (typeof renderCanvas === 'function') renderCanvas();
                            if (typeof window.renderSidebarZones === 'function') window.renderSidebarZones();
                        }
                    };

                    window.addEventListener('mousemove', onMouseMove);
                    window.addEventListener('mouseup', onMouseUp);
                    window.addEventListener('touchmove', onMouseMove, { passive: false });
                    window.addEventListener('touchend', onMouseUp);
                    window.addEventListener('touchcancel', onMouseUp);
                };

                zoneEl.addEventListener('mousedown', startZoneDrag);
                zoneEl.addEventListener('touchstart', startZoneDrag, { passive: false });
            }

            const resizeHandle = zoneEl.querySelector('.zone-resize-handle');
            if (resizeHandle && (isAdminUser || (uCode && uCode === zone.created_by))) {
                const startZoneResize = (e) => {
                    if (e.type === 'touchstart' && e.touches.length > 1) return;
                    if (e.cancelable) e.stopPropagation();

                    window.isDraggingAnything = true;
                    let isResizing = true;
                    const scale = window.currentScale || 1;
                    const startW = zone.width;
                    const startH = zone.height;
                    const startMouseX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                    const startMouseY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

                    const onResizeMove = (moveEvent) => {
                        if (!isResizing) return;
                        if (moveEvent.type === 'touchmove' && moveEvent.cancelable) moveEvent.preventDefault();

                        const clientX = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientX : moveEvent.clientX;
                        const clientY = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientY : moveEvent.clientY;

                        const dw = (clientX - startMouseX) / scale;
                        const dh = (clientY - startMouseY) / scale;
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
                        window.isDraggingAnything = false;
                        window.removeEventListener('mousemove', onResizeMove);
                        window.removeEventListener('mouseup', onResizeUp);
                        window.removeEventListener('touchmove', onResizeMove);
                        window.removeEventListener('touchend', onResizeUp);
                        window.removeEventListener('touchcancel', onResizeUp);

                        await db.from('project_zones').update({ width: zone.width, height: zone.height }).eq('id', zone.id);
                        if (window.pendingCanvasUpdate) {
                            window.pendingCanvasUpdate = false;
                            fetchCanvasData();
                        }
                    };

                    window.addEventListener('mousemove', onResizeMove);
                    window.addEventListener('mouseup', onResizeUp);
                    window.addEventListener('touchmove', onResizeMove, { passive: false });
                    window.addEventListener('touchend', onResizeUp);
                    window.addEventListener('touchcancel', onResizeUp);
                };

                resizeHandle.addEventListener('mousedown', startZoneResize);
                resizeHandle.addEventListener('touchstart', startZoneResize, { passive: false });
            }

            canvas.appendChild(zoneEl);
        });
    }

    // =========================================================================
    // 2. KNOTEN / BLÖCKE / NOTIZEN RENDERN
    // =========================================================================
    const originalNodes = currentNodes || [];
    const sortedNodes = originalNodes.map((n, idx) => ({ node: n, originalIdx: idx })).sort((a, b) => {
        const aIsExpanded = window.expandedNodes && window.expandedNodes.has(a.node.id);
        const bIsExpanded = window.expandedNodes && window.expandedNodes.has(b.node.id);
        const aIsTop = (window.topNodeId === a.node.id) || (window.selectedNodeIds && window.selectedNodeIds.has(a.node.id));
        const bIsTop = (window.topNodeId === b.node.id) || (window.selectedNodeIds && window.selectedNodeIds.has(b.node.id));
        const aTier = aIsExpanded ? 3 : (aIsTop ? 2 : 1);
        const bTier = bIsExpanded ? 3 : (bIsTop ? 2 : 1);
        if (aTier !== bTier) return aTier - bTier;
        return a.originalIdx - b.originalIdx;
    }).map(wrapper => wrapper.node);

    const uCode = typeof activeUserCode !== 'undefined' ? activeUserCode : '';
    const isAdminUser = typeof isAdmin !== 'undefined' ? isAdmin : false;

    sortedNodes.forEach(node => {
        const isNote = (node.block_type === 'note' || node.doc_number === 'NOTE' || node.doc_number === 'TODO');

        // Im Manager-Modus Notizen komplett ausblenden
        if (isManagerMode && isNote) return;

        // ---------------------------------------------------------------------
        // 2a. STICKY NOTES & TO-DO CARDS (NUR IM CAD MODUS)
        // ---------------------------------------------------------------------
        if (isNote) {
            const isPrivate = node.article_number === 'private';
            const isTodo = node.doc_number === 'TODO';
            const userCode = (uCode || '').toUpperCase();
            const noteCreator = (node.created_by || '').toUpperCase();

            if (isPrivate && noteCreator !== userCode && !isAdminUser) return;

            const isCollapsed = node.completion_status === 'collapsed';
            let noteW = parseFloat(node.budget_design_hours) || 220;
            let noteH = parseFloat(node.budget_drafting_hours) || (isTodo ? 140 : 90);
            if (noteW < 120) noteW = 220;
            if (noteH < 60) noteH = isTodo ? 140 : 90;

            const noteData = (typeof parseNotePayload === 'function')
                ? parseNotePayload(node.name)
                : { text: node.name || '', dueDate: null, items: [] };

            const totalItems = noteData.items ? noteData.items.length : 0;
            const doneItems = noteData.items ? noteData.items.filter(i => i.done).length : 0;
            const isAllCompleted = isTodo && totalItems > 0 && doneItems === totalItems;

            let isOverdue = false;
            let isDueToday = false;
            if (isTodo && noteData.dueDate && !isAllCompleted) {
                const todayStr = new Date().toISOString().split('T')[0];
                isOverdue = noteData.dueDate < todayStr;
                isDueToday = noteData.dueDate === todayStr;
            }

            const isAssignedToMe = (node.assigned_design_user && node.assigned_design_user.toUpperCase() === userCode);
            const isCreatedByMe = (noteCreator === userCode);
            const matchesFilter = node.assigned_design_user ? isAssignedToMe : isCreatedByMe;
            const isDimmed = window.personalFilterActive && !matchesFilter;

            const el = document.createElement('div');
            el.id = node.id;
            const canDrag = isAdminUser || (userCode === noteCreator);

            el.className = `note-card no-pan ${canDrag ? 'draggable-enabled' : 'draggable-disabled'} ${isDimmed ? 'node-dimmed' : ''} ${isOverdue ? 'note-overdue' : ''}`;
            el.style.left = `${node.pos_x}px`;
            el.style.top = `${node.pos_y}px`;

            if (isOverdue) {
                el.style.backgroundColor = '';
                el.style.border = '';
            } else {
                el.style.backgroundColor = node.color_hex || '#fefcbf';
                el.style.border = '1px solid rgba(0, 0, 0, 0.12)';
            }

            el.style.zIndex = isOverdue ? '180' : '150';
            el.style.width = isCollapsed ? '42px' : `${noteW}px`;
            el.style.height = isCollapsed ? '42px' : `${noteH}px`;
            el.style.minHeight = isCollapsed ? '42px' : (isTodo ? '90px' : '60px');
            el.style.padding = isCollapsed ? '0' : '8px 10px';
            el.style.justifyContent = isCollapsed ? 'center' : 'flex-start';
            el.style.alignItems = isCollapsed ? 'center' : 'stretch';

            const typeIcon = isTodo ? '☑️' : '📝';
            const progressBadge = (isTodo && totalItems > 0) ? `<span style="font-size:9px; font-weight:normal; opacity:0.8;">(${doneItems}/${totalItems})</span>` : '';
            const lockIcon = isPrivate ? '<span style="font-size:11px;" title="Private Notiz">🔒</span>' : '';

            let assignedHtml = '';
            if (node.assigned_design_user) {
                assignedHtml = `<span class="author-badge" style="background:#2b6cb0; font-size:8px; padding:0 3px;" title="Zugewiesen an: ${typeof escapeHtml === 'function' ? escapeHtml(node.assigned_design_user) : node.assigned_design_user}">👤 <strong>${typeof escapeHtml === 'function' ? escapeHtml(node.assigned_design_user) : node.assigned_design_user}</strong></span>`;
            }

            let dueBadgeHtml = '';
            if (isTodo && noteData.dueDate) {
                const dFormatted = new Date(noteData.dueDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
                let badgeClass = 'note-due-badge';
                if (isOverdue) badgeClass += ' overdue';
                else if (isDueToday) badgeClass += ' due-today';

                dueBadgeHtml = `<span class="${badgeClass}" title="Fällig am ${noteData.dueDate}">📅 ${dFormatted}</span>`;
            }

            if (isCollapsed) {
                el.innerHTML = `<div style="font-size:18px; line-height:1; pointer-events:none; user-select:none;" title="${typeof escapeHtml === 'function' ? escapeHtml(noteData.text || 'Notiz') : 'Notiz'}">${typeIcon}</div>`;
            } else {
                let checklistHtml = '';
                if (isTodo && noteData.items && noteData.items.length > 0) {
                    checklistHtml = `<div style="display:flex; flex-direction:column; gap:2px; margin-top:6px; max-height:120px; overflow-y:auto; pointer-events:auto;">`;
                    noteData.items.forEach((item, idx) => {
                        checklistHtml += `
                            <div class="note-todo-item ${item.done ? 'done' : ''}">
                                <input type="checkbox" ${item.done ? 'checked' : ''} onchange="handleToggleTodoItem(event, '${node.id}', ${idx})" />
                                <span style="word-break: break-word;">${typeof escapeHtml === 'function' ? escapeHtml(item.text) : item.text}</span>
                            </div>
                        `;
                    });
                    checklistHtml += `</div>`;
                }

                const escCreator = typeof escapeHtml === 'function' ? escapeHtml(node.created_by || 'COT') : (node.created_by || 'COT');
                const escText = typeof escapeHtml === 'function' ? escapeHtml(noteData.text) : noteData.text;
                el.innerHTML = `
                    <div style="pointer-events: none; display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; font-size:10px; font-weight:bold; color:#4a5568; border-bottom:1px solid rgba(0,0,0,0.08); padding-bottom:3px;">
                        <div style="display:flex; align-items:center; gap:4px; overflow:hidden;">
                            <span title="${isTodo ? 'To-Do Liste' : 'Reine Notiz'}">${typeIcon}</span>
                            <span>${escCreator}</span>
                            ${assignedHtml}
                            ${progressBadge}
                            ${dueBadgeHtml}
                        </div>
                        <div style="pointer-events:auto; display:flex; gap:4px; align-items:center; flex-shrink:0;">
                            ${lockIcon}
                            <span onclick="toggleNoteCollapse(event, '${node.id}')" style="cursor:pointer; opacity:0.6; font-size:10px; border:1px solid rgba(0,0,0,0.1); border-radius:3px; padding:0 3px;" title="Zuklappen">−</span>
                        </div>
                    </div>
                    <div style="pointer-events: none; white-space: pre-wrap; word-break: break-word; font-size:11px; color:#2d3748; flex-shrink: 0;">${escText}</div>
                    ${checklistHtml}
                    ${canDrag ? '<div class="note-resize-handle no-pan" title="Größe anpassen"></div>' : ''}
                `;
            }

            el.addEventListener('mouseenter', () => { window.hoveredNodeId = node.id; });
            el.addEventListener('mouseleave', () => { window.hoveredNodeId = null; });

            el.addEventListener('dblclick', (e) => {
                if (e.target.tagName === 'INPUT') return;
                e.stopPropagation();
                if (canDrag && typeof openEditNoteModal === 'function') openEditNoteModal(node.id);
            });

            if (canDrag) {
                let isDragging = false;
                let didDrag = false;
                let startClientX = 0, startClientY = 0;
                let initX = 0, initY = 0;

                const startNoteDrag = (e) => {
                    if (e.target.closest('.note-resize-handle, span[title="Zuklappen"], input[type="checkbox"]')) return;
                    if (e.type === 'mousedown' && e.button !== 0) return;
                    if (e.type === 'touchstart' && e.touches.length > 1) return;

                    window.isDraggingAnything = true;
                    isDragging = true;
                    didDrag = false;

                    startClientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                    startClientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
                    initX = node.pos_x;
                    initY = node.pos_y;
                    if (e.cancelable) e.stopPropagation();

                    const onMouseMove = (moveEvent) => {
                        if (!isDragging) return;
                        if (moveEvent.type === 'touchmove' && moveEvent.cancelable) moveEvent.preventDefault();

                        const clientX = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientX : moveEvent.clientX;
                        const clientY = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientY : moveEvent.clientY;
                        const scale = window.currentScale || 1;
                        const dx = (clientX - startClientX) / scale;
                        const dy = (clientY - startClientY) / scale;

                        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDrag = true;

                        node.pos_x = Math.round(initX + dx);
                        node.pos_y = Math.round(initY + dy);
                        el.style.left = `${node.pos_x}px`;
                        el.style.top = `${node.pos_y}px`;

                        const targetZone = (typeof getDeepestZoneAt === 'function')
                            ? getDeepestZoneAt(node.pos_x + 95, node.pos_y + 40)
                            : null;

                        (currentZones || []).forEach(z => {
                            const zEl = document.getElementById(z.id);
                            if (zEl) {
                                if (targetZone && z.id === targetZone.id) zEl.classList.add('zone-hover-highlight');
                                else zEl.classList.remove('zone-hover-highlight');
                            }
                        });
                    };

                    const onMouseUp = async () => {
                        if (!isDragging) return;
                        isDragging = false;

                        window.removeEventListener('mousemove', onMouseMove);
                        window.removeEventListener('mouseup', onMouseUp);
                        window.removeEventListener('touchmove', onMouseMove);
                        window.removeEventListener('touchend', onMouseUp);
                        window.removeEventListener('touchcancel', onMouseUp);

                        (currentZones || []).forEach(z => {
                            const zEl = document.getElementById(z.id);
                            if (zEl) zEl.classList.remove('zone-hover-highlight');
                        });

                        const targetZone = (typeof getDeepestZoneAt === 'function')
                            ? getDeepestZoneAt(node.pos_x + 95, node.pos_y + 40)
                            : null;
                        node.zone_id = targetZone ? targetZone.id : null;

                        await db.from('project_nodes').update({
                            pos_x: node.pos_x,
                            pos_y: node.pos_y,
                            zone_id: node.zone_id
                        }).eq('id', node.id);

                        window.isDraggingAnything = false;
                    };

                    window.addEventListener('mousemove', onMouseMove);
                    window.addEventListener('mouseup', onMouseUp);
                    window.addEventListener('touchmove', onMouseMove, { passive: false });
                    window.addEventListener('touchend', onMouseUp);
                    window.addEventListener('touchcancel', onMouseUp);
                };

                el.addEventListener('mousedown', startNoteDrag);
                el.addEventListener('touchstart', startNoteDrag, { passive: false });

                el.addEventListener('click', (e) => {
                    if (didDrag) { didDrag = false; return; }
                    if (isCollapsed) toggleNoteCollapse(e, node.id);
                });

                if (!isCollapsed) {
                    const resizeHandle = el.querySelector('.note-resize-handle');
                    if (resizeHandle) {
                        const startNoteResize = (e) => {
                            if (e.type === 'touchstart' && e.touches.length > 1) return;
                            if (e.cancelable) e.stopPropagation();

                            window.isDraggingAnything = true;
                            let isResizing = true;
                            const scale = window.currentScale || 1;
                            const startW = noteW;
                            const startH = noteH;
                            const startMouseX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                            const startMouseY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

                            const onResizeMove = (moveEvent) => {
                                if (!isResizing) return;
                                if (moveEvent.type === 'touchmove' && moveEvent.cancelable) moveEvent.preventDefault();

                                const clientX = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientX : moveEvent.clientX;
                                const clientY = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientY : moveEvent.clientY;

                                const dw = (clientX - startMouseX) / scale;
                                const dh = (clientY - startMouseY) / scale;

                                const newW = Math.max(140, Math.round(startW + dw));
                                const newH = Math.max(70, Math.round(startH + dh));

                                el.style.width = `${newW}px`;
                                el.style.height = `${newH}px`;
                                node.budget_design_hours = newW;
                                node.budget_drafting_hours = newH;
                            };

                            const onResizeUp = async () => {
                                if (!isResizing) return;
                                isResizing = false;
                                window.isDraggingAnything = false;
                                window.removeEventListener('mousemove', onResizeMove);
                                window.removeEventListener('mouseup', onResizeUp);
                                window.removeEventListener('touchmove', onResizeMove);
                                window.removeEventListener('touchend', onResizeUp);
                                window.removeEventListener('touchcancel', onResizeUp);

                                await db.from('project_nodes').update({
                                    budget_design_hours: node.budget_design_hours,
                                    budget_drafting_hours: node.budget_drafting_hours
                                }).eq('id', node.id);
                            };

                            window.addEventListener('mousemove', onResizeMove);
                            window.addEventListener('mouseup', onResizeUp);
                            window.addEventListener('touchmove', onResizeMove, { passive: false });
                            window.addEventListener('touchend', onResizeUp);
                            window.addEventListener('touchcancel', onResizeUp);
                        };

                        resizeHandle.addEventListener('mousedown', startNoteResize);
                        resizeHandle.addEventListener('touchstart', startNoteResize, { passive: false });
                    }
                }
            }

            canvas.appendChild(el);
            return;
        }

        // ---------------------------------------------------------------------
        // =====================================================================
        // Projekt: CAD Time Manager
        // Domain: Canvas Engine (Manager-Karten: Drift-Pill, Handoff & Fokus)
        // ERSETZEN IN: canvas.js (Abschnitt 2b: Manager-Karten-Rendering)
        // Zeitstempel: 2026-09-26 09:40:00 CEST
        // Breadcrumbs:
        //   - [2026-09-17 22:45:00 CEST]: Basis Manager-Karte mit 50/50 Slidern.
        //   - [2026-09-26 09:40:00 CEST]: Earned-Value Metrik (Drift-Pills), 
        //     Handoff-Badges (Bereit für 2D), Bearbeiter-Badges im Header und
        //     Unterstützung für den Fokus-Filter (Abdimmen unkritischer Blöcke).
        // =====================================================================
        if (isManagerMode && (!mgrLayout || !mgrLayout.placements || !mgrLayout.placements[node.id])) {
            return;
        }

        // NEU: Ausblenden von Blöcken, die nicht in Rahmen gelegt wurden (wenn Filter aktiv und keine Sortier-Hilfe)
        const placement = mgrLayout?.placements?.[node.id];
        const isBlockFramed = !!(placement && placement.zone_id && (mgrLayout.zones || []).some(z => z.id === placement.zone_id));

        if (isManagerMode && window.managerFramedOnlyActive && !isBlockFramed && !window.isManagerSortHelperActive) {
            return;
        }

        const relatedNodeIds = node.linked_id
            ? currentNodes.filter(n => n.linked_id === node.linked_id).map(n => n.id)
            : [node.id];

        const isEffectivelyLinked = relatedNodeIds.length > 1;
        const masterNode = isEffectivelyLinked ? (currentNodes.find(n => n.linked_id === node.linked_id) || node) : node;
        const isMaster = !isEffectivelyLinked || (masterNode.id === node.id);

        let dSpentAgg = 0, drSpentAgg = 0;
        relatedNodeIds.forEach(id => {
            const st = rollups[id] || { totalDesign: 0, totalDrafting: 0 };
            dSpentAgg += st.totalDesign || 0;
            drSpentAgg += st.totalDrafting || 0;
        });

        const nodeColor = node.color_hex || '#2b6cb0';
        const dBudg = Math.max(0, parseFloat(masterNode.budget_design_hours) || 0);
        const drBudg = Math.max(0, parseFloat(masterNode.budget_drafting_hours) || 0);
        const dPct = dBudg > 0 ? Math.round((dSpentAgg / dBudg) * 100) : 0;
        const drPct = drBudg > 0 ? Math.round((drSpentAgg / drBudg) * 100) : 0;

        const dPieStyle = typeof generatePieStyle === 'function' ? generatePieStyle(dSpentAgg, dBudg, nodeColor) : '';
        const drPieStyle = typeof generatePieStyle === 'function' ? generatePieStyle(drSpentAgg, drBudg, '#38a169') : '';

        const isBlockDone = masterNode.completion_status === 'completed';
        const pDesign = isBlockDone ? 100 : ((masterNode.progress_design !== null && masterNode.progress_design !== undefined) ? masterNode.progress_design : 0);
        const pDrafting = isBlockDone ? 100 : ((masterNode.progress_drafting !== null && masterNode.progress_drafting !== undefined) ? masterNode.progress_drafting : 0);
        const pTotal = Math.round((pDesign * 0.5) + (pDrafting * 0.5));

        // ---------------------------------------------------------------------
        // EARNED VALUE / DRIFT BERECHNUNG & HEALTH-PILL
        // ---------------------------------------------------------------------
        /**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Canvas Engine (Korrektur: Echte Budget-Puffer- und Überhangslogik)
 * ERSETZEN IN: canvas.js (In renderCanvas() -> Manager-Karten Health-Pill Bereich)
 * Zeitstempel: 2026-09-26 10:15:00 CEST
 * Breadcrumbs:
 *   - [2026-09-26 09:40:00 CEST]: Health-Pill Basis.
 *   - [2026-09-26 10:15:00 CEST]: BUGFIX: Bei 0% Fortschritt wird nicht mehr fälschlich
 *     ein Überhang ausgewiesen. Überhang greift strikt nur bei Ist > Budget.
 *     Fertige Baugruppen mit Budgetüberschreitung weisen ihren Überzug transparent aus.
 * =============================================================================
 */
        const totBudg = dBudg + drBudg;
        const totSpent = dSpentAgg + drSpentAgg;
        let isCritical = false;
        let healthPillHtml = '';

        if (totBudg > 0) {
            const diffHours = totBudg - totSpent;
            const isOverBudget = diffHours < -0.01;
            const overHours = Math.abs(diffHours);
            const overFormatted = typeof formatHoursToHM === 'function' ? formatHoursToHM(overHours) : `${overHours.toFixed(1)}h`;
            const restFormatted = typeof formatHoursToHM === 'function' ? formatHoursToHM(Math.max(0, diffHours)) : `${Math.max(0, diffHours).toFixed(1)}h`;

            if (isBlockDone || pTotal === 100) {
                if (isOverBudget) {
                    isCritical = true;
                    healthPillHtml = `<span class="mgr-health-pill red" title="Abgeschlossen, aber Budget um ${overFormatted} überschritten">✅ -${overFormatted}</span>`;
                } else {
                    healthPillHtml = `<span class="mgr-health-pill green" title="Erfolgreich im Budget abgeschlossen">🟢 Fertig</span>`;
                }
            } else if (isOverBudget) {
                // Echter Budget-Überhang
                isCritical = true;
                healthPillHtml = `<span class="mgr-health-pill red" title="Budget überschritten! ${totSpent.toFixed(1)}h von ${totBudg}h verbraucht">🔴 -${overFormatted} Überhang</span>`;
            } else {
                // Liegt noch im Budget -> Puffer vorhanden
                const timePct = Math.round((totSpent / totBudg) * 100);

                if (pTotal === 0 && totSpent >= 1) {
                    // Zeit gebucht, aber Fortschritt noch 0%
                    isCritical = true;
                    healthPillHtml = `<span class="mgr-health-pill yellow" title="${totSpent.toFixed(1)}h gebucht, Fortschritt noch bei 0%. Bitte Slider aktualisieren.">🟡 0% (Rest: ${restFormatted})</span>`;
                } else if (timePct > (pTotal + 25)) {
                    // Zeitverbrauch hinkt dem Fortschritt deutlich voraus
                    isCritical = true;
                    healthPillHtml = `<span class="mgr-health-pill yellow" title="Verzug: ${timePct}% Budget verbraucht bei ${pTotal}% Fertigstellung">🟡 Verzug (${restFormatted})</span>`;
                } else {
                    healthPillHtml = `<span class="mgr-health-pill green" title="Im Plan (+${restFormatted} Puffer übrig)">🟢 +${restFormatted}</span>`;
                }
            }
        } else {
            healthPillHtml = `<span class="mgr-health-pill neutral" title="Kein Budget hinterlegt">⚪ ${typeof formatHoursToHM === 'function' ? formatHoursToHM(totSpent) : totSpent.toFixed(1) + 'h'}</span>`;
        }

        // ---------------------------------------------------------------------
        // WORKFLOW & HANDOFF BADGES (CAD -> 2D)
        // ---------------------------------------------------------------------
        let handoffBadgeHtml = '';
        if (isBlockDone || (pDesign === 100 && pDrafting === 100)) {
            handoffBadgeHtml = `<span class="mgr-handoff-badge done" title="Vollständig abgeschlossen">✅ 100%</span>`;
        } else if (pDesign >= 85 && pDrafting === 0) {
            isCritical = true; // Handlungsbedarf für Zeichnungsableitung
            handoffBadgeHtml = `<span class="mgr-handoff-badge ready-2d" title="CAD bei ${pDesign}% – Modell bereit zur Zeichnungsableitung!">📄 Bereit für 2D</span>`;
        } else if (pDrafting > 10 && pDesign < 50) {
            isCritical = true;
            handoffBadgeHtml = `<span class="mgr-handoff-badge warning-early" title="Achtung: Zeichnung bereits begonnen (${pDrafting}%), bevor Modell eingefroren ist (${pDesign}%)">⚠️ Frühe Zeichn.</span>`;
        }

        if (masterNode.completion_status === 'pending_approval') {
            isCritical = true;
        }

        const identifier = node.article_number || node.doc_number || '';
        let badgeHtml = '';
        if (identifier || pTotal > 0 || isBlockDone) {
            const docLabel = identifier ? `<span class="badge-doc-text">${typeof escapeHtml === 'function' ? escapeHtml(identifier) : identifier}</span>` : '';
            const barColor = pTotal === 100 ? '#38a169' : (pTotal > 50 ? '#3182ce' : '#dd6b20');
            badgeHtml = `
              <div class="assembly-id-badge zone-badge-container" style="border-color: ${nodeColor};">
                ${docLabel}
                <div class="zone-progress-track" title="Fertigstellung: ${pTotal}% (CAD: ${pDesign}% | Zeichn: ${pDrafting}%)">
                    <div class="zone-progress-fill" style="width: ${pTotal}%; background: ${barColor};"></div>
                    <span class="zone-progress-label">${pTotal}%</span>
                </div>
              </div>
            `;
        }

        // Ermittelt die Position: Im Hilfsmodus die temporäre Spalte, sonst die echte gespeicherte Koordinate

        const helperPlacement = (window.isManagerSortHelperActive && (window.managerHelperVirtualPlacements || window.managerHelperPlacements))
            ? (window.managerHelperVirtualPlacements || window.managerHelperPlacements)[node.id]
            : null;

        const posX = isManagerMode
            ? (helperPlacement?.pos_x ?? mgrLayout.placements[node.id]?.pos_x ?? node.pos_x)
            : node.pos_x;
        const posY = isManagerMode
            ? (helperPlacement?.pos_y ?? mgrLayout.placements[node.id]?.pos_y ?? node.pos_y)
            : node.pos_y;
        const isSelected = window.selectedNodeIds.has(node.id);

        const creator = node.created_by || 'COT';
        const canDrag = isAdminUser || (uCode && uCode === creator);
        const isExpanded = window.expandedNodes && window.expandedNodes.has(node.id);

        const isUserAssigned = (node.assigned_design_user === uCode) || (node.assigned_drafting_user === uCode);

        // Filter-Dimmung: Fokus-Filter im Manager-Board vs. Persönlicher Filter im CAD-Modus
        const isFocusDimmed = isManagerMode && window.managerFocusActive && !isCritical;
        const isPersonalDimmed = !isManagerMode && window.personalFilterActive && !isUserAssigned;
        const isDimmed = isManagerMode ? isFocusDimmed : isPersonalDimmed;

        const el = document.createElement('div');
        el.id = node.id;
        if (isEffectivelyLinked) el.dataset.linkedId = node.linked_id;

        el.className = `assembly-card no-pan ${isManagerMode ? 'manager-card draggable-enabled' : (canDrag ? 'draggable-enabled' : 'draggable-disabled')} ${isSelected ? 'selected-node' : ''} ${isDimmed ? 'node-dimmed' : ''}`;
        el.style.left = `${posX}px`;
        el.style.top = `${posY}px`;
        el.style.borderColor = nodeColor;
        el.style.borderStyle = (isEffectivelyLinked && !isMaster) ? 'dashed' : 'solid';
        el.style.zIndex = isExpanded ? 2000 : 100;

        const typeIconSvg = node.block_type === 'part' ? (window.CAD_ICONS ? CAD_ICONS.part : '⚙️') : (window.CAD_ICONS ? CAD_ICONS.assembly : '📦');
        const linkedIconHtml = isEffectivelyLinked ? `<span class="linked-icon" title="${isMaster ? 'Master-Instanz' : 'Referenz-Instanz'}">🔗${isMaster ? '' : ' Ref'}</span>` : '';

        let assignedBadgesHtml = '';
        if (node.assigned_design_user) {
            assignedBadgesHtml += `<span class="author-badge" style="background:#2b6cb0; margin-left:2px;" title="CAD: ${typeof escapeHtml === 'function' ? escapeHtml(node.assigned_design_user) : node.assigned_design_user}">3D <strong>${typeof escapeHtml === 'function' ? escapeHtml(node.assigned_design_user) : node.assigned_design_user}</strong></span>`;
        }
        if (node.assigned_drafting_user) {
            assignedBadgesHtml += `<span class="author-badge" style="background:#38a169; margin-left:2px;" title="Zeichnung: ${typeof escapeHtml === 'function' ? escapeHtml(node.assigned_drafting_user) : node.assigned_drafting_user}">📄 <strong>${typeof escapeHtml === 'function' ? escapeHtml(node.assigned_drafting_user) : node.assigned_drafting_user}</strong></span>`;
        }

        const dStr = isMaster ? `${typeof formatHoursToHM === 'function' ? formatHoursToHM(dSpentAgg) : dSpentAgg} / ${typeof formatHoursToHM === 'function' ? formatHoursToHM(dBudg) : dBudg}` : `(${typeof formatHoursToHM === 'function' ? formatHoursToHM(dSpentAgg) : dSpentAgg} / ${typeof formatHoursToHM === 'function' ? formatHoursToHM(dBudg) : dBudg})`;
        const drStr = isMaster ? `${typeof formatHoursToHM === 'function' ? formatHoursToHM(drSpentAgg) : drSpentAgg} / ${typeof formatHoursToHM === 'function' ? formatHoursToHM(drBudg) : drBudg}` : `(${typeof formatHoursToHM === 'function' ? formatHoursToHM(drSpentAgg) : drSpentAgg} / ${typeof formatHoursToHM === 'function' ? formatHoursToHM(drBudg) : drBudg})`;

        // =====================================================================
        // HTML-INHALT FÜR MANAGER-BOARD VS. HAUPT-CANVAS
        // =====================================================================
        if (isManagerMode) {
            let progressControlsHtml = '';
            if (isAdminUser) {
                progressControlsHtml = `
                  <div class="mgr-progress-box" style="margin-top: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px;" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                      <span style="font-size:9px; font-weight:bold; text-transform:uppercase; color:#4a5568;">Fertigstellungsgrad (50/50)</span>
                      <span id="mgr-tot-badge-${node.id}" style="font-size:10px; font-weight:bold; padding:1px 6px; border-radius:10px; background:${pTotal === 100 ? '#c6f6d5' : (pTotal > 50 ? '#bee3f8' : '#edf2f7')}; color:${pTotal === 100 ? '#22543d' : (pTotal > 50 ? '#2b6cb0' : '#4a5568')};">${pTotal}% Gesamt</span>
                    </div>
                    <div style="margin-bottom: 4px;">
                      <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:bold; color:#2b6cb0; margin-bottom:1px;">
                        <span>📐 CAD (3D)</span>
                        <span id="mgr-prog-val-d-${node.id}">${pDesign}%</span>
                      </div>
                      <input type="range" class="mgr-prog-slider" min="0" max="100" step="5" value="${pDesign}" 
                        style="width:100%; height:4px; accent-color:#2b6cb0; cursor:pointer;" 
                        oninput="window.handleManagerProgressInput('${node.id}', 'design', this.value)"
                        onchange="window.handleManagerProgressChange('${node.id}', 'design', this.value)" />
                    </div>
                    <div>
                      <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:bold; color:#38a169; margin-bottom:1px;">
                        <span>📄 Zeichnung (2D)</span>
                        <span id="mgr-prog-val-dr-${node.id}">${pDrafting}%</span>
                      </div>
                      <input type="range" class="mgr-prog-slider" min="0" max="100" step="5" value="${pDrafting}" 
                        style="width:100%; height:4px; accent-color:#38a169; cursor:pointer;" 
                        oninput="window.handleManagerProgressInput('${node.id}', 'drafting', this.value)"
                        onchange="window.handleManagerProgressChange('${node.id}', 'drafting', this.value)" />
                    </div>
                  </div>
                `;
            } else {
                progressControlsHtml = `
                  <div class="mgr-progress-box" style="margin-top: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px;">
                    <div style="display:flex; justify-content:space-between; font-size:9px; color:#2b6cb0; font-weight:bold;">
                      <span>📐 CAD: ${pDesign}%</span>
                      <span>📄 Zeichn: ${pDrafting}%</span>
                    </div>
                    <div style="width:100%; height:6px; background:#e2e8f0; border-radius:3px; overflow:hidden; display:flex; margin-top:2px;">
                      <div style="width:${pDesign * 0.5}%; height:100%; background:#2b6cb0;"></div>
                      <div style="width:${pDrafting * 0.5}%; height:100%; background:#38a169;"></div>
                    </div>
                  </div>
                `;
            }

            const escNodeName = typeof escapeHtml === 'function' ? escapeHtml(node.name) : node.name;

            el.innerHTML = `
              ${badgeHtml}
              <div class="assembly-header" style="background: ${nodeColor}; display: flex; flex-direction: column; gap: 4px; border-top-left-radius: 6px; border-top-right-radius: 6px; padding: 6px 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <span style="overflow: hidden; text-overflow: ellipsis; font-size: 13px; display: inline-flex; align-items: center; gap: 5px; color: #fff; font-weight: bold;" title="${escNodeName}">
                    ${typeIconSvg} ${escNodeName}
                  </span>
                  <div style="display:flex; align-items:center; gap:3px; flex-shrink:0;">
                    ${linkedIconHtml}
                  </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding-top: 2px; border-top: 1px solid rgba(255,255,255,0.15);">
                  <div style="display:flex; align-items:center; gap:3px; overflow:hidden;">
                    ${assignedBadgesHtml || '<span style="font-size:9px; opacity:0.6; color:#fff;">Offen</span>'}
                  </div>
                  <div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
                    ${handoffBadgeHtml}
                    ${healthPillHtml}
                  </div>
                </div>
              </div>
              <div class="assembly-body" style="padding: 8px 10px;">
                <div class="charts-grid" style="margin: 0; padding: 6px;">
                  <div class="chart-box">
                    <div class="pie-chart" style="${dPieStyle}"><div class="pie-inner">${dPct}%</div></div>
                    <div class="chart-label">CAD</div>
                    <div class="chart-sub">${typeof formatHoursToHM === 'function' ? formatHoursToHM(dSpentAgg) : dSpentAgg} / ${typeof formatHoursToHM === 'function' ? formatHoursToHM(dBudg) : dBudg}</div>
                  </div>
                  <div class="chart-box">
                    <div class="pie-chart" style="${drPieStyle}"><div class="pie-inner">${drPct}%</div></div>
                    <div class="chart-label">Zeichnung</div>
                    <div class="chart-sub">${typeof formatHoursToHM === 'function' ? formatHoursToHM(drSpentAgg) : drSpentAgg} / ${typeof formatHoursToHM === 'function' ? formatHoursToHM(drBudg) : drBudg}</div>
                  </div>
                </div>
                ${progressControlsHtml}
              </div>
            `;
        } else {
            // Reguläre CAD-Karte mit Handles, Subtree-Toggle, Quick-Logging & Inline-Logs
            const typeLabel = node.block_type === 'part' ? 'Bauteil' : 'Baugruppe';
            const hasChildren = (typeof currentEdges !== 'undefined' ? currentEdges : []).some(e => e.source === node.id);
            const isSubtreeCollapsed = window.collapsedParents.has(node.id);

            let subtreeBtnHtml = '';
            if (hasChildren) {
                subtreeBtnHtml = `
                    <button type="button" class="btn-tree-toggle" title="${isSubtreeCollapsed ? 'Untergeordnete Blöcke einblenden' : 'Untergeordnete Blöcke ausblenden'}" onclick="window.toggleSubtreeCollapse(event, '${node.id}')">
                      ${isSubtreeCollapsed ? '＋' : '－'}
                    </button>
                `;
            }

            let completionBtnHtml = '';
            let statusIcon = '';
            if (masterNode.completion_status === 'completed') {
                statusIcon = ' <span title="Erledigt">✅</span>';
                completionBtnHtml = `<span style="font-size: 10px; color: #38a169; font-weight: bold;">✅ Erledigt</span>`;
                if (isAdminUser) {
                    completionBtnHtml += ` <button type="button" style="margin-left:6px; background:none; border:1px solid #e53e3e; color:#e53e3e; border-radius:3px; font-size:9px; cursor:pointer; padding:1px 4px;" onclick="handleRevokeCompletion('${node.id}')">↺ Revision</button>`;
                }
            } else if (masterNode.completion_status === 'pending_approval') {
                statusIcon = ' <span title="Wartet auf Freigabe">⏳</span>';
                completionBtnHtml = `<span style="font-size: 10px; color: #d69e2e; font-weight: bold;">⏳ Freigabe...</span>`;
                if (isAdminUser) {
                    completionBtnHtml += ` <button type="button" style="margin-left:6px; background:none; border:1px solid #e53e3e; color:#e53e3e; border-radius:3px; font-size:9px; cursor:pointer; padding:1px 4px;" onclick="handleRevokeCompletion('${node.id}')">✖ Ablehnen</button>`;
                }
            } else {
                completionBtnHtml = `<button type="button" style="background:none; border:none; color:#38a169; cursor:pointer; font-size:11px; font-weight:bold;" onclick="handleRequestCompletion('${node.id}')">✔ Fertigmelden</button>`;
            }

            const nodeLogs = (typeof currentTimeLogs !== 'undefined' ? currentTimeLogs : []).filter(l => relatedNodeIds.includes(l.node_id));
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

                        let timeFormatted = typeof formatHoursToHM === 'function' ? formatHoursToHM(log.hours) : log.hours;
                        if (log.task_type === 'completion') {
                            timeFormatted = log.note && (log.note.includes('Revision') || log.note.includes('Ablehnen')) ? '↺' : '✔';
                        }

                        let noteIconHtml = '';
                        if (log.note && log.note.trim() !== '') {
                            const escLogNote = typeof escapeHtml === 'function' ? escapeHtml(log.note) : log.note;
                            noteIconHtml = `
                                <span class="info-tooltip-trigger">ℹ️
                                    <span class="tooltip-overlay">${escLogNote}</span>
                                </span>
                            `;
                        }

                        let deleteActionHtml = '';
                        const canDeleteLog = isAdminUser || (log.status === 'pending' && log.user_code === uCode);
                        if (canDeleteLog) {
                            deleteActionHtml = `<span class="btn-delete-log" title="Eintrag löschen" onclick="handleDeleteLog('${log.id}')">✕</span>`;
                        }

                        tableRows += `
                            <tr>
                                <td><strong>${typeof escapeHtml === 'function' ? escapeHtml(log.user_code) : log.user_code}</strong></td>
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

            const escNodeName = typeof escapeHtml === 'function' ? escapeHtml(node.name) : node.name;
            const escCreator = typeof escapeHtml === 'function' ? escapeHtml(creator) : creator;
            const escTypeLabel = typeof escapeHtml === 'function' ? escapeHtml(typeLabel) : typeLabel;

            el.innerHTML = `
              ${badgeHtml}
              <div id="ep-top-${node.id}" class="ep-handle ep-top" title="Knotenpunkt oben" onclick="window.handleEndpointClick(event, '${node.id}', 'top')"></div>
              <div id="ep-bottom-${node.id}" class="ep-handle ep-bottom" title="Knotenpunkt unten" onclick="window.handleEndpointClick(event, '${node.id}', 'bottom')"></div>
              <div id="ep-left-${node.id}" class="ep-handle ep-left" title="Knotenpunkt links" onclick="window.handleEndpointClick(event, '${node.id}', 'left')"></div>
              <div id="ep-right-${node.id}" class="ep-handle ep-right" title="Knotenpunkt rechts" onclick="window.handleEndpointClick(event, '${node.id}', 'right')"></div>

              <div class="assembly-header" style="background: ${nodeColor}; flex-direction: column; align-items: stretch; gap: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; overflow: hidden; white-space: nowrap; flex: 1;">
                    ${subtreeBtnHtml}
                    <span style="overflow: hidden; text-overflow: ellipsis; font-size: 14px; display: inline-flex; align-items: center; gap: 5px;" title="${escNodeName}">
                      ${typeIconSvg} <strong>${escNodeName}</strong>
                    </span>
                  </div>
                  <div style="flex-shrink: 0; margin-left: 6px; display: flex; align-items: center; gap: 4px;">
                    ${statusIcon}${linkedIconHtml}
                  </div>
                </div>
                <div class="header-meta" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; gap: 4px; overflow: hidden;">
                    ${assignedBadgesHtml}
                  </div>
                  <span class="author-badge" style="flex-shrink: 0;" title="Typ: ${escTypeLabel} | Ersteller: ${escCreator}">${escTypeLabel} [${escCreator}]</span>
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
                <form class="log-form" onsubmit="handleLog(event, '${masterNode.id}')">
                  <div class="time-inputs-row">
                    <select class="log-input" style="font-weight: bold; width: 60px;">
                      <option value="${uCode}">${uCode || 'KÜR'}</option>
                    </select>
                    <select class="log-input" style="width: 75px;">
                      <option value="drafting">Zeichn.</option>
                      <option value="design">CAD</option>
                    </select>
                    <input type="number" class="log-input input-hours" min="0" value="0" style="width: 44px;" title="Stunden (Mausrad: +/- 1h)" onwheel="handleTimeWheel(event, 'hour')" required />
                    <span>h</span>
                    <input type="number" class="log-input input-mins" min="0" step="5" value="30" style="width: 44px;" title="Minuten (Mausrad: +/- 5m)" onwheel="handleTimeWheel(event, 'min')" required />
                    <span>m</span>
                  </div>

                  <div style="display: flex; gap: 4px;">
                    <input type="text" class="log-input" placeholder="Kommentar (optional)..." style="flex: 1;" />
                    <button type="submit" class="btn-log" style="background: ${nodeColor};">+ Log</button>
                  </div>
                </form>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                    <button class="btn-expand-toggle" onclick="window.toggleInlineLogs('${node.id}')">
                    ${isExpanded ? '▲ Logs ausblenden' : '▼ Details & Logs (' + nodeLogs.length + ')'}
                    </button>
                    ${completionBtnHtml}
                </div>

                ${inlineLogsHtml}
              </div>
            `;
        }

        // Interaktionen & Hover-Highlights
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

        el.addEventListener('click', (e) => {
            if (e.target.closest('button, input, select, .ep-handle')) return;
            e.stopPropagation();
            if (e.ctrlKey || e.metaKey || e.shiftKey) {
                if (window.selectedNodeIds.has(node.id)) window.selectedNodeIds.delete(node.id);
                else window.selectedNodeIds.add(node.id);
            } else {
                window.selectedNodeIds.clear();
                window.selectedNodeIds.add(node.id);
            }
            renderCanvas();
        });

        el.addEventListener('dblclick', (e) => {
            if (!e.target.closest('.ep-handle') && !e.target.closest('.btn-delete-log') && !e.target.closest('.btn-tree-toggle') && !e.target.closest('button')) {
                if (typeof openConfigModal === 'function') openConfigModal(node.id);
            }
        });

        // =====================================================================
        // DRAG & DROP: MULTI-SELEKTIONS-DRAG (CAD) & BOARD-DRAG (MANAGER)
        // =====================================================================
        if (canDrag || isManagerMode) {
            let isDragging = false;
            let startClientX = 0, startClientY = 0;
            let initialNodePositions = new Map();
            let initCurX = posX, initCurY = posY;

            /**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Canvas Engine (Pinch-Protected Card Dragging & Position Revert)
 * ERSETZEN IN: canvas.js (In renderCanvas() -> Block 2b: startCardDrag)
 * Zeitstempel: 2026-09-27 11:35:00 CEST
 * Breadcrumbs:
 *   - [2026-09-17 22:45:00 CEST]: Multi-Selektions-Drag Basis.
 *   - [2026-09-27 11:35:00 CEST]: BUGFIX: Sobald eine 2. Berührung (Pinch-Zoom)
 *     erkannt wird, bricht der Block-Drag sofort ab, setzt die Karte pixelgenau 
 *     auf die Ausgangsposition zurück und verhindert jegliches DB-Update.
 * =============================================================================
 */
            /**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Canvas Engine (Mobile Pinch-Zoom Isolation & Frame Protection)
 * ERSETZEN IN: canvas.js (In renderCanvas() -> startCardDrag)
 * Zeitstempel: 2026-09-27 12:55:00 CEST
 * Breadcrumbs:
 *   - [2026-09-27 11:35:00 CEST]: Revert bei Multi-Touch.
 *   - [2026-09-27 12:55:00 CEST]: BUGFIX MOBILE: 1. Start-Sperre bei e.touches > 1.
 *     2. Beim Pinch-Abbruch wird auch zone_id strikt auf den Ausgangszustand 
 *     zurückgesetzt (verhindert das Verschwinden durch Filter/Frames).
 *     3. Hover-Highlights und Deadzone für Touch-Taps stabilisiert.
 * =============================================================================
 */
            const startCardDrag = (e) => {
                if (e.type === 'mousedown' && e.button !== 0) return;
                if (e.target.closest('input, select, button, .ep-handle, .btn-delete-log, .btn-tree-toggle, .mgr-prog-slider')) return;
                if (e.type === 'mousedown' && (e.ctrlKey || e.shiftKey || e.metaKey)) return;

                // Sobald zwei Finger im Spiel sind oder Pinch aktiv ist -> kein Block-Drag!
                if (window.isPinching || (e.touches && e.touches.length > 1)) return;

                let isDragging = true;
                let didMove = false;
                let startClientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                let startClientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
                let initCurX = isManagerMode ? (mgrLayout.placements[node.id]?.pos_x ?? posX) : node.pos_x;
                let initCurY = isManagerMode ? (mgrLayout.placements[node.id]?.pos_y ?? posY) : node.pos_y;
                let initZoneId = isManagerMode ? (mgrLayout.placements[node.id]?.zone_id ?? null) : (node.zone_id ?? null);

                if (!isManagerMode) {
                    const nodesToMove = (window.selectedNodeIds.has(node.id))
                        ? Array.from(window.selectedNodeIds).map(id => currentNodes.find(n => n.id === id)).filter(Boolean)
                        : [node];

                    initialNodePositions.clear();
                    nodesToMove.forEach(n => {
                        initialNodePositions.set(n.id, { x: n.pos_x, y: n.pos_y, zone_id: n.zone_id });
                    });
                }

                const cancelDragAndRevert = () => {
                    isDragging = false;
                    didMove = false;
                    window.isDraggingAnything = false;
                    window.removeEventListener('mousemove', onCardMove);
                    window.removeEventListener('mouseup', onCardUp);
                    window.removeEventListener('touchmove', onCardMove);
                    window.removeEventListener('touchend', onCardUp);
                    window.removeEventListener('touchcancel', onCardUp);

                    if (isManagerMode) {
                        el.style.left = `${initCurX}px`;
                        el.style.top = `${initCurY}px`;
                        if (mgrLayout.placements[node.id]) {
                            mgrLayout.placements[node.id].pos_x = initCurX;
                            mgrLayout.placements[node.id].pos_y = initCurY;
                            mgrLayout.placements[node.id].zone_id = initZoneId;
                        }
                    } else {
                        initialNodePositions.forEach((pos, nId) => {
                            const targetN = currentNodes.find(x => x.id === nId);
                            if (targetN) {
                                targetN.pos_x = pos.x;
                                targetN.pos_y = pos.y;
                                targetN.zone_id = pos.zone_id;
                            }
                            const nEl = document.getElementById(nId);
                            if (nEl) {
                                nEl.style.left = `${pos.x}px`;
                                nEl.style.top = `${pos.y}px`;
                            }
                        });
                        (currentZones || []).forEach(z => {
                            const zEl = document.getElementById(z.id);
                            if (zEl) zEl.classList.remove('zone-hover-highlight');
                        });
                        renderConnections();
                    }
                };

                const onCardMove = (me) => {
                    // Multi-Touch erkannt -> Drag sofort sauber verwerfen und Positionen restlos retten
                    if (window.isPinching || (me.touches && me.touches.length > 1)) {
                        cancelDragAndRevert();
                        return;
                    }
                    if (!isDragging) return;

                    const clientX = me.type.includes('touch') ? me.touches[0].clientX : me.clientX;
                    const clientY = me.type.includes('touch') ? me.touches[0].clientY : me.clientY;
                    const scale = window.currentScale || 1;
                    const dx = (clientX - startClientX) / scale;
                    const dy = (clientY - startClientY) / scale;

                    // Erhöhte Deadzone für Touchscreens (schützt vor Wackeln beim Aufsetzen des 2. Fingers)
                    const threshold = me.type.includes('touch') ? 8 : 4;
                    if (!didMove && Math.hypot(dx, dy) < threshold) return;
                    didMove = true;
                    window.isDraggingAnything = true;
                    if (me.type === 'touchmove' && me.cancelable) me.preventDefault();

                    if (isManagerMode) {
                        const curX = Math.round(initCurX + dx);
                        const curY = Math.round(initCurY + dy);
                        el.style.left = `${curX}px`;
                        el.style.top = `${curY}px`;
                    } else {
                        initialNodePositions.forEach((pos, nId) => {
                            const curX = Math.round(pos.x + dx);
                            const curY = Math.round(pos.y + dy);
                            const targetN = currentNodes.find(x => x.id === nId);
                            if (targetN) { targetN.pos_x = curX; targetN.pos_y = curY; }
                            const nEl = document.getElementById(nId);
                            if (nEl) { nEl.style.left = `${curX}px`; nEl.style.top = `${curY}px`; }
                        });

                        const centerX = (initCurX + dx) + 160;
                        const centerY = (initCurY + dy) + 100;
                        const targetZone = getDeepestZoneAt(centerX, centerY);

                        (currentZones || []).forEach(z => {
                            const zEl = document.getElementById(z.id);
                            if (zEl) {
                                if (targetZone && z.id === targetZone.id) zEl.classList.add('zone-hover-highlight');
                                else zEl.classList.remove('zone-hover-highlight');
                            }
                        });
                        renderConnections();
                    }
                };

                const onCardUp = async (ue) => {
                    if (!isDragging) return;
                    isDragging = false;
                    window.isDraggingAnything = false;

                    window.removeEventListener('mousemove', onCardMove);
                    window.removeEventListener('mouseup', onCardUp);
                    window.removeEventListener('touchmove', onCardMove);
                    window.removeEventListener('touchend', onCardUp);
                    window.removeEventListener('touchcancel', onCardUp);

                    // Wenn währenddessen gezoomt wurde oder keine echte Bewegung stattfand -> abbrechen
                    if (!didMove || window.isPinching) {
                        cancelDragAndRevert();
                        return;
                    }

                    const finalX = parseInt(el.style.left, 10);
                    const finalY = parseInt(el.style.top, 10);

                    if (isManagerMode) {
                        const centerX = finalX + 145;
                        const centerY = finalY + 60;
                        const targetZone = getDeepestMgrZoneAt(centerX, centerY, [], mgrLayout.zones);

                        mgrLayout.placements[node.id] = {
                            pos_x: finalX,
                            pos_y: finalY,
                            zone_id: targetZone ? targetZone.id : null
                        };

                        if (window.managerHelperVirtualPlacements && window.managerHelperVirtualPlacements[node.id]) {
                            window.managerHelperVirtualPlacements[node.id] = { pos_x: finalX, pos_y: finalY };
                        }

                        if (typeof saveManagerLayout === 'function') saveManagerLayout(mgrLayout);
                        renderCanvas();
                    } else {
                        (currentZones || []).forEach(z => {
                            const zEl = document.getElementById(z.id);
                            if (zEl) zEl.classList.remove('zone-hover-highlight');
                        });

                        const movedNodes = Array.from(initialNodePositions.keys())
                            .map(id => currentNodes.find(n => n.id === id))
                            .filter(Boolean);

                        const primaryN = movedNodes[0] || node;
                        const targetZone = getDeepestZoneAt(primaryN.pos_x + 160, primaryN.pos_y + 100);
                        const targetZoneId = targetZone ? targetZone.id : null;

                        const updates = movedNodes.map(n => {
                            n.zone_id = targetZoneId;
                            return db.from('project_nodes').update({
                                pos_x: n.pos_x,
                                pos_y: n.pos_y,
                                zone_id: targetZoneId
                            }).eq('id', n.id);
                        });

                        await Promise.all(updates);

                        if (window.pendingCanvasUpdate) {
                            window.pendingCanvasUpdate = false;
                            if (typeof fetchCanvasData === 'function') fetchCanvasData();
                        }
                    }
                };

                window.addEventListener('mousemove', onCardMove);
                window.addEventListener('mouseup', onCardUp);
                window.addEventListener('touchmove', onCardMove, { passive: false });
                window.addEventListener('touchend', onCardUp);
                window.addEventListener('touchcancel', onCardUp);
            };

            el.addEventListener('mousedown', startCardDrag);
            el.addEventListener('touchstart', startCardDrag, { passive: false });
        }

        canvas.appendChild(el);
    });

    if (typeof window.adjustCanvasBounds === 'function') window.adjustCanvasBounds();
    renderConnections();
    if (typeof window.syncVisibilityToDOM === 'function') window.syncVisibilityToDOM();
}

// =============================================================================
// VERBINDUNGEN & MATERIALFLUSS (NUR IM CAD MODUS)
// =============================================================================
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Canvas Engine (Getrennte SVG-Layer für Performance & 0% Idle-Last)
 * ERSETZEN IN: canvas.js (Funktion renderConnections)
 * Zeitstempel: 2026-09-26 14:05:00 CEST
 * Breadcrumbs:
 *   - [2026-09-17 22:50:00 CEST]: Native Splines & Flow Arrows.
 *   - [2026-09-26 14:05:00 CEST]: BUGFIX: connectionsLayer und flowLayer 
 *     in separate DOM-SVGs getrennt. Verhindert 10-12% CPU-Dauerlast durch Repaints.
 * =============================================================================
 */
function renderConnections(mouseCoords = null) {
    const svgLayer = document.getElementById('connections-layer');
    const flowLayer = document.getElementById('flow-layer');
    if (!svgLayer) return;

    if (window.activeCanvasMode === 'manager') {
        svgLayer.innerHTML = '';
        if (flowLayer) flowLayer.innerHTML = '';
        return;
    }

    // 1. STATISCHE VERBINDUNGEN (connections-layer)
    svgLayer.innerHTML = '';

    const nodeRects = {};
    (typeof currentEdges !== 'undefined' ? currentEdges : []).forEach(edge => {
        if (!nodeRects[edge.source]) {
            const el = document.getElementById(edge.source);
            nodeRects[edge.source] = { w: el ? el.offsetWidth : 320, h: el ? el.offsetHeight : 200 };
        }
        if (!nodeRects[edge.target]) {
            const el = document.getElementById(edge.target);
            nodeRects[edge.target] = { w: el ? el.offsetWidth : 320, h: el ? el.offsetHeight : 200 };
        }
    });

    const getFastCoords = (node, handleType) => {
        const rect = nodeRects[node.id] || { w: 320, h: 200 };
        const w = rect.w;
        const h = rect.h;
        switch (handleType) {
            case 'top': return { x: node.pos_x + w / 2, y: node.pos_y };
            case 'bottom': return { x: node.pos_x + w / 2, y: node.pos_y + h };
            case 'left': return { x: node.pos_x, y: node.pos_y + h / 2 };
            case 'right': return { x: node.pos_x + w, y: node.pos_y + h / 2 };
            default: return { x: node.pos_x + w / 2, y: node.pos_y + h };
        }
    };

    const staticFragment = document.createDocumentFragment();

    (typeof currentEdges !== 'undefined' ? currentEdges : []).forEach(edge => {
        const srcNode = currentNodes.find(n => n.id === edge.source);
        const tgtNode = currentNodes.find(n => n.id === edge.target);

        const srcHidden = window.isNodeHiddenByAncestor(edge.source) || (srcNode && srcNode.zone_id && window.isZoneHidden(srcNode.zone_id));
        const tgtHidden = window.isNodeHiddenByAncestor(edge.target) || (tgtNode && tgtNode.zone_id && window.isZoneHidden(tgtNode.zone_id));

        if (srcHidden || tgtHidden || (window.collapsedParents && window.collapsedParents.has(edge.source))) return;

        if (srcNode && tgtNode) {
            const p1 = getFastCoords(srcNode, edge.source_handle || 'bottom');
            const p2 = getFastCoords(tgtNode, edge.target_handle || 'top');
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
            path.setAttribute('title', `Verbindung (${srcNode.name} ➔ ${tgtNode.name})`);
            path.addEventListener('click', () => window.handleDisconnectClick(edge.source, edge.target));
            staticFragment.appendChild(path);
        }
    });

    svgLayer.appendChild(staticFragment);

    // 2. ANIMIERTE PFEILE & VORSCHAU (flow-layer)
    if (!flowLayer) return;

    flowLayer.innerHTML = `
        <defs>
            <marker id="arrowhead" markerWidth="7" markerHeight="5" refX="1.5" refY="2.5" orient="auto">
                <polygon points="0 0, 7 2.5, 0 5" fill="#dd6b20" />
            </marker>
        </defs>
    `;

    const flowFragment = document.createDocumentFragment();

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

        let x1, y1, x2, y2;
        const isTargetBelow = tgtY1 >= srcY2 - 20;
        const isTargetAbove = tgtY2 <= srcY1 + 20;
        const isTargetLeft = tgtX2 <= srcX1 + 20;

        const stub = 10;
        const minTangent = 50;
        let pathD = '';

        if (isTargetBelow) {
            x1 = srcX1 + srcW / 2; y1 = srcY2;
            x2 = tgtX1 + tgtW / 2; y2 = tgtY1;
            const dist = Math.max(minTangent, Math.abs(y2 - y1) * 0.4);
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
            x1 = srcX2; y1 = srcY1 + srcH / 2;
            x2 = tgtX1; y2 = tgtY1 + tgtH / 2;
            const dist = Math.max(minTangent, Math.abs(x2 - x1) * 0.4);
            pathD = `M ${x1} ${y1} L ${x1 + stub} ${y1} C ${x1 + stub + dist} ${y1}, ${x2 - stub - dist} ${y2}, ${x2 - stub} ${y2} L ${x2} ${y2}`;
        }

        const flowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        flowPath.setAttribute('d', pathD);
        flowPath.setAttribute('class', 'flow-arrow-line');
        flowPath.setAttribute('marker-end', 'url(#arrowhead)');
        flowPath.setAttribute('title', `Materialfluss: ${srcZone.title} ➔ ${tgtZone.title}`);
        flowPath.style.pointerEvents = 'stroke';
        if (typeof handleDeleteFlowArrow === 'function') {
            flowPath.addEventListener('click', () => handleDeleteFlowArrow(arrow.id));
        }
        flowFragment.appendChild(flowPath);
    });

    if (connectingFirstPoint && mouseCoords) {
        const p1 = connectingFirstPoint;
        const p2 = mouseCoords;
        const dy = Math.max(30, Math.abs(p2.y - p1.y) * 0.4);
        const pathD = `M ${p1.x} ${p1.y} C ${p1.x + dy}, ${p2.x - dy}, ${p2.x} ${p2.y}`;
        const preview = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        preview.setAttribute('d', pathD);
        preview.setAttribute('class', 'preview-connection-line');
        flowFragment.appendChild(preview);
    }

    flowLayer.appendChild(flowFragment);
}

// =============================================================================
// KAMERA-FOKUS & CANVAS-GRENZEN
// =============================================================================
/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Canvas Engine (Sichtbarkeits-Filter & Fokus für Manager-Rahmen)
 * ERSETZEN IN: canvas.js (In centerViewOnVisible & am Dateiende)
 * Zeitstempel: 2026-09-26 11:45:00 CEST
 * =============================================================================
 */

// In window.centerViewOnVisible() den Manager-Modus Zweig aktualisieren:
window.centerViewOnVisible = function (targetZoneId = null) {
    if (!window.hiddenTopZoneIds) window.hiddenTopZoneIds = new Set();
    if (!window.hiddenMgrZoneIds) window.hiddenMgrZoneIds = new Set();

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasElements = false;

    const updateBounds = (x, y, w, h) => {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x + w > maxX) maxX = x + w;
        if (y + h > maxY) maxY = y + h;
        hasElements = true;
    };

    if (window.activeCanvasMode === 'manager') {
        const mgrLayout = (typeof getManagerLayout === 'function') ? getManagerLayout() : { zones: [], placements: {} };
        const isHiddenFn = (typeof window.isMgrZoneHidden === 'function') ? window.isMgrZoneHidden : () => false;

        (mgrLayout.zones || []).filter(z => !isHiddenFn(z.id, mgrLayout.zones)).forEach(z => {
            updateBounds(parseFloat(z.pos_x) || 0, parseFloat(z.pos_y) || 0, parseFloat(z.width) || 620, parseFloat(z.height) || 440);
        });

        Object.keys(mgrLayout.placements || {}).forEach(nId => {
            const p = (window.isManagerSortHelperActive && window.managerHelperVirtualPlacements && window.managerHelperVirtualPlacements[nId])
                ? window.managerHelperVirtualPlacements[nId]
                : mgrLayout.placements[nId];

            const isBlockFramed = !!(p && p.zone_id && (mgrLayout.zones || []).some(z => z.id === p.zone_id));
            if (window.managerFramedOnlyActive && !isBlockFramed && !window.isManagerSortHelperActive) return;

            if (p && !(p.zone_id && isHiddenFn(p.zone_id, mgrLayout.zones))) {
                updateBounds(parseFloat(p.pos_x) || 0, parseFloat(p.pos_y) || 0, 290, 160);
            }
        });
    } else {
        if (targetZoneId) {
            const specific = (currentZones || []).find(z => z.id === targetZoneId);
            if (specific) updateBounds(parseFloat(specific.pos_x) || 0, parseFloat(specific.pos_y) || 0, parseFloat(specific.width) || 400, parseFloat(specific.height) || 300);
        } else {
            const visibleZones = (currentZones || []).filter(z => !window.isZoneHidden(z.id));
            visibleZones.forEach(z => {
                updateBounds(parseFloat(z.pos_x) || 0, parseFloat(z.pos_y) || 0, parseFloat(z.width) || 400, parseFloat(z.height) || 300);
            });

            const visibleNodes = (currentNodes || []).filter(n => !window.isNodeHiddenByAncestor(n.id) && !(n.zone_id && window.isZoneHidden(n.zone_id)));
            visibleNodes.forEach(n => {
                const isNote = (n.block_type === 'note' || n.doc_number === 'NOTE' || n.doc_number === 'TODO');
                const w = isNote ? (parseFloat(n.budget_design_hours) || 220) : 320;
                const h = isNote ? (parseFloat(n.budget_drafting_hours) || 120) : 200;
                updateBounds(parseFloat(n.pos_x) || 0, parseFloat(n.pos_y) || 0, w, h);
            });
        }
    }

    if (!hasElements || !isFinite(minX) || !isFinite(minY)) {
        window.currentScale = 1;
        window.currentPanX = 50;
        window.currentPanY = 50;
        applyCanvasTransform(false);
        return;
    }

    const viewportEl = document.getElementById('viewport');
    if (!viewportEl) return;

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

    applyCanvasTransform(false);
};
window.adjustCanvasBounds = function () {
    let maxX = 0, maxY = 0;

    if (window.activeCanvasMode === 'manager') {
        const mgrLayout = (typeof getManagerLayout === 'function') ? getManagerLayout() : { zones: [], placements: {} };
        (mgrLayout.zones || []).forEach(z => {
            if ((parseFloat(z.pos_x) || 0) + (parseFloat(z.width) || 620) > maxX) maxX = (parseFloat(z.pos_x) || 0) + (parseFloat(z.width) || 620);
            if ((parseFloat(z.pos_y) || 0) + (parseFloat(z.height) || 440) > maxY) maxY = (parseFloat(z.pos_y) || 0) + (parseFloat(z.height) || 440);
        });
        Object.keys(mgrLayout.placements || {}).forEach(nId => {
            const p = mgrLayout.placements[nId];
            if (p) {
                if ((parseFloat(p.pos_x) || 0) + 320 > maxX) maxX = (parseFloat(p.pos_x) || 0) + 320;
                if ((parseFloat(p.pos_y) || 0) + 200 > maxY) maxY = (parseFloat(p.pos_y) || 0) + 200;
            }
        });
    } else {
        (currentZones || []).forEach(z => {
            if (z.pos_x + z.width > maxX) maxX = z.pos_x + z.width;
            if (z.pos_y + z.height > maxY) maxY = z.pos_y + z.height;
        });

        (currentNodes || []).forEach(n => {
            if (n.pos_x + 350 > maxX) maxX = n.pos_x + 350;
            if (n.pos_y + 250 > maxY) maxY = n.pos_y + 250;
        });
    }

    const canvasEl = document.getElementById('canvas');
    if (canvasEl) {
        canvasEl.style.width = Math.max(3000, maxX + 1000) + 'px';
        canvasEl.style.height = Math.max(3000, maxY + 1000) + 'px';
    }
};

// =============================================================================
// KONTEXTMENÜ-AKTIONEN & COPY/PASTE
// =============================================================================
window.handleContextMenuAction = async function (type) {
    const menu = document.getElementById('canvasContextMenu');
    if (menu) menu.style.display = 'none';

    if (type === 'mgr_add_existing') {
        if (typeof openAddExistingBlockModal === 'function') openAddExistingBlockModal(contextMenuCoords.x, contextMenuCoords.y);
        return;
    }

    if (type === 'mgr_add_zone') {
        if (typeof handleCreateManagerZone === 'function') handleCreateManagerZone(contextMenuCoords.x, contextMenuCoords.y);
        return;
    }

    if (type === 'mgr_remove_node' && contextTargetNodeId) {
        if (typeof getManagerLayout !== 'function' || typeof saveManagerLayout !== 'function') return;
        const layout = getManagerLayout();
        delete layout.placements[contextTargetNodeId];
        saveManagerLayout(layout);
        showToast('Vom Manager-Board entfernt', 'info');
        renderCanvas();
        return;
    }

    if (type === 'mgr_delete_zone' && window.contextTargetZoneId) {
        if (typeof window.deleteManagerZone === 'function') window.deleteManagerZone(window.contextTargetZoneId);
        return;
    }

    if (type === 'toggle_handles') {
        if (typeof toggleHandles === 'function') toggleHandles();
        return;
    }

    if (type === 'block') {
        if (typeof handleOpenAddBlockModal === 'function') handleOpenAddBlockModal(contextMenuCoords.x - 160, contextMenuCoords.y - 50);
        return;
    }

    if (type === 'zone') {
        if (typeof handleOpenAddZoneModal === 'function') handleOpenAddZoneModal(contextMenuCoords.x, contextMenuCoords.y);
        return;
    }

    if (type === 'note') {
        if (typeof handleOpenAddNoteModal === 'function') handleOpenAddNoteModal(contextMenuCoords.x, contextMenuCoords.y);
        return;
    }

    if (type === 'duplicate' && contextTargetNodeId) {
        const originalNode = currentNodes.find(n => n.id === contextTargetNodeId);
        if (!originalNode) return;

        let linkedId = originalNode.linked_id;
        if (!linkedId) {
            linkedId = 'inst_' + crypto.randomUUID();
            originalNode.linked_id = linkedId;
            await db.from('project_nodes').update({ linked_id: linkedId }).eq('id', originalNode.id);
        }

        const isMgr = (window.activeCanvasMode === 'manager');
        const newPosX = Math.round(originalNode.pos_x + 50);
        const newPosY = Math.round(originalNode.pos_y + 50);

        const targetZone = !isMgr && (typeof getDeepestZoneAt === 'function')
            ? getDeepestZoneAt(newPosX + 160, newPosY + 100)
            : null;

        const uCode = typeof activeUserCode !== 'undefined' ? activeUserCode : 'COT';
        const projId = typeof activeProjectId !== 'undefined' ? activeProjectId : null;

        const { data, error } = await db.from('project_nodes').insert([{
            project_id: projId,
            name: originalNode.name,
            doc_number: originalNode.doc_number || null,
            article_number: originalNode.article_number || null,
            block_type: originalNode.block_type || 'assembly',
            budget_design_hours: originalNode.budget_design_hours || 0,
            budget_drafting_hours: originalNode.budget_drafting_hours || 0,
            color_hex: originalNode.color_hex || '#2b6cb0',
            created_by: uCode,
            assigned_design_user: originalNode.assigned_design_user || null,
            assigned_drafting_user: originalNode.assigned_drafting_user || null,
            progress_design: originalNode.progress_design || 0,
            progress_drafting: originalNode.progress_drafting || 0,
            completion_status: originalNode.completion_status || 'open',
            pos_x: newPosX,
            pos_y: newPosY,
            linked_id: linkedId,
            zone_id: targetZone ? targetZone.id : null
        }]).select();

        if (error) {
            showToast('Fehler beim Duplizieren', 'error');
            return;
        }

        const insertedNode = (data && data[0]) ? data[0] : null;

        if (isMgr && insertedNode) {
            const layout = getManagerLayout();
            const origPlacement = layout.placements[originalNode.id];
            const pX = origPlacement ? origPlacement.pos_x + 30 : contextMenuCoords.x;
            const pY = origPlacement ? origPlacement.pos_y + 30 : contextMenuCoords.y;
            const tZone = getDeepestMgrZoneAt(pX + 145, pY + 60, [], layout.zones);

            layout.placements[insertedNode.id] = {
                pos_x: pX,
                pos_y: pY,
                zone_id: tZone ? tZone.id : (origPlacement ? origPlacement.zone_id : null)
            };
            if (typeof saveManagerLayout === 'function') await saveManagerLayout(layout);
        }

        showToast(`Verknüpfte Instanz von "${originalNode.name}" erstellt`, 'success');
        if (typeof fetchCanvasData === 'function') await fetchCanvasData();
        return;
    }

    if (type === 'delete' && contextTargetNodeId) {
        const nodeToDelete = currentNodes.find(n => n.id === contextTargetNodeId);
        if (!nodeToDelete) return;

        const isNote = (nodeToDelete.block_type === 'note' || nodeToDelete.doc_number === 'NOTE' || nodeToDelete.doc_number === 'TODO');
        const nodeLogs = (typeof currentTimeLogs !== 'undefined' ? currentTimeLogs : []).filter(l => l.node_id === nodeToDelete.id);

        const uCode = typeof activeUserCode !== 'undefined' ? activeUserCode : '';
        const isAdminUser = typeof isAdmin !== 'undefined' ? isAdmin : false;

        const isCreator = (uCode && uCode === nodeToDelete.created_by);
        const createdAtTime = nodeToDelete.created_at ? new Date(nodeToDelete.created_at).getTime() : 0;
        const isWithinOneHour = (Date.now() - createdAtTime) <= (60 * 60 * 1000);

        const canDelete = isAdminUser || (isCreator && nodeLogs.length === 0 && isWithinOneHour);

        if (!canDelete) {
            showToast('Löschen nur innerhalb 60 Min. nach Erstellung oder durch Admin.', 'error');
            return;
        }

        let displayName = nodeToDelete.name;
        if (isNote) {
            const parsed = (typeof parseNotePayload === 'function')
                ? parseNotePayload(nodeToDelete.name)
                : { text: nodeToDelete.name };
            displayName = parsed.text ? (parsed.text.length > 30 ? parsed.text.substring(0, 30) + '...' : parsed.text) : 'Notiz';
        }

        const confirmed = typeof customConfirm === 'function' ? await customConfirm(isNote ? 'Notiz löschen' : 'Block löschen', `Möchtest du "${displayName}" wirklich entfernen?`) : window.confirm(`Möchtest du "${displayName}" wirklich entfernen?`);
        if (confirmed) {
            await db.from('project_nodes').delete().eq('id', nodeToDelete.id);
            showToast(isNote ? 'Notiz gelöscht' : 'Block gelöscht', 'success');
            if (typeof fetchCanvasData === 'function') await fetchCanvasData();
        }
    }
};

window.lastClientX = 0;
window.lastClientY = 0;
window.addEventListener('mousemove', (e) => {
    window.lastClientX = e.clientX;
    window.lastClientY = e.clientY;
});

window.handlePasteNodes = async function () {
    if (!window.copiedNodeIds || window.copiedNodeIds.length === 0) return;

    const coords = window.getCanvasCoords(window.lastClientX, window.lastClientY);
    const isMgr = (window.activeCanvasMode === 'manager');
    const mgrLayout = isMgr ? (typeof getManagerLayout === 'function' ? getManagerLayout() : null) : null;
    let offsetX = 0;

    const uCode = typeof activeUserCode !== 'undefined' ? activeUserCode : 'COT';
    const projId = typeof activeProjectId !== 'undefined' ? activeProjectId : null;

    for (const originalId of window.copiedNodeIds) {
        const originalNode = currentNodes.find(n => n.id === originalId);
        if (!originalNode) continue;

        let linkedId = originalNode.linked_id;
        const isNote = (originalNode.block_type === 'note' || originalNode.doc_number === 'NOTE');

        if (!linkedId && !isNote) {
            linkedId = 'inst_' + crypto.randomUUID();
            originalNode.linked_id = linkedId;
            await db.from('project_nodes').update({ linked_id: linkedId }).eq('id', originalNode.id);
        }

        const newPosX = Math.round(coords.x + offsetX);
        const newPosY = Math.round(coords.y);

        const targetZone = !isMgr && (typeof getDeepestZoneAt === 'function')
            ? getDeepestZoneAt(newPosX + 160, newPosY + 100)
            : null;

        const { data, error } = await db.from('project_nodes').insert([{
            project_id: projId,
            name: originalNode.name,
            doc_number: originalNode.doc_number || null,
            article_number: originalNode.article_number || null,
            block_type: originalNode.block_type,
            budget_design_hours: originalNode.budget_design_hours,
            budget_drafting_hours: originalNode.budget_drafting_hours,
            color_hex: originalNode.color_hex,
            created_by: uCode,
            assigned_design_user: originalNode.assigned_design_user || null,
            assigned_drafting_user: originalNode.assigned_drafting_user || null,
            progress_design: originalNode.progress_design || 0,
            progress_drafting: originalNode.progress_drafting || 0,
            completion_status: originalNode.completion_status || 'open',
            pos_x: newPosX,
            pos_y: newPosY,
            linked_id: isNote ? null : linkedId,
            zone_id: targetZone ? targetZone.id : null
        }]).select();

        if (error) {
            showToast('Fehler beim Einfügen', 'error');
            continue;
        }

        const insertedNode = (data && data[0]) ? data[0] : null;

        if (isMgr && insertedNode && mgrLayout) {
            const mgrTargetZone = getDeepestMgrZoneAt(newPosX + 145, newPosY + 60, [], mgrLayout.zones);
            mgrLayout.placements[insertedNode.id] = {
                pos_x: newPosX,
                pos_y: newPosY,
                zone_id: mgrTargetZone ? mgrTargetZone.id : null
            };
        }

        offsetX += 320;
    }

    if (isMgr && mgrLayout && typeof saveManagerLayout === 'function') {
        await saveManagerLayout(mgrLayout);
    }

    showToast(`${window.copiedNodeIds.length} Instanz(en) eingefügt`, 'success');
    if (typeof fetchCanvasData === 'function') await fetchCanvasData();
};

/**
* =============================================================================
* Projekt: CAD Time Manager
* Domain: Canvas Engine (Kamera-Fokus auf Manager-Zonen)
* HINZUFÜGEN IN: canvas.js (Am Dateiende)
* Zeitstempel: 2026-09-26 10:45:00 CEST
* =============================================================================
*/

window.centerOnManagerZone = function (zoneId) {
    const layout = (typeof getManagerLayout === 'function') ? getManagerLayout() : null;
    if (!layout || !Array.isArray(layout.zones)) return;

    const zone = layout.zones.find(z => z.id === zoneId);
    if (!zone) return;

    const viewport = document.getElementById('viewport');
    if (!viewport) return;

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const zW = parseFloat(zone.width) || 620;
    const zH = parseFloat(zone.height) || 440;

    const padding = 80;
    const targetScale = Math.max(0.2, Math.min(1.5, Math.min((vw - padding * 2) / zW, (vh - padding * 2) / zH)));

    window.currentScale = targetScale;
    window.currentPanX = (vw / 2) - ((zone.pos_x + (zW / 2)) * targetScale);
    window.currentPanY = (vh / 2) - ((zone.pos_y + (zH / 2)) * targetScale);

    if (typeof applyCanvasTransform === 'function') applyCanvasTransform(true);

    const el = document.getElementById(zoneId);
    if (el) {
        el.style.transition = 'box-shadow 0.25s ease';
        el.style.boxShadow = '0 0 28px 6px #3182ce';
        setTimeout(() => { el.style.boxShadow = ''; }, 1400);
    }
};

document.addEventListener('visibilitychange', () => {
    const canvas = document.getElementById('canvas');
    if (document.hidden) {
        canvas.classList.add('pause-animations');
    } else {
        canvas.classList.remove('pause-animations');
    }
});