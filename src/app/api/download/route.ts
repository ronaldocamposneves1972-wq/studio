import { NextRequest, NextResponse } from 'next/server';

const API_URL = "https://unsterile-magen-spectrographic.ngrok-free.dev";
const API_KEY = "IUKPANx1QmVDbKokf7ipjFf5Gh5DE3Cs";
const CLIENT_SECRET = "5CJH5YNrfb8zSWUk30pgCAvbU3hmbWan";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');

  if (!file) {
    return NextResponse.json({ error: 'Parâmetro de arquivo ausente.' }, { status: 400 });
  }

  const downloadUrl = new URL(`${API_URL}/download`);
  downloadUrl.searchParams.append('file', file);

  try {
    const downloadResponse = await fetch(downloadUrl.toString(), {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'x-client-secret': CLIENT_SECRET,
      },
    });

    if (!downloadResponse.ok) {
      const errorText = await downloadResponse.text();
      let errorMessage = `Falha ao baixar arquivo da API: ${errorText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch (e) {
        // Not JSON
      }
      return NextResponse.json({ error: errorMessage }, { status: downloadResponse.status });
    }

    // Stream the file back to the client
    const headers = new Headers();
    headers.set('Content-Type', downloadResponse.headers.get('Content-Type') || 'application/octet-stream');
    headers.set('Content-Disposition', downloadResponse.headers.get('Content-Disposition') || `attachment; filename="${file.split('/').pop()}"`);

    if (downloadResponse.body) {
        return new NextResponse(downloadResponse.body, {
            status: 200,
            headers: headers,
        });
    }

    return NextResponse.json({ error: 'Corpo da resposta do arquivo está vazio.' }, { status: 500 });


  } catch (error) {
    console.error('Server-side download error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao baixar o arquivo no servidor.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
