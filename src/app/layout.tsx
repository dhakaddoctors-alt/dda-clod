import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AiChatbot from '@/components/ui/AiChatbot';
import MobileTabBar from '@/components/shared/MobileTabBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DDA Portal - Smart Community Edition',
  description: 'A modern, zero-cost digital portal for Dhakad Doctors Association with PWA, social feed, and advanced committee management.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DDA Portal',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 custom-scrollbar pb-16 lg:pb-0`}>
        {children}
        <MobileTabBar />
        <AiChatbot />
      </body>
    </html>
  );
}
