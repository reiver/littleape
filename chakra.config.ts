import { extendTheme } from "@chakra-ui/react";

export const theme = extendTheme({
  initialColorMode: "dark",
  useSystemColorMode: true,
  colors: {
    light: {
      50: "#FFF",
      100: "#F2F5F7",
      200: "#E6ECEF",
      300: "#DAE3E7",
      400: "#CEDADF",
      500: "#C1D0D7",
      600: "#B4C7CF",
      700: "#B4C7CF",
      800: "#222430",
      900: "#191B24",
    },
    dark: {
      50: "#707699",
      100: "#5D6383",
      200: "#555A77",
      300: "#4C516B",
      400: "#44485F",
      500: "#323645",
      600: "#3a3f50",
      700: "#272A37",
      800: "#222430",
      900: "#191B24",
    },
    primary: {
      50: "#3895E5",
      100: "#268BE3",
      200: "#1A78CB",
      300: "#176BB5",
      400: "#1561A2",
      500: "#1A78CB",
      600: "#176BB5",
      700: "#0E406C",
      800: "#0C365A",
      900: "#0A2B48",
    },
    slate: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
  },
});

export default theme;
