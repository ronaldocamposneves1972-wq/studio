
import { NextRequest, NextResponse } from 'next/server';

const API_URL = "https://unsterile-magen-spectrographic.ngrok-free.dev";
const API_KEY = "IUKPANx1QmVDbKokf7ipjFf5Gh5DE3Cs";
const CLIENT_SECRET = "5CJH5YNrfb8zSWUk30pgCAvbU3hmbWan";
const BASE_FOLDER = "clients";

export async function POST(request: NextRequest) {
  // Get the form data from the original request
  const data = await request.formData();
  const file = data.get('file') as File;
  const clientId = data.get('clientId') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'Arquivo ausente.' }, { status: 400 });
  }

  // Determine the correct folder and set it on the existing FormData object
  const uploadFolder = clientId ? `${BASE_FOLDER}/${clientId}` : 'uploads';
  data.set('folder', uploadFolder); // Use .set() to add or overwrite the folder field

  try {
    const uploadResponse = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'x-client-secret': CLIENT_SECRET,
      },
      // Pass the modified FormData object directly
      body: data, 
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('API Error:', errorText);
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
    
    // Extract filename from the fileUrl if it exists
    const filename = result.fileUrl ? result.fileUrl.split('/').pop() : result.originalName;
    const unsterilePublicId = `${result.folder}/${filename}`;

    return NextResponse.json({
      id: unsterilePublicId,
      unsterilePublicId: unsterilePublicId,
      secureUrl: `https://${result.fileUrl}`,
      fileName: result.originalName, // Keep original name for display purposes
      fileType: file.type.startsWith('image/') ? 'image' : 'raw',
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
