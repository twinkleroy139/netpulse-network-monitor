// frontend/js/views/dashboardView.js

export const dashboardHTML = `
    <!-- ENVIRONMENT TABS -->
    <div class="flex items-center gap-2 border-b border-slate-800/60 pb-4 mb-4 overflow-x-auto">
        <button class="env-tab active px-4 py-1.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 transition" data-env="ALL">Global View</button>
        <button class="env-tab px-4 py-1.5 rounded-full text-xs font-medium bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent transition" data-env="OFFICE">Office Network</button>
        <button class="env-tab px-4 py-1.5 rounded-full text-xs font-medium bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent transition" data-env="HOME">Home Network</button>
        <button class="env-tab px-4 py-1.5 rounded-full text-xs font-medium bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent transition" data-env="CLOUD">Cloud Servers</button>
    </div>

    <!-- KPI Cards with Live Warnings -->
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div class="noc-card rounded-xl p-5 border-t-2 border-t-emerald-500">
            <div class="flex justify-between text-slate-400 text-xs mb-2"><span>Total Active Agents</span> <i class="fas fa-desktop"></i></div>
            <div class="text-3xl font-bold text-white" id="stat-total">--</div>
            <div class="text-[11px] mt-2" id="stat-online-text">--</div>
        </div>
        <div class="noc-card rounded-xl p-5 border-t-2 border-t-emerald-500 transition-colors duration-300" id="card-latency">
            <div class="flex justify-between text-slate-400 text-xs mb-2"><span>Avg. Latency</span> <i class="fas fa-network-wired"></i></div>
            <div class="text-3xl font-bold text-white"><span id="stat-latency">--</span> <span class="text-sm text-slate-500">ms</span></div>
            <div id="warn-latency" class="text-[11px] mt-2 text-amber-400 font-medium hidden animate-pulse"></div>
        </div>
        <div class="noc-card rounded-xl p-5 border-t-2 border-t-rose-500 transition-colors duration-300" id="card-loss">
            <div class="flex justify-between text-slate-400 text-xs mb-2"><span>Packet Loss</span> <i class="fas fa-exclamation-triangle"></i></div>
            <div class="text-3xl font-bold text-white"><span id="stat-loss">--</span> <span class="text-sm text-slate-500">%</span></div>
            <div id="warn-loss" class="text-[11px] mt-2 text-amber-400 font-medium hidden animate-pulse"></div>
        </div>
        <div class="noc-card rounded-xl p-5 border-t-2 border-t-blue-500">
            <div class="flex justify-between text-slate-400 text-xs mb-2"><span>Avg. Jitter</span> <i class="fas fa-wave-square"></i></div>
            <div class="text-3xl font-bold text-white"><span id="stat-jitter">--</span> <span class="text-sm text-slate-500">ms</span></div>
        </div>
        
        <!-- NEW MOS VoIP CARD -->
        <div class="noc-card rounded-xl p-5 border-t-2 border-t-slate-600 transition-colors duration-300" id="card-mos">
            <div class="flex justify-between text-slate-400 text-xs mb-2"><span>Call Quality (MOS)</span> <i class="fas fa-phone-volume"></i></div>
            <div class="text-3xl font-bold text-white"><span id="stat-mos">--</span> <span class="text-sm text-slate-500" id="stat-mos-label"></span></div>
            <div id="warn-mos" class="text-[11px] mt-2 text-amber-400 font-medium hidden animate-pulse"></div>
        </div>
    </div>

    <!-- Interactive Topology & Health -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 noc-card rounded-xl flex flex-col overflow-hidden p-5">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-sm font-semibold text-white">Interactive Network Topology</h3>
                <span class="text-[10px] text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded bg-emerald-500/10"><i class="fas fa-mouse-pointer mr-1"></i> Draggable</span>
            </div>
            <!-- Vis.js Container -->
            <div id="topology-network" class="flex-1 w-full min-h-[350px] bg-[#0b101e]/50 rounded-lg border border-slate-700/50"></div>
        </div>

        <div class="noc-card rounded-xl p-5">
            <h3 class="text-sm font-semibold text-white mb-4">Network Health</h3>
            <div class="relative h-40 flex items-center justify-center">
                <canvas id="healthChart"></canvas>
                <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                    <span class="text-xl font-bold text-white" id="chart-center-pct">--%</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Rolling Latency Chart & Mini Table -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        <div class="noc-card rounded-xl p-5">
            <h3 class="text-sm font-semibold text-white mb-4">Historical Latency Trend</h3>
            <div class="h-48 w-full">
                <canvas id="latencyChart"></canvas>
            </div>
        </div>

        <div class="noc-card rounded-xl flex flex-col overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-800/60 flex justify-between items-center">
                <h3 class="text-sm font-semibold text-white">Top Devices</h3>
                <span id="btn-view-all" class="text-xs text-blue-400 cursor-pointer hover:text-blue-300">View All Agents &rarr;</span>
            </div>
            <div class="overflow-x-auto flex-1">
                <table class="w-full text-xs text-left whitespace-nowrap">
                    <thead class="text-slate-400 bg-slate-900/40">
                        <tr>
                            <th class="px-4 py-2 font-medium">Device / IP</th>
                            <th class="px-4 py-2 font-medium">Type</th>
                            <th class="px-4 py-2 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody id="device-table-body" class="divide-y divide-slate-800/40"></tbody>
                </table>
            </div>
        </div>
    </div>
`;