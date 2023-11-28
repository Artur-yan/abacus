import { LinearProgress } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Example/Progress',
  component: LinearProgress,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/react/configure/story-layout
    layout: 'fullscreen',
  },
} satisfies Meta<typeof LinearProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Progress: Story = {
  args: {
    style: {
      backgroundColor: 'transparent',
      height: '6px',
    },
  },
};
