document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('saveButton').addEventListener('click', save_options);

/**
 * Saves the token input value to Chrome's local storage.
 */
function save_options() {
  const tokenInput = document.getElementById('hf_token');
  const token = tokenInput.value.trim();
  
  if (!token || token.includes("... (Token set)")) {
    update_status('Error: Please enter a valid token.', 'error');
    return;
  }

  // Use chrome.storage.local to securely save the token
  chrome.storage.local.set({
    hf_token: token
  }, () => {
    // Update status to let the user know options were saved.
    update_status('Token saved successfully! Restart the extension for changes to take effect.', 'success');
    // Hide the actual token after saving
    tokenInput.value = token.substring(0, 8) + '... (Token set)';
  });
}

/**
 * Restores the token from Chrome's local storage on page load.
 */
function restore_options() {
  // Use chrome.storage.local.get to retrieve the token
  chrome.storage.local.get('hf_token', (items) => {
    const tokenInput = document.getElementById('hf_token');
    if (items.hf_token) {
      // Display a masked version of the token for security
      tokenInput.value = items.hf_token.substring(0, 8) + '... (Token set)';
      update_status('Token is currently set.', 'info');
    }
  });
}

/**
 * Displays status messages to the user.
 * @param {string} message - The message to display.
 * @param {string} type - 'success', 'error', or 'info' for styling.
 */
function update_status(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    
    // Apply styling based on the message type
    if (type === 'success') {
        status.style.backgroundColor = '#d4edda'; // Light green
        status.style.color = '#155724'; // Dark green text
    } else if (type === 'error') {
        status.style.backgroundColor = '#f8d7da'; // Light red
        status.style.color = '#721c24'; // Dark red text
    } else { // info
        status.style.backgroundColor = '#d1ecf1'; // Light blue
        status.style.color = '#0c5460'; // Dark blue text
    }
    
    // Clear status message after 5 seconds
    setTimeout(() => {
        status.textContent = '';
        status.style.backgroundColor = 'transparent';
    }, 5000);
}