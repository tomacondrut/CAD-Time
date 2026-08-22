/**
 * =============================================================================
 * Projekt: CAD Time Manager
 * Domain: Haupt-Bootstrap / Entry Point
 * Zeitstempel: 2026-08-22 16:00:00 CEST
 * =============================================================================
 */

window.addEventListener('DOMContentLoaded', () => {
    initPanzoom();
    renderColorPresets();
    renderZoneColorPresets();

    document.getElementById('btnOpenAddBlockModal').addEventListener('click', () => handleOpenAddBlockModal());
    document.getElementById('btnOpenAddZoneModal').addEventListener('click', handleOpenAddZoneModal);
    document.getElementById('newBlockForm').addEventListener('submit', handleAddBlock);
    document.getElementById('newZoneForm').addEventListener('submit', handleAddZone);
    // NEU: Listener für das Editieren von Kästen
    document.getElementById('editZoneForm').addEventListener('submit', handleSaveZoneConfig);
    document.getElementById('configForm').addEventListener('submit', handleSaveConfig);
    document.getElementById('btnDeleteBlock').addEventListener('click', handleDeleteNode);
    document.getElementById('retroLogForm').addEventListener('submit', handleSaveRetroLog);
    document.getElementById('adminProjectForm').addEventListener('submit', handleSaveProject);

    fetchUsers();
    fetchProjects();

    db.channel('realtime-all')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
            fetchCanvasData();
            fetchUsers();
            fetchProjects();
        })
        .subscribe();
});