export const profileHTML = `
    <h2 class="text-2xl font-semibold text-white mb-2">Agent Provisioning</h2>
    <p class="text-sm text-slate-400 mb-6">Connect your local machine to the NetPulse dashboard using your unique API key.</p>
    
    <div class="noc-card rounded-xl p-6 border-l-4 border-blue-500">
        <h3 class="text-lg font-medium text-white mb-4"><i class="fas fa-terminal text-blue-400 mr-2"></i> Custom Script Generator</h3>
        <p class="text-sm text-slate-400 mb-6">Configure your node environment to generate a custom tracking script.</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
                <label class="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Environment Type</label>
                <select id="prov-env-type" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                    <option value="HOME">Home Network</option>
                    <option value="OFFICE">Office Network</option>
                    <option value="CLOUD">Cloud Server</option>
                </select>
            </div>
            <div>
                <label class="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Device Name</label>
                <input type="text" id="prov-device-name" placeholder="e.g., HQ-Workstation" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
            </div>
        </div>
        
        <div class="bg-slate-900 rounded border border-slate-700 p-4 font-mono text-sm text-emerald-400 relative">
            <button id="btn-copy-command" class="absolute top-3 right-3 text-slate-500 hover:text-white transition">
                <i class="far fa-copy"></i>
            </button>
            <code id="provisioning-command">python agent\\netpulse_agent.py --key "Loading..." --id "Loading..." --name "Loading..."</code>
        </div>
    </div>

    <div class="noc-card rounded-xl p-6 mt-6">
        <h3 class="text-lg font-medium text-white mb-4">Account Information</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
                <span class="text-slate-500 block">Email Address</span>
                <span id="profile-email" class="text-white font-medium">Loading...</span>
            </div>
            <div>
                <span class="text-slate-500 block">Environment UID (API Key)</span>
                <span id="profile-uid" class="text-slate-300 font-mono text-xs">Loading...</span>
            </div>
        </div>
    </div>
`;