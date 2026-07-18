import './global.css';

export const metadata = {
  title: '@zeroxsolutions/ui registry',
  description:
    'Isolated component previews and the shadcn-compatible registry for @zeroxsolutions/ui.',
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
