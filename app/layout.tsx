import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sotkon Logistics System',
  description: 'Planning and logistics management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className="antialiased bg-[#0a0a0a]">{children}</body>
    </html>
  );
}
