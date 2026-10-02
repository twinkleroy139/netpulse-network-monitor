export function initProvisioning(uid) {
    const envSelect = document.getElementById('prov-env-type');
    const nameInput = document.getElementById('prov-device-name');
    const commandOutput = document.getElementById('provisioning-command');
    const btnCopy = document.getElementById('btn-copy-command');

    if (!envSelect || !nameInput || !commandOutput) return;

    function updateCommand() {
        const envType = envSelect.value || "HOME";
        
        // Clean the device name (replace spaces and special chars with hyphens)
        let rawName = nameInput.value.trim() || "My-Device";
        const deviceName = rawName.replace(/[^a-zA-Z0-9-]/g, '-');
        
        // Generate a localized ID based on the environment (e.g., OFFICE-4921)
        const randomId = Math.floor(1000 + Math.random() * 9000);
        const deviceId = `${envType}-${randomId}`;

        // Render the final command with the user's secure UID
        commandOutput.innerHTML = `python agent\\netpulse_agent.py --key "<span class="text-blue-400">${uid}</span>" --id "${deviceId}" --name "${deviceName}"`;
    }

    // Attach listeners so the command updates instantly as the user types
    envSelect.addEventListener('change', updateCommand);
    nameInput.addEventListener('input', updateCommand);
    
    // Initial render
    updateCommand();

    // Secure copy-to-clipboard functionality
    if (btnCopy) {
        // Clone and replace to prevent duplicate event listeners if initialized multiple times
        const newBtnCopy = btnCopy.cloneNode(true);
        btnCopy.parentNode.replaceChild(newBtnCopy, btnCopy);
        
        newBtnCopy.addEventListener('click', () => {
            navigator.clipboard.writeText(commandOutput.innerText);
            newBtnCopy.innerHTML = '<i class="fas fa-check text-emerald-400"></i>';
            setTimeout(() => { newBtnCopy.innerHTML = '<i class="far fa-copy"></i>'; }, 2000);
        });
    }
}