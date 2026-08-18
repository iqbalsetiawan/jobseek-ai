import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { ThemedToaster } from '@/components/ThemedToaster';
import { getSiteUrl } from '@/lib/site';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

const siteUrl = getSiteUrl();
const title = {
  default: 'JobSeekAI',
  template: '%s · JobSeekAI',
};
const description =
  'Draft a thoughtful cover letter for any application: clear wording, your own tone, no generic filler.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: 'JobSeekAI',
  keywords: ['cover letter', 'job application', 'resume', 'CV', 'careers'],
  authors: [{ name: 'JobSeekAI', url: siteUrl }],
  creator: 'JobSeekAI',
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'JobSeekAI',
    title: title.default,
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title: title.default,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="bg-background text-foreground min-h-full"
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <ThemedToaster />
        </Providers>
      </body>
    </html>
  );
}
