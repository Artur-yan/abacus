import { experimental_extendTheme as extendTheme } from '@mui/material';
import { colors } from './colors';

export const muiTheme = extendTheme({
  colorSchemes: {
    dark: {
      palette: {
        primary: {
          main: colors.blueMain,
        },
        secondary: {
          main: colors.greenMain,
        },
      },
    },
  },
});
