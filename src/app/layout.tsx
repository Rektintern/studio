import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LocationProvider } from "@/components/location-provider";

export const metadata: Metadata = {
  title: 'NEAR REMIND — Reminders that know where you are',
  description: "Save an errand once — we'll nudge you the moment you're close to the right kind of place.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#f6f7f8',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: the pre-paint script below sets theme/glass attrs
    // on <html>, which dev-mode React would otherwise flag on every load
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Apply the saved theme before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=JSON.parse(localStorage.getItem('nr_settings')||'{}');var t=s.theme||'system';var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;if(d)e.classList.add('dark');if(s.glass)e.classList.add('glass');e.style.setProperty('--liquid',String((s.liquid==null?55:s.liquid)/100));}catch(e){}`,
          }}
        />
      </head>
      <body>
        <LocationProvider>{children}</LocationProvider>
      </body>
    </html>
  );
}
