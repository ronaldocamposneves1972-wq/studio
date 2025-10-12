import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export const metadata: Metadata = {
  title: 'ConsorciaTech',
  description: 'Sistema completo de consórcio e crédito',
};

async function getBranding() {
  // We need to initialize a temporary client-side instance on the server
  // to fetch the initial branding settings.
  // This is a read-only operation and doesn't involve user authentication.
  try {
    const { firestore } = initializeFirebase();
    const brandingRef = doc(firestore, 'settings', 'branding');
    const brandingSnap = await getDoc(brandingRef);
    if (brandingSnap.exists()) {
      return brandingSnap.data();
    }
  } catch (error) {
    console.error("Could not fetch branding settings on server:", error);
  }
  return null;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = await getBranding();

  const customStyles = branding ? {
    '--primary': branding.primaryColor || '194.5 90.5% 54.9%',
    '--secondary': branding.secondaryColor || '210 40% 96.1%',
  } as React.CSSProperties : {};

  return (
    <html lang="en" suppressHydrationWarning style={customStyles}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn(
        "min-h-screen bg-background font-body antialiased"
      )}>
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
