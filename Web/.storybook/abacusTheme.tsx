import { create } from '@storybook/theming/create';
import { colors } from '../src/theme/colors';

export const abacusTheme = create({
  base: 'dark',
  brandTitle: 'Abacus.AI - Effortlessly Embed Cutting Edge AI In Your Applications.',
  brandUrl: 'https://abacus.ai',
  brandImage: 'https://abacus.ai/static/imgs/logo_text80.webp',
  brandTarget: '_self',
  colorPrimary: colors.blueMain,
  colorSecondary: colors.greenMain,
  appBg: colors.grey200,
  appContentBg: colors.grey300,
  appBorderColor: colors.grey100,
  appBorderRadius: 4,
  barTextColor: '#fff',
  barSelectedColor: colors.blueMain,
  barBg: colors.grey400,
  fontBase: 'Matter, sans-serif',
});
