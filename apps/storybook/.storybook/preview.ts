import type { Preview } from '@storybook/react-vite';
import { setFluentEmojiBase } from '@zeroxsolutions/fluent-emoji';

// Theme/tokens + an explicit `@source` so Tailwind generates the library's
// component classes (see storybook.css).
import './storybook.css';

// The artwork is served as static files at `/fluent-emoji` (see main.ts
// `staticDirs`); point the resolver there instead of the bundled default.
setFluentEmojiBase('/fluent-emoji');

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
  },
};

export default preview;
