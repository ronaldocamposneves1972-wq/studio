
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { initializeApp, getApp, App, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

// --- Firebase Admin Initialization ---
// Helper to get or create the admin app instance.
// Using a unique name prevents conflicts with the client-side Firebase app.
const getAdminApp = (): App => {
    const ADMIN_APP_NAME = 'firebase-admin-app-upload';
    try {
        return getApp(ADMIN_APP_NAME);
    } catch (e) {
        // IMPORTANT: This service account JSON must be set as an environment variable in your hosting provider.
        // Do NOT hardcode it in the source code.
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
        return initializeApp({
            credential: credential.cert(serviceAccount)
        }, ADMIN_APP_NAME);
    }
};

async function getCloudinaryConfig() {
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);
    try {
        const settingsDoc = await db.collection('settings').doc('integrations').get();
        if (!settingsDoc.exists) {
            console.error("Cloudinary settings not found in Firestore.");
            return null;
        }
        const settings = settingsDoc.data();
        return {
            cloud_name: settings?.cloudinaryCloudName,
            api_key: settings?.cloudinaryApiKey,
            api_secret: settings?.cloudinaryApiSecret,
        };
    } catch (error) {
        console.error("Error fetching Cloudinary config from Firestore:", error);
        return null;
    }
}

export async function POST(request: NextRequest) {
    const cloudinaryConfig = await getCloudinaryConfig();

    if (!cloudinaryConfig || !cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
        return NextResponse.json({ error: 'A configuração do Cloudinary não foi encontrada no servidor.' }, { status: 500 });
    }

    cloudinary.config(cloudinaryConfig);

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
        return NextResponse.json({ error: 'Falha no upload do arquivo no servidor.' }, { status: 500 });
    }
}
