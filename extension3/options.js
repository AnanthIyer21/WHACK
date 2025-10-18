document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('saveButton');
    const tokenInput = document.getElementById('hfTokenInput');
    const statusDiv = document.getElementById('status'); // Status display area

    // Load and display the saved token, if it exists
    chrome.storage.local.get('hf_token', (result) => {
        if (result.hf_token) {
            tokenInput.value = result.hf_token;
            statusDiv.textContent = 'Last saved token loaded.';
            statusDiv.style.color = 'gray';
        }
    });

    // Connect the button click event listener
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const token = tokenInput.value;
            
            if (!token) {
                statusDiv.textContent = '❌ Please enter your Hugging Face Token.';
                statusDiv.style.color = 'red';
                return;
            }

            // Save the token to chrome.storage
            chrome.storage.local.set({ hf_token: token }, () => {
                // Feedback upon successful saving
                statusDiv.textContent = '✅ Token Saved Successfully!';
                statusDiv.style.color = 'green';
                
                // (Optional) Clear the message after 1.5 seconds
                setTimeout(() => {
                    statusDiv.textContent = '';
                }, 1500);
            });
        });
    } else {
        console.error("Save button element (ID 'saveButton') not found.");
        statusDiv.textContent = '❌ Initialization Error.';
        statusDiv.style.color = 'red';
    }
});