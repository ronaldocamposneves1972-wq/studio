
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// --- Firebase Admin SDK Initialization ---
// Create a separate, admin-privileged Firebase app instance for server-side operations.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

let adminApp: App;
if (!getApps().some(app => app.name === 'firebase-admin')) {
  adminApp = initializeApp(
    {
      credential: serviceAccount ? cert(serviceAccount) : undefined,
    },
    'firebase-admin'
  );
} else {
  adminApp = getApps().find(app => app.name === 'firebase-admin')!;
}

const adminDb = getFirestore(adminApp);

// --- Cloudinary Config Function ---
async function configureCloudinary() {
  try {
    const settingsDoc = await adminDb.collection('settings').doc('integrations').get();
    const settings = settingsDoc.data();

    if (!settings || !settings.cloudinaryCloudName || !settings.cloudinaryApiKey || !settings.cloudinaryApiSecret) {
      throw new Error('As credenciais do Cloudinary não estão configuradas no Firestore (settings/integrations).');
    }

    cloudinary.config({
      cloud_name: settings.cloudinaryCloudName,
      api_key: settings.cloudinaryApiKey,
      api_secret: settings.cloudinaryApiSecret,
    });
    return true;
  } catch (error) {
    console.error("Erro ao configurar o Cloudinary a partir do Firestore:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const isConfigured = await configureCloudinary();
  if (!isConfigured) {
    return NextResponse.json({ error: 'A configuração do servidor para upload de arquivos está incompleta ou falhou.' }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const clientId = formData.get('clientId') as string;

  if (!file || !clientId) {
    return NextResponse.json({ error: 'Arquivo ou ID do cliente ausente.' }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        folder: `clients/${clientId}`,
        resource_type: 'auto'
      }, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }).end(buffer);
    });

    return NextResponse.json({
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
      original_filename: file.name,
      resource_type: uploadResult.resource_type,
    });

  } catch (error) {
    console.error('Server-side upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha no upload do arquivo no servidor.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
