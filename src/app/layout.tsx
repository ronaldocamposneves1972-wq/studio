import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
    try {
        const serviceAccount = JSON.parse(
            process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
        );
        initializeApp({
            credential: cert(serviceAccount),
            // The databaseURL is required for the Admin SDK to connect to Firestore.
            databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
        });
        console.log("Firebase Admin SDK initialized successfully.");
    } catch (e) {
        console.error('Firebase Admin SDK initialization error', e);
    }
}


export const metadata: Metadata = {
  title: 'ConsorciaTech',
  description: 'Sistema completo de consórcio e crédito',
};

async function getBranding() {
  // Use the Admin SDK to fetch data on the server.
  try {
    const firestore = getFirestore();
    const brandingRef = firestore.collection('settings').doc('branding');
    const brandingSnap = await brandingRef.get();
    
    if (brandingSnap.exists) {
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
