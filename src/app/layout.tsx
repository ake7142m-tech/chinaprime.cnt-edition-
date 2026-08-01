import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';
import ChatWidget from '@/components/ChatWidget';
import StatsTracker from '@/components/StatsTracker';
import Breadcrumb from '@/components/Breadcrumb';
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from '@/lib/constants';
import { getGAId, getGSCId } from '@/lib/analytics';

const GA_ID = getGAId();
const GSC_ID = getGSCId();

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  verification: GSC_ID ? { google: GSC_ID } : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        {GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}');
                `,
              }}
            />
          </>
        )}
        {GSC_ID && (
          <meta name="google-site-verification" content={GSC_ID} />
        )}
      </head>
      <body className="font-thai min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-4">
            <Breadcrumb items={[{ label: 'หน้าแรก', href: '/' }]} />
          </div>
          {children}
        </main>
        <Footer />
        <CookieConsent />
        <ChatWidget />
        <StatsTracker />
      </body>
    </html>
  );
}
