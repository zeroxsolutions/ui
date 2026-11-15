/** Tailwind v4 ships its PostCSS plugin as a separate package; the `tailwindcss`
 *  package is no longer a plugin itself. Vendor prefixing is built in, so there
 *  is deliberately no `autoprefixer` entry here. Shape matches
 *  shadcn-ui/registry-template-v4. */
const config = {
  plugins: ['@tailwindcss/postcss'],
};

export default config;
