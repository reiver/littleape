const isDebugMode = import.meta.env.VITE_APP_DEBUG_MODE === 'true';

const logger = {
    log: (...args) => {
        if (isDebugMode) {
            console.log('[LOGJAM] 🟢 ', ...args);
        }
    },
    warn: (...args) => {
        if (isDebugMode) {
            console.warn('[LOGJAM] 🟡 ', ...args);
        }
    },
    error: (...args) => {
        if (isDebugMode) {
            console.error('[LOGJAM] 🔴 ', ...args);
        }
    },
};

export default logger;
