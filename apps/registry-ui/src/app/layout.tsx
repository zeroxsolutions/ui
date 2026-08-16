import type { Metadata } from 'next';

import './global.css';

export const metadata: Metadata = {
  title: 'ZeroXSolutions UI',
  description:
    'Base UI components and blocks, distributed as a shadcn registry.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
