import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { theme } from '../chakra.config';
import "../styles/global.css";

dayjs.extend(relativeTime);

export const parameters = {
  chakra: {
    theme,
  },
}
