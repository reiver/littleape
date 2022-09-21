import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

const { theme } = require('../chakra.config')
dayjs.extend(relativeTime);

export const parameters = {
  chakra: {
    theme,
  },
}
