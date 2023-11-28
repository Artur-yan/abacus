import * as React from 'react';
import type { Preview } from '@storybook/react';

import { Experimental_CssVarsProvider as CssVarsProvider, experimental_extendTheme as extendTheme } from '@mui/material';
import { abacusTheme } from './abacusTheme';
import { muiTheme } from '../src/theme/muiTheme';
import { ModeSwitcher } from '../src/ModeSwitcher';
import { colors } from '../src/theme/colors';

import 'antd/dist/antd.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: colors.grey300,
        },
        {
          name: 'light',
          value: 'white',
        },
      ],
    },
    docs: {
      theme: abacusTheme,
    },
  },
  decorators: [
    (Story) => (
      <CssVarsProvider theme={muiTheme}>
        <ModeSwitcher>
          <Story />
        </ModeSwitcher>
      </CssVarsProvider>
    ),
  ],
};

export default preview;
