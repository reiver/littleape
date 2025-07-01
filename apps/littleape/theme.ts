import { createTheme } from '@mui/material/styles';

export const muiTheme = createTheme({
  breakpoints: {
    values: {
      xs: 0,     // Mobile
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    primary: {
      main: '#000',
    },
  },
});
