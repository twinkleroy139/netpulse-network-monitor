// frontend/js/views/reportsView.js

export const reportsHTML = `
    <div class="flex justify-between items-center mb-6">
        <div>
            <h2 class="text-2xl font-semibold text-white">Network Reports</h2>
            <p class="text-sm text-slate-400 mt-1">Export raw telemetry and bandwidth history for offline analysis.</p>
        </div>
        <button id="btn-export-csv" class="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-5 rounded-lg transition flex items-center gap-2 text-sm shadow-lg shadow-emerald-500/20">
            <i class="fas fa-file-csv"></i> Export Speed Tests (CSV)
        </button>
    </div>

    <div class="noc-card rounded-xl p-6 border-t-2 border-t-blue-500 flex flex-col items-center justify-center min-h-[300px] text-center">
        <div class="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
            <i class="fas fa-chart-bar text-2xl text-blue-400"></i>
        </div>
        <h3 class="text-lg font-medium text-white mb-2">Automated Reporting Engine</h3>
        <p class="text-sm text-slate-400 max-w-md">
            Click the export button above to generate a downloadable comma-separated values (CSV) file of your network's historical bandwidth data directly from Firestore.
        </p>
    </div>
`;