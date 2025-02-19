const isDebugMode = import.meta.env.VITE_APP_DEBUG_MODE === 'true';

const logger = {
    log: (...args) => {
        if (isDebugMode) {
            console.log(' 🟢 ', ...args);
        }
    },
    warn: (...args) => {
        if (isDebugMode) {
            console.warn(' 🟡 ', ...args);
        }
    },
    error: (...args) => {
        if (isDebugMode) {
            console.error(' 🔴 ', ...args);
        }
    },
};

export default logger;
