function sendStaffModeSetting(enabled) {
    window.postMessage({
        type: 'DISCORD_BADGES_STAFF_MODE',
        enabled
    }, '*');
}

chrome.storage.local.get(['staffModeEnabled'], (data) => {
    sendStaffModeSetting(data.staffModeEnabled !== false);
});

window.addEventListener('message', event => {
    if (event.source !== window || event.data?.type !== 'DISCORD_BADGES_STAFF_MODE_REQUEST') return;
    chrome.storage.local.get(['staffModeEnabled'], (data) => {
        sendStaffModeSetting(data.staffModeEnabled !== false);
    });
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes.staffModeEnabled) return;
    sendStaffModeSetting(changes.staffModeEnabled.newValue !== false);
});
