import type { Meta, StoryObj } from '@storybook/react';

import { Button as ButtonComponent } from './Button';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta = {
  title: 'Button',
  component: ButtonComponent,
  tags: ['autodocs'],
  argTypes: {
    customType: {
      options: ['internal', '(None)'],
      control: { type: 'select' },
    },
    type: {
      options: ['primary', 'default', 'dashed', 'text', 'link', '(None)'],
      control: { type: 'select' },
    },
    ghost: {
      options: [true, false],
      control: { type: 'boolean' },
    },
    danger: {
      options: [true, false],
      control: { type: 'boolean' },
    },
    disabled: {
      options: [true, false],
      control: { type: 'boolean' },
    },
    loading: {
      options: [true, false],
      control: { type: 'boolean' },
    },
  },
} satisfies Meta<typeof ButtonComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Button: Story = {
  args: {
    type: 'default',
    children: 'Click me',
  },
};
