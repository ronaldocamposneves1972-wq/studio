
import { NextRequest, NextResponse } from 'next/server';

const API_URL = "https://unsterile-magen-spectrographic.ngrok-free.dev";
const API_KEY = "IUKPANx1QmVDbKokf7ipjFf5Gh5DE3Cs";
const CLIENT_SECRET = "5CJH5YNrfb8zSWUk30pgCAvbU3hmbWan";
const BASE_FOLDER = "clients";

export async function POST(request: NextRequest) {
  const data = await request.formData();

  const file: File | null = data.get('file') as unknown as File;
  const clientId = data.get('clientId') as string | null;

  if (!file) {
    console.error('Arquivo ausente.');
    return NextResponse.json({ error: 'Arquivo ausente.' }, { status: 400 });
  }

  if (!clientId) {
    console.error('clientId ausente.');
    return NextResponse.json({ error: 'clientId é obrigatório.' }, { status: 400 });
  }

  const uploadFolder = `${BASE_FOLDER}/${clientId}`;
  console.log('Pasta de upload definida para:', uploadFolder);

  const fileBuffer = await file.arrayBuffer();

  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer], { type: file.type }), file.name);
  formData.append('folder', uploadFolder);


  try {
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'x-api-key': API_KEY,
        'x-client-secret': CLIENT_SECRET,
      },
      body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API Error: ${response.status} - ${errorText}`;
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch (e) {
            // Not a JSON error, use the text
        }
        console.error('Falha no upload para a API externa:', errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const result = await response.json();
    const filename = result.fileUrl ? result.fileUrl.split('/').pop() : result.originalName;
    const unsterilePublicId = `${result.folder}/${filename}`;

    console.log('Upload finalizado com sucesso:', result);

    return NextResponse.json({
      id: unsterilePublicId,
      unsterilePublicId: unsterilePublicId,
      secureUrl: `https://${result.fileUrl}`,
      fileName: result.originalName,
      fileType: file.type.startsWith('image/') ? 'image' : 'raw',
    });

  } catch (error) {
    console.error('Server-side upload error:', error);
    let errorMessage = 'Falha no upload do arquivo no servidor.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
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
