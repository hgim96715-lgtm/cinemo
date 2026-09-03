import type { Metadata } from 'next';
import {
  Geist,
  Geist_Mono,
  Cormorant_Garamond,
  Noto_Sans_KR,
  Noto_Serif_KR,
} from 'next/font/google';
import './globals.css';
import { AuthBootstrap } from '@/components/auth/AuthBootstrap';

import { Nanum_Pen_Script } from 'next/font/google';

const nanumPen = Nanum_Pen_Script({
  variable: '--font-nanum-pen',
  subsets: ['latin'],
  weight: '400',
});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const notoSerifKr = Noto_Serif_KR({
  variable: '--font-noto-serif-kr',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const notoSansKr = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'CINEMO',
  description: '영화관 로비 소셜 — 매표소 · 뽑기 · 후기방',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${notoSerifKr.variable} ${notoSansKr.variable} ${nanumPen.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AuthBootstrap>{children}</AuthBootstrap>
      </body>
    </html>
  );
}
