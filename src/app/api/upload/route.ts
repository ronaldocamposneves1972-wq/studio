
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// --- Firebase Admin SDK Initialization ---
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

let adminApp: App;
// Initialize a named-app to avoid conflicts with client-side initialization
if (!getApps().some(app => app.name === 'admin')) {
  adminApp = initializeApp(
    {
      credential: serviceAccount ? cert(serviceAccount) : undefined,
    },
    'admin'
  );
} else {
  adminApp = getApps().find(app => app.name === 'admin')!;
}

const adminDb = getFirestore(adminApp);

// --- Cloudinary Config Function ---
async function configureCloudinary() {
  try {
    const settingsDoc = await adminDb.collection('settings').doc('integrations').get();
    if (!settingsDoc.exists) {
        throw new Error('Documento de configurações de integração não encontrado no Firestore.');
    }
    const settings = settingsDoc.data();

    if (!settings || !settings.cloudinaryCloudName || !settings.cloudinaryApiKey || !settings.cloudinaryApiSecret) {
      throw new Error('As credenciais do Cloudinary não estão configuradas no documento settings/integrations.');
    }

    cloudinary.config({
      cloud_name: settings.cloudinaryCloudName,
      api_key: settings.cloudinaryApiKey,
      api_secret: settings.cloudinaryApiSecret,
    });
    return true;
  } catch (error) {
    console.error("Erro ao configurar o Cloudinary a partir do Firestore:", error);
    // Rethrow a more specific error to be caught in the main handler
    if (error instanceof Error) {
        throw new Error(`Falha ao buscar configurações do Firestore: ${error.message}`);
    }
    throw new Error('Ocorreu um erro desconhecido ao configurar o Cloudinary.');
  }
}

export async function POST(request: NextRequest) {
  try {
    await configureCloudinary();
  } catch (error) {
     const errorMessage = error instanceof Error ? error.message : 'A configuração do servidor para upload de arquivos está incompleta ou falhou.';
     return NextResponse.json({ error: errorMessage }, { status: 500 });
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
