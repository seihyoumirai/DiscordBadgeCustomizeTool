(() => {
    const settings = {
        pronounsEnabled: false,
        pronounsText: '',
        usernameEnabled: false,
        usernameText: '',
        bioEnabled: false,
        bioText: ''
    };

    function setText(element, value) {
        if (element && element.textContent !== value) element.textContent = value;
    }

    function applyProfileText() {
        if (settings.pronounsEnabled) {
            document.querySelectorAll('.pronouns__26b1f > span[aria-hidden="true"]').forEach(el => setText(el, settings.pronounsText));
        }
        if (settings.usernameEnabled) {
            document.querySelectorAll('.userTagClickable__26b1f .userTagUsername__26b1f, .info_f4bc97.userTag__26b1f .userTagUsername__26b1f').forEach(el => setText(el, settings.usernameText));
        }
        if (settings.bioEnabled) {
            document.querySelectorAll('.bioText_b40b46 > span, .bioText_b40b46').forEach(el => {
                if (el.classList.contains('bioText_b40b46')) {
                    el.style.whiteSpace = 'pre-wrap';
                    const childSpan = el.querySelector(':scope > span');
                    if (childSpan) setText(childSpan, settings.bioText);
                    else setText(el, settings.bioText);
                } else {
                    setText(el, settings.bioText);
                }
            });
        }
    }

    function loadSettings() {
        chrome.storage.local.get(Object.keys(settings), data => {
            Object.assign(settings, data);
            applyProfileText();
        });
    }

    const observer = new MutationObserver(applyProfileText);
    observer.observe(document, { childList: true, subtree: true, characterData: true });
    loadSettings();
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local' || !Object.keys(settings).some(key => changes[key])) return;
        loadSettings();
    });
})();
