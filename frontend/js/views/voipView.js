// frontend/js/views/voipView.js

export const voipHTML = `
    <div class="flex justify-between items-center mb-6">
        <div>
            <h2 class="text-2xl font-semibold text-white">VoIP Readiness & Quality</h2>
            <p class="text-sm text-slate-400 mt-1">Capacity planning and historical call degradation analysis.</p>
        </div>
        <button id="btn-run-speedtest" class="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-5 rounded-lg transition flex items-center gap-2 text-sm shadow-lg shadow-blue-500/20">
            <i class="fas fa-tachometer-alt"></i> Run Speed Test
        </button>
    </div>

    <!-- Capacity Planning & Bandwidth -->
    <div class="noc-card rounded-xl p-6 mb-6 border-l-4 border-emerald-500">
        <div class="flex justify-between items-start mb-4">
            <div>
                <h3 class="text-lg font-medium text-white mb-1">Network Capacity</h3>
                <p class="text-sm text-slate-400">Calculate concurrent VoIP calls based on available bandwidth.</p>
            </div>
            <div class="flex items-center gap-3">
                <label class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Target Codec</label>
                <select id="voip-codec" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer">
                    <option value="87">G.711 (87 kbps)</option>
                    <option value="40" selected>Opus (40 kbps)</option>
                    <option value="31">G.729 (31 kbps)</option>
                </select>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <div class="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700/50">
                <div class="text-slate-400 text-xs mb-1 uppercase tracking-wider">Download</div>
                <div class="text-2xl font-bold text-white"><span id="speed-dl">--</span> <span class="text-sm font-normal text-slate-500">Mbps</span></div>
            </div>
            <div class="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700/50">
                <div class="text-slate-400 text-xs mb-1 uppercase tracking-wider">Upload</div>
                <div class="text-2xl font-bold text-white"><span id="speed-ul">--</span> <span class="text-sm font-normal text-slate-500">Mbps</span></div>
            </div>
            <div class="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700/50">
                <div class="text-slate-400 text-xs mb-1 uppercase tracking-wider">Test Latency</div>
                <div class="text-2xl font-bold text-white"><span id="speed-ping">--</span> <span class="text-sm font-normal text-slate-500">ms</span></div>
            </div>
            <div class="bg-blue-500/10 rounded-lg p-4 text-center border border-blue-500/30">
                <div class="text-blue-400 text-xs mb-1 uppercase tracking-wider font-semibold">Concurrent Calls</div>
                <div class="text-3xl font-bold text-emerald-400" id="voip-capacity">--</div>
            </div>
        </div>
        
        <div id="voip-readiness-badge" class="mt-4 text-sm font-medium text-slate-400 hidden">
            Verdict: <span id="voip-verdict-text">Waiting for test...</span>
        </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div class="noc-card rounded-xl p-5 lg:col-span-2">
            <h3 class="text-sm font-semibold text-white mb-4">MOS Trend Over Time</h3>
            <div class="h-64 w-full relative">
                <canvas id="mosChart"></canvas>
            </div>
        </div>
        <div class="noc-card rounded-xl p-5">
            <h3 class="text-sm font-semibold text-white mb-4">Degradation Causes</h3>
            <div class="h-64 w-full relative">
                 <canvas id="degChart"></canvas>
            </div>
        </div>
    </div>
    
    <!-- Speed Test History -->
    <div class="noc-card rounded-xl flex flex-col overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-800/60 flex justify-between items-center">
            <h3 class="text-sm font-semibold text-white">Speed Test History</h3>
        </div>
        <div class="overflow-x-auto flex-1">
            <table class="w-full text-xs text-left whitespace-nowrap">
                <thead class="text-slate-400 bg-slate-900/40">
                    <tr>
                        <th class="px-4 py-3 font-medium">Timestamp</th>
                        <th class="px-4 py-3 font-medium">Download (Mbps)</th>
                        <th class="px-4 py-3 font-medium">Upload (Mbps)</th>
                        <th class="px-4 py-3 font-medium">Latency (ms)</th>
                        <th class="px-4 py-3 font-medium">Est. Calls (Opus)</th>
                    </tr>
                </thead>
                <tbody id="speed-history-table" class="divide-y divide-slate-800/40">
                    <tr><td colspan="5" class="px-4 py-6 text-center text-slate-500">No speed tests run yet. Initialize a test to populate history.</td></tr>
                </tbody>
            </table>
        </div>
    </div>
`;