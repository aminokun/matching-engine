import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Company Profile Matching Engine',
  description: 'Find the best business partner matches using AI-powered search',
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
