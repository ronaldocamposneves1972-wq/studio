import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  const email = params.email;

  if (!email) {
    return NextResponse.json({ error: 'Email é obrigatório.' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://rapid-email-verifier.fly.dev/api/validate?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
        return NextResponse.json({ 
            error: data.message || `Erro ao validar o e-mail. Status: ${response.status}` 
        }, { status: response.status });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Erro no proxy da API de validação de email:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao validar o e-mail.' }, { status: 500 });
  }
}
