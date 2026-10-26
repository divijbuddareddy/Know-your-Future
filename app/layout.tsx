import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AstroVinodAI - Personal Vedic Astrologer',
  description: 'AstroVinodAI - Grounded Vedic astrology consultations and high-precision astronomical ephemeris.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
