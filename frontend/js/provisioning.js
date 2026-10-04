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
        
        // Use the static random ID, just update the prefix
        const deviceId = `${envType}-${currentRandomId}`;

        commandOutput.innerHTML = `python agent\\netpulse_agent.py --key "<span class="text-blue-400">${uid}</span>" --id "${deviceId}" --name "${deviceName}"`;
    }

    // Regenerate the ID only if they change the environment type (Home -> Office)
    envSelect.addEventListener('change', () => {
        currentRandomId = Math.floor(1000 + Math.random() * 9000);
        updateCommand();
    });
    
    // Update the text without changing the ID
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