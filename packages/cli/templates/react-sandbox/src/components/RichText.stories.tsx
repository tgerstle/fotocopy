import type { Meta, StoryObj } from '@storybook/react';
import { RichText } from './RichText';

const meta: Meta<typeof RichText> = {
  title: 'Blocks/RichText',
  component: RichText,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ 
        '--color-primary': 'rgb(61, 61, 68)', 
        '--color-background': 'rgba(255, 255, 255, 1)' 
      } as React.CSSProperties}>
        <div className="bg-white min-h-[400px] w-full">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RichText>;

export const Default: Story = {
  args: {
    title: 'Scale Your Infrastructure with Precision',
    description: 'Deploy high-performance computing clusters in seconds. Our automated orchestration layer handles the complexity so you can focus on building.',
    cta_button: 'Start Deploying',
    'subtitle-1': 'Enterprise Ready',
    'subtitle-2': 'The Next Generation of Cloud',
    'subtitle-2-alt': 'Built for DevOps Engineers',
    'mappings-1': '99.9% Uptime SLA',
    'mappings-1-alt': 'Global Edge Network',
  },
};

export const Minimal: Story = {
  args: {
    title: 'Simple, Powerful, Secure.',
    description: 'Everything you need to manage your content without the overhead.',
    cta_button: 'Learn More',
    'subtitle-1': 'Announcement',
    'subtitle-2': '',
    'subtitle-2-alt': '',
    'mappings-1': '',
    'mappings-1-alt': '',
  },
};

export const FeatureRich: Story = {
  args: {
    title: 'Unmatched Performance for Modern Web Apps',
    description: 'Experience lightning-fast load times and seamless transitions with our optimized edge delivery network and intelligent caching strategies.',
    cta_button: 'View Documentation',
    'subtitle-1': 'New Release v2.0',
    'subtitle-2': 'Optimized for Next.js',
    'subtitle-2-alt': 'Compatible with all major frameworks',
    'mappings-1': 'Edge-side Rendering',
    'mappings-1-alt': 'Zero-latency Caching',
  },
};