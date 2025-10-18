document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.getElementById('toggle-switch');
    const statusText = document.getElementById('status-text');

    // Load initial state from storage
    chrome.storage.local.get('isDetectionEnabled', (data) => {
        const isEnabled = !!data.isDetectionEnabled;
        toggleSwitch.checked = isEnabled;
        updateStatusText(isEnabled);
    });

    // Handle toggle change
    toggleSwitch.addEventListener('change', (event) => {
        const isEnabled = event.target.checked;
        
        // 1. Save state to storage
        chrome.storage.local.set({ 'isDetectionEnabled': isEnabled });
        
        // 2. Send message to content script to update immediately
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: "TOGGLE_DETECTION",
                    enabled: isEnabled
                });
            }
        });
        
        // 3. Update UI
        updateStatusText(isEnabled);
    });
    
    function updateStatusText(isEnabled) {
        statusText.textContent = isEnabled ? 'ON' : 'OFF';
        statusText.style.color = isEnabled ? '#4CAF50' : '#FF9800';
    }
});