
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

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
