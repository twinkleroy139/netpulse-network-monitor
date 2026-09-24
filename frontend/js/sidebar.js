const sidebarHTML = `
<aside class="w-64 bg-[#111827] border-r border-slate-800 flex flex-col z-10 hidden md:flex h-full">
    <div class="p-5 flex items-center gap-3 border-b border-slate-800">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <i class="fas fa-wave-square text-white text-sm"></i>
        </div>
        <div>
            <h1 class="text-lg font-bold tracking-tight text-white">NetPulse</h1>
            <p class="text-[10px] text-slate-400 uppercase tracking-wider">Network & VoIP Monitoring</p>
        </div>
    </div>

    <nav class="flex-1 px-3 py-4 space-y-1 text-sm font-medium overflow-y-auto">
        <a href="#" id="nav-dashboard" class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-500/10 text-blue-400 border-l-2 border-blue-500 transition">
            <i class="fas fa-chart-pie w-4"></i> Dashboard
        </a>
        <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition">
            <i class="fas fa-project-diagram w-4"></i> Network Topology
        </a>
        <a href="#" id="nav-agents" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition">
            <i class="fas fa-server w-4"></i> Agents
        </a>
        <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition">
            <i class="fas fa-phone-alt w-4"></i> VoIP Monitoring
        </a>
        <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition">
            <i class="fas fa-bell w-4"></i> Alerts <span class="ml-auto bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">3</span>
        </a>
        <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition">
            <i class="fas fa-file-alt w-4"></i> Reports
        </a>
        <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition">
            <i class="fas fa-cog w-4"></i> Settings
        </a>
    </nav>

    <div class="p-4 border-t border-slate-800 flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">TR</div>
        <div class="flex-1">
            <p class="text-sm font-medium text-white">Twinkle Roy</p>
            <p class="text-[10px] text-slate-400">Administrator</p>
        </div>
    </div>
</aside>
`;
document.getElementById('sidebar-container').innerHTML = sidebarHTML;