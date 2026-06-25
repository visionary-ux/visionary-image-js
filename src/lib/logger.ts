const PREFIX = "[visionary-image-js]";

export const logDebug = (...args: unknown[]) => {
  console.log(PREFIX, ...args);
};

export const logWarn = (...args: unknown[]) => {
  console.warn(PREFIX, ...args);
};

export const logError = (...args: unknown[]) => {
  console.error(PREFIX, ...args);
};
