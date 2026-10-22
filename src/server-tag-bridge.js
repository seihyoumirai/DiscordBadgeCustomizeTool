(() => {
    const badgeBaseUrl = 'https://cdn.discordapp.com/badge-icons/';
    const snapshots = new WeakMap();
    const modifiedTargets = new Set();
    let settings = { enabled: false, badgeHash: '', text: '' };

    function getBadgeImageUrl(hashOrUrl) {
        if (/^data:image\//i.test(hashOrUrl) || /^https?:\/\//i.test(hashOrUrl)) return hashOrUrl;
        return `${badgeBaseUrl}${hashOrUrl}.png`;
    }

    function remember(target, snapshot) {
        if (!snapshots.has(target)) {
            snapshots.set(target, snapshot);
            modifiedTargets.add(target);
        }
        return snapshots.get(target);
    }

    function setAttributeIfChanged(element, name, value) {
        if (!element) return;
        if (value === null) {
            if (element.hasAttribute(name)) element.removeAttribute(name);
        } else if (element.getAttribute(name) !== value) {
            element.setAttribute(name, value);
        }
    }

    function updateSelectButton(pill, imageUrl) {
        const content = pill.querySelector('.selectButtonContent_ac381c');
        const image = content?.querySelector('img.selectButtonBadge_ac381c, img.badge__10651');
        if (!content || !image) return;
        const textNodes = [...content.childNodes].filter(node => node.nodeType === Node.TEXT_NODE);
        const tagTextNode = textNodes.find(node => node.nodeValue.trim());
        const snapshot = remember(pill, {
            kind: 'selectButton',
            image,
            imageSrc: image.getAttribute('src'),
            textNodes: textNodes.map(node => ({ node, value: node.nodeValue })),
            createdTextNode: null
        });

        setAttributeIfChanged(image, 'src', imageUrl);
        if (tagTextNode) {
            if (tagTextNode.nodeValue !== settings.text) tagTextNode.nodeValue = settings.text;
        } else if (!snapshot.createdTextNode) {
            snapshot.createdTextNode = document.createTextNode(settings.text);
            content.insertBefore(snapshot.createdTextNode, content.querySelector('.selectButtonChevron_ac381c') || null);
        } else if (snapshot.createdTextNode.nodeValue !== settings.text) {
            snapshot.createdTextNode.nodeValue = settings.text;
        }
    }

    function updateGuildTagPill(pill, imageUrl) {
        const image = pill.querySelector('img.badge__10651');
        const text = pill.querySelector('.tagText__10651');
        if (!image || !text) return;
        remember(pill, {
            kind: 'guildTag',
            image,
            imageSrc: image.getAttribute('src'),
            text,
            textValue: text.textContent
        });
        setAttributeIfChanged(image, 'src', imageUrl);
        if (text.textContent !== settings.text) text.textContent = settings.text;
    }

    function restoreOriginalTags() {
        modifiedTargets.forEach(target => {
            const snapshot = snapshots.get(target);
            if (!snapshot) return;
            setAttributeIfChanged(snapshot.image, 'src', snapshot.imageSrc);
            if (snapshot.kind === 'guildTag') {
                if (snapshot.text.textContent !== snapshot.textValue) snapshot.text.textContent = snapshot.textValue;
            } else {
                snapshot.textNodes.forEach(({ node, value }) => {
                    if (node.nodeValue !== value) node.nodeValue = value;
                });
                if (snapshot.createdTextNode?.parentNode) snapshot.createdTextNode.remove();
            }
            snapshots.delete(target);
        });
        modifiedTargets.clear();
    }

    function applySettings() {
        if (!settings.enabled || !settings.badgeHash) {
            restoreOriginalTags();
            return;
        }
        const imageUrl = getBadgeImageUrl(settings.badgeHash);
        document.querySelectorAll('.selectButtonPill_ac381c').forEach(pill => updateSelectButton(pill, imageUrl));
        document.querySelectorAll('.guildTagPill__26b1f').forEach(pill => updateGuildTagPill(pill, imageUrl));
    }

    function loadSettings() {
        chrome.storage.local.get(['serverTagEnabled', 'serverTagBadgeHash', 'serverTagText'], data => {
            settings = {
                enabled: data.serverTagEnabled === true,
                badgeHash: data.serverTagBadgeHash || '',
                text: data.serverTagText || ''
            };
            applySettings();
        });
    }

    const observer = new MutationObserver(applySettings);
    observer.observe(document, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['src']
    });
    loadSettings();
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && (changes.serverTagEnabled || changes.serverTagBadgeHash || changes.serverTagText)) {
            loadSettings();
        }
    });
})();
