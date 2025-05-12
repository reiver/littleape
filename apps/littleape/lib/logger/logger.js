const isDebugMode = process.env.NEXT_PUBLIC_IS_DEBUG_MODE === "true";

const logger = {
    log: (...args) => {
        if (isDebugMode) {
            console.log('[LITTLEAPE] 🟢 ', ...args);
        }
    },
    warn: (...args) => {
        if (isDebugMode) {
            console.warn('[LITTLEAPE] 🟡 ', ...args);
        }
    },
    error: (...args) => {
        if (isDebugMode) {
            console.error('[LITTLEAPE] 🔴 ', ...args);
        }
    },
};

export default logger;
