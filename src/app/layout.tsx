import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LocationProvider } from "@/components/location-provider";

export const metadata: Metadata = {
  title: 'NearRemind | Proximity Reminders',
  description: 'Smart location-based reminders that trigger when you arrive.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
        <LocationProvider>
          <div className="flex-1 max-w-md mx-auto w-full relative overflow-x-hidden">
            {children}
          </div>
        </LocationProvider>
        <Toaster />
      </body>
    </html>
  );
}