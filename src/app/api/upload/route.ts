
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Configure Cloudinary with your credentials
// These are securely stored on the server and not exposed to the client.
cloudinary.config({
  cloud_name: 'duuaxalsw',
  api_key: '581358637918314',
  api_secret: 'NTNgWHeJJAQVxWQ8GvMZtx3Uam0',
});


export async function POST(request: NextRequest) {
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


export async function DELETE(request: NextRequest) {
  try {
    const { public_id } = await request.json();

    if (!public_id) {
      return NextResponse.json({ error: 'ID público do arquivo ausente.' }, { status: 400 });
    }

    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result !== 'ok' && result.result !== 'not found') {
       throw new Error(result.result || 'Falha ao deletar o arquivo no Cloudinary.');
    }
    
    return NextResponse.json({ message: 'Arquivo deletado com sucesso.' });

  } catch (error) {
    console.error('Server-side delete error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao deletar o arquivo no servidor.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
