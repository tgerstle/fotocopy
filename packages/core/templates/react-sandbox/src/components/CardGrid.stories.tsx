import type { Meta, StoryObj } from '@storybook/react';
import CardGrid from './CardGrid';

const meta: Meta<typeof CardGrid> = {
  title: 'Blocks/CardGrid',
  component: CardGrid,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ 
        // Simulating the design system tokens in the Storybook preview
        '--color-primary': 'rgb(61, 61, 68)',
        '--color-background': 'rgba(255, 255, 255, 1)',
        padding: '2rem',
        backgroundColor: 'white'
      } as React.CSSProperties}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CardGrid>;

export const Default: Story = {
  args: {
    title: 'Premium Features',
    description: 'Unlock the full potential of your workflow with our advanced automation tools and real-time analytics dashboard.',
    cta_button: 'Explore Features',
  },
};

export const Minimal: Story = {
  args: {
    title: 'Simple Update',
    description: 'A concise description for minimal layouts.',
    cta_button: 'Read More',
  },
};

export const Marketing: Story = {
  args: {
    title: 'Scale Your Business',
    description: 'Our enterprise-grade infrastructure ensures your application remains highly available and performant, no matter how much your user base grows.',
    cta_button: 'Get Started Today',
  },
};