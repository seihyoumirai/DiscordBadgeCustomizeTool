(() => {
    const badgeBaseUrl = 'https://cdn.discordapp.com/badge-icons/';
    const snapshots = new WeakMap();
    const modifiedTargets = new Set();
    let selectedBadgeHash = '';
    let selectedText = '';
    let serverTagEnabled = false;

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

    function updateAttribute(element, name, value) {
        if (!element) return;
        if (value === null) {
            if (element.hasAttribute(name)) element.removeAttribute(name);
        } else if (element.getAttribute(name) !== value) {
            element.setAttribute(name, value);
        }
    }

    function applySelectButtonPill(pill, imageUrl) {
        const content = pill.querySelector('.selectButtonContent_ac381c');
        const image = content?.querySelector('img.selectButtonBadge_ac381c');
        if (!content || !image) return;
        const textNodes = [...content.childNodes].filter(node => node.nodeType === Node.TEXT_NODE);
        const existingTagText = textNodes.find(node => node.nodeValue.trim());
        const snapshot = remember(pill, {
            kind: 'selectButton',
            image,
            imageSrc: image.getAttribute('src'),
            textNodes: textNodes.map(node => ({ node, value: node.nodeValue })),
            createdTextNode: null
        });
        updateAttribute(image, 'src', imageUrl);
        if (existingTagText) {
            if (existingTagText.nodeValue !== selectedText) existingTagText.nodeValue = selectedText;
        } else if (!snapshot.createdTextNode) {
            snapshot.createdTextNode = document.createTextNode(selectedText);
            const chevron = content.querySelector('.selectButtonChevron_ac381c');
            content.insertBefore(snapshot.createdTextNode, chevron || null);
        } else if (snapshot.createdTextNode.nodeValue !== selectedText) {
            snapshot.createdTextNode.nodeValue = selectedText;
        }
    }

    function applyGuildTagPill(pill, imageUrl) {
        const image = pill.querySelector('img.badge__10651');
        const tagText = pill.querySelector('.tagText__10651');
        if (!image || !tagText) return;
        remember(pill, {
            kind: 'guildTag',
            image,
            imageSrc: image.getAttribute('src'),
            tagText,
            text: tagText.textContent
        });
        updateAttribute(image, 'src', imageUrl);
        if (tagText.textContent !== selectedText) tagText.textContent = selectedText;
    }

    function restoreTags() {
        modifiedTargets.forEach(target => {
            const snapshot = snapshots.get(target);
            if (!snapshot) return;
            updateAttribute(snapshot.image, 'src', snapshot.imageSrc);
            if (snapshot.kind === 'guildTag') {
                if (snapshot.tagText.textContent !== snapshot.text) snapshot.tagText.textContent = snapshot.text;
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
        if (!serverTagEnabled || !selectedBadgeHash) {
            restoreTags();
            return;
        }
        const imageUrl = getBadgeImageUrl(selectedBadgeHash);
        document.querySelectorAll('.selectButtonPill_ac381c').forEach(pill => {
            applySelectButtonPill(pill, imageUrl);
        });
        document.querySelectorAll('.guildTagPill__26b1f').forEach(pill => {
            applyGuildTagPill(pill, imageUrl);
        });
    }

    window.addEventListener('message', event => {
        if (event.source !== window || event.data?.type !== 'DISCORD_BADGES_SERVER_TAG_SETTINGS') return;
        serverTagEnabled = event.data.enabled === true;
        selectedBadgeHash = typeof event.data.badgeHash === 'string' ? event.data.badgeHash : '';
        selectedText = typeof event.data.text === 'string' ? event.data.text : '';
        applySettings();
    });

    const observer = new MutationObserver(applySettings);
    if (document.documentElement) {
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['src']
        });
    }
    window.postMessage({ type: 'DISCORD_BADGES_SERVER_TAG_REQUEST' }, '*');
})();
