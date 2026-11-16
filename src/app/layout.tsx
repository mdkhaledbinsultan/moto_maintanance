import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bike App Admin',
  description: 'Admin Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}