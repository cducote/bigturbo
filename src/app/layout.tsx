import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'BigTurbo - Next.js SaaS Starter',
  description: 'A modern SaaS starter built with Next.js, Clerk, Stripe, and Neon Postgres',
  keywords: ['nextjs', 'saas', 'stripe', 'clerk', 'postgres'],
  authors: [{ name: 'BigTurbo Team' }],
  creator: 'BigTurbo',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'BigTurbo - Next.js SaaS Starter',
    description: 'A modern SaaS starter built with Next.js, Clerk, Stripe, and Neon Postgres',
    siteName: 'BigTurbo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BigTurbo - Next.js SaaS Starter',
    description: 'A modern SaaS starter built with Next.js, Clerk, Stripe, and Neon Postgres',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#1e293b', // Deep navy - matches engineering documentation style
          colorBackground: '#ffffff',
          colorInputBackground: '#f8fafc',
          colorInputText: '#0f172a',
        },
        elements: {
          formButtonPrimary: 'bg-slate-800 hover:bg-slate-700',
          card: 'shadow-lg',
        },
      }}
      // Note: Session token max age (7 days / 604800s) is configured in Clerk Dashboard
      // Settings > Sessions > Session lifetime
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
