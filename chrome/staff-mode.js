(() => {
    let enabled = true;
    let retryTimer = null;
    let retriesRemaining = 200;
    const originalValues = new WeakMap();

    function restoreEnvironment(environment) {
        const original = originalValues.get(environment);
        if (!original) return;
        for (const key of ['PROJECT_ENV', 'RELEASE_CHANNEL']) {
            const descriptor = original[key];
            if (descriptor) Object.defineProperty(environment, key, descriptor);
            else delete environment[key];
        }
    }

    function applyStaffMode() {
        const environment = window.GLOBAL_ENV;
        if (!environment || typeof environment !== 'object') {
            if (enabled && retriesRemaining > 0 && retryTimer === null) {
                retriesRemaining -= 1;
                retryTimer = window.setTimeout(() => {
                    retryTimer = null;
                    applyStaffMode();
                }, 50);
            }
            return;
        }

        if (!originalValues.has(environment)) {
            originalValues.set(environment, {
                PROJECT_ENV: Object.getOwnPropertyDescriptor(environment, 'PROJECT_ENV'),
                RELEASE_CHANNEL: Object.getOwnPropertyDescriptor(environment, 'RELEASE_CHANNEL')
            });
        }

        if (enabled) {
            environment.PROJECT_ENV = 'staging';
            environment.RELEASE_CHANNEL = 'staging';
        } else {
            restoreEnvironment(environment);
        }
    }

    window.addEventListener('message', event => {
        if (event.source !== window || event.data?.type !== 'DISCORD_BADGES_STAFF_MODE') return;
        if (typeof event.data.enabled !== 'boolean') return;
        enabled = event.data.enabled;
        retriesRemaining = 200;
        applyStaffMode();
    });

    window.postMessage({ type: 'DISCORD_BADGES_STAFF_MODE_REQUEST' }, '*');
    applyStaffMode();
})();
