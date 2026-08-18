import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CloudSec — Blast-Radius Graph Analyzer',
  description: 'IAM blast-radius and attack path visualizer backed by CognoDB',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
