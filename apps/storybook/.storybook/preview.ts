import type { Preview } from '@storybook/react-vite';

// Theme/tokens + an explicit `@source` so Tailwind generates the library's
// component classes (see storybook.css).
import './storybook.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
  },
};

export default preview;
