export const agentsHTML = `
    <div class="flex justify-between items-center">
        <h2 class="text-2xl font-semibold text-white">All Network Agents</h2>
    </div>
    
    <div class="noc-card rounded-xl flex-1 flex flex-col overflow-hidden">
        <div class="overflow-y-auto flex-1 h-[600px]">
            <table class="w-full text-sm text-left whitespace-nowrap relative">
                <thead class="text-slate-400 bg-slate-900 sticky top-0 z-10 shadow-md">
                    <tr>
                        <th class="px-5 py-4 font-medium">Device ID</th>
                        <th class="px-5 py-4 font-medium">Name</th>
                        <th class="px-5 py-4 font-medium">Type</th>
                        <th class="px-5 py-4 font-medium">IP Address</th>
                        <th class="px-5 py-4 font-medium">Status</th>
                        <th class="px-5 py-4 font-medium">Latency</th>
                        <th class="px-5 py-4 font-medium">Loss</th>
                    </tr>
                </thead>
                <tbody id="full-agents-table-body" class="divide-y divide-slate-800/40"></tbody>
            </table>
        </div>
    </div>
`;