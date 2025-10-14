import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const API_URL = "https://unsterile-magen-spectrographic.ngrok-free.dev";
const API_KEY = "IUKPANx1QmVDbKokf7ipjFf5Gh5DE3Cs";
const CLIENT_SECRET = "5CJH5YNrfb8zSWUk30pgCAvbU3hmbWan";

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file = data.get('file') as File;
  const clientId = data.get('clientId') as string | null;
  const folder = data.get('folder') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'Arquivo ausente.' }, { status: 400 });
  }

  const uploadFolder = folder ? folder : (clientId ? `clients/${clientId}` : 'uploads');

  const uploadData = new FormData();
  uploadData.append('file', file);
  uploadData.append('folder', uploadFolder);

  try {
    const uploadResponse = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'ApiKey': API_KEY,
        'ClientSecret': CLIENT_SECRET,
      },
      body: uploadData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('API Error:', errorText);
      return NextResponse.json({ error: `Falha no upload: ${errorText}` }, { status: uploadResponse.status });
    }

    // Assuming the API returns a JSON with the filename upon successful upload.
    // The documentation says "Upload realizado", but a JSON response is more likely.
    const result = await uploadResponse.json();
    const filename = result.filename || file.name;
    const resourceType = file.type.startsWith('image/') ? 'image' : 'raw';

    // Construct the URL for accessing the file based on the download endpoint
    const secure_url = `${API_URL}/download/${uploadFolder}/${filename}`;

    return NextResponse.json({
      id: randomUUID(),
      secure_url: secure_url,
      original_filename: file.name,
      resource_type: resourceType,
      folder: uploadFolder,
      filename: filename,
    });

  } catch (error) {
    console.error('Server-side upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha no upload do arquivo no servidor.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { folder, filename } = await request.json();

    if (!folder || !filename) {
      return NextResponse.json({ error: 'Dados do arquivo ausentes.' }, { status: 400 });
    }

    const deleteResponse = await fetch(`${API_URL}/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'ApiKey': API_KEY,
        'ClientSecret': CLIENT_SECRET,
      },
      body: JSON.stringify({ folder, filename }),
    });

    if (!deleteResponse.ok) {
       const errorText = await deleteResponse.text();
       throw new Error(`Falha ao deletar arquivo na API: ${errorText}`);
    }

    return NextResponse.json({ message: 'Arquivo deletado com sucesso.' });

  } catch (error) {
    console.error('Server-side delete error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao deletar o arquivo no servidor.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
