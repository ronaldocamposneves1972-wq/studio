import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { cep: string } }
) {
  const cep = params.cep.replace(/\D/g, ''); // Remove non-digit characters

  if (!cep || cep.length !== 8) {
    return NextResponse.json({ error: 'CEP inválido.' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Erro ao consultar o CEP. Status: ${response.status}` }));
      return NextResponse.json({ error: errorData.message || 'Serviço de CEP indisponível no momento.' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Erro no proxy da API de CEP:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao consultar o CEP.' }, { status: 500 });
  }
}
