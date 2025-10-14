
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';

const API_URL = "https://unsterile-magen-spectrographic.ngrok-free.dev";
const API_KEY = "IUKPANx1QmVDbKokf7ipjFf5Gh5DE3Cs";
const CLIENT_SECRET = "5CJH5YNrfb8zSWUk30pgCAvbU3hmbWan";
const BASE_FOLDER = "clients";

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;
  const clientId = data.get('clientId') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'Arquivo ausente.' }, { status: 400 });
  }

  const uploadFolder = clientId ? `${BASE_FOLDER}/${clientId}` : 'uploads';
  const fileBuffer = await file.arrayBuffer();
  
  const formData = new FormData();
  formData.append('file', Buffer.from(fileBuffer), {
    filename: file.name,
    contentType: file.type,
  });
  formData.append('folder', uploadFolder);

  try {
    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'accept': 'application/json',
        'x-api-key': API_KEY,
        'x-client-secret': CLIENT_SECRET,
        ...formData.getHeaders(),
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    const result = response.data;
    const filename = result.fileUrl ? result.fileUrl.split('/').pop() : result.originalName;
    const unsterilePublicId = `${result.folder}/${filename}`;

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
    if (axios.isAxiosError(error) && error.response) {
      errorMessage = error.response.data?.error || error.response.data?.message || `Erro da API: ${error.response.statusText}`;
    } else if (error instanceof Error) {
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
