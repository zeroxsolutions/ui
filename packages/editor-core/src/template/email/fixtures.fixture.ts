import type { DefaultLayoutProps } from './layout.js';
import type { EmailTheme } from './theme.js';

/** The design's mail frame in hex. */
export const FIXTURE_THEME: EmailTheme = {
  colors: {
    background: '#FFFFFF',
    foreground: '#09090B',
    primary: '#007A55',
    primaryForeground: '#ECFDF5',
    muted: '#F4F4F5',
    mutedForeground: '#63636D',
    border: '#E4E4E7',
  },
  radius: 10,
  font: { family: 'Inter', fallback: 'Arial, Helvetica, sans-serif' },
};

export const FIXTURE_LAYOUT_PROPS: DefaultLayoutProps = {
  logo: { url: 'https://cdn.x.test/logo@2x.png', alt: 'Example', width: 120 },
  footer: ['Example Company Limited, 1 Example Street.', 'Sent because you created an account.'],
};
