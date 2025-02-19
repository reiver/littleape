import logger from "../logger/logger";

export const detectKeyPress = (keyPressCallback) => {
  document.onkeyup = function (e) {
    if (
      e.key === "1" ||
      e.key === "2" ||
      e.key === "3" ||
      e.key === "4" ||
      e.key === "5" ||
      e.key === "6" ||
      e.key === "7" ||
      e.key === "8" ||
      e.key === "9"
    ) {
      logger.log("Key pressed: ", e.key);
      keyPressCallback(e.key);
    }
  };
};
