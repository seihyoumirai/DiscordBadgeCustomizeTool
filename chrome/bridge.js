chrome.storage.local.get(['enabledHashes', 'badgeOrder', 'overrideEnabled'], (data) => {
    if (data.enabledHashes || data.badgeOrder || typeof data.overrideEnabled === 'boolean') {
        window.postMessage({
            type: 'FROM_BADGE_EXTENSION_BRIDGE',
            enabledHashes: data.enabledHashes,
            badgeOrder: data.badgeOrder,
            overrideEnabled: data.overrideEnabled
        }, '*');
    }
});

chrome.storage.onChanged.addListener((changes) => {
    chrome.storage.local.get(['enabledHashes', 'badgeOrder', 'overrideEnabled'], (data) => {
        window.postMessage({
            type: 'FROM_BADGE_EXTENSION_BRIDGE',
            enabledHashes: data.enabledHashes || [],
            badgeOrder: data.badgeOrder || [],
            overrideEnabled: data.overrideEnabled !== false
        }, '*');
    });
});
