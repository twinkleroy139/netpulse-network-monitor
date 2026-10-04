export function initProvisioning(uid) {
    const envSelect = document.getElementById('prov-env-type');
    const nameInput = document.getElementById('prov-device-name');
    const commandOutput = document.getElementById('provisioning-command');
    const btnCopy = document.getElementById('btn-copy-command');

    if (!envSelect || !nameInput || !commandOutput) return;

    // Generate the random number ONCE when the module loads
    let currentRandomId = Math.floor(1000 + Math.random() * 9000);

    function updateCommand() {
        const envType = envSelect.value || "HOME";
        let rawName = nameInput.value.trim() || "My-Device";
        const deviceName = rawName.replace(/[^a-zA-Z0-9-]/g, '-');
        
        const deviceId = `${envType}-${currentRandomId}`;

        // 1. Save this specific ID to the browser memory
        localStorage.setItem('my_local_node_id', deviceId);

        // Universal one-liner: Downloads script from GitHub and executes it instantly
        commandOutput.innerHTML = `curl.exe -sO https://raw.githubusercontent.com/twinkleroy139/netpulse-network-monitor/main/agent/netpulse_agent.py && python netpulse_agent.py --key "<span class="text-blue-400">${uid}</span>" --id "${deviceId}" --name "${deviceName}"`;
    }

    envSelect.addEventListener('change', () => {
        currentRandomId = Math.floor(1000 + Math.random() * 9000);
        updateCommand();
    });
    
    nameInput.addEventListener('input', updateCommand);
    updateCommand();

    if (btnCopy) {
        const newBtnCopy = btnCopy.cloneNode(true);
        btnCopy.parentNode.replaceChild(newBtnCopy, btnCopy);
        
        newBtnCopy.addEventListener('click', () => {
            navigator.clipboard.writeText(commandOutput.innerText);
            newBtnCopy.innerHTML = '<i class="fas fa-check text-emerald-400"></i>';
            setTimeout(() => { newBtnCopy.innerHTML = '<i class="far fa-copy"></i>'; }, 2000);
        });
    }
}