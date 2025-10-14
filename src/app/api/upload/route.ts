
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const API_URL = "https://unsterile-magen-spectrographic.ngrok-free.dev";
const API_KEY = "IUKPANx1QmVDbKokf7ipjFf5Gh5DE3Cs";
const CLIENT_SECRET = "5CJH5YNrfb8zSWUk30pgCAvbU3hmbWan";

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file = data.get('file') as File;
  const clientId = data.get('clientId') as string | null;
  const folder = data.get('folder') as string | null; // Generic folder from form data

  if (!file) {
    return NextResponse.json({ error: 'Arquivo ausente.' }, { status: 400 });
  }

  // Determine the upload folder. Priority: specific folder > client-specific folder > default.
  const uploadFolder = folder || (clientId ? `clients/${clientId}` : 'uploads');

  const uploadData = new FormData();
  uploadData.append('file', file);
  uploadData.append('folder', uploadFolder);

  try {
    const uploadResponse = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'x-client-secret': CLIENT_SECRET,
      },
      body: uploadData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('API Error:', errorText);
      // Try to parse error as JSON, if not, use the text
      let errorMessage = `Falha no upload: ${errorText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch (e) {
        // Not a JSON error, use the raw text
      }
      return NextResponse.json({ error: errorMessage }, { status: uploadResponse.status });
    }

    const result = await uploadResponse.json();
    
    // According to the new info, the API returns a `fileUrl` for public access.
    // We should save this URL.
    return NextResponse.json({
      id: result.fileId || randomUUID(), // Use fileId from API if available
      fileUrl: result.fileUrl,
      original_filename: file.name,
      folder: uploadFolder,
      filename: result.filename,
    });

  } catch (error) {
    console.error('Server-side upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha no upload do arquivo no servidor.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder');
    const filename = searchParams.get('filename');

    if (!folder || !filename) {
        return NextResponse.json({ error: 'Parâmetros folder e filename são obrigatórios.' }, { status: 400 });
    }

    const deleteUrl = new URL(`${API_URL}/delete`);
    deleteUrl.searchParams.append('folder', folder);
    deleteUrl.searchParams.append('filename', filename);

  try {
    const deleteResponse = await fetch(deleteUrl.toString(), {
      method: 'DELETE',
      headers: {
        'x-api-key': API_KEY,
        'x-client-secret': CLIENT_SECRET,
      },
    });

    if (!deleteResponse.ok) {
       const errorText = await deleteResponse.text();
       let errorMessage = `Falha ao deletar arquivo na API: ${errorText}`;
       try {
           const errorJson = JSON.parse(errorText);
           errorMessage = errorJson.error || `Falha ao deletar arquivo na API: ${errorText}`;
       } catch (e) {
            // Not a JSON error
       }
       throw new Error(errorMessage);
    }

    return NextResponse.json({ message: 'Arquivo deletado com sucesso.' });

  } catch (error) {
    console.error('Server-side delete error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao deletar o arquivo no servidor.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
