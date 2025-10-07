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
    const response = await fetch(`https://h-apigateway.conectagov.estaleiro.serpro.gov.br/api-cep/v1/consulta/cep/${cep}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro ao consultar o CEP.' }));
      return NextResponse.json({ error: errorData.message || 'Serviço de CEP indisponível.' }, { status: response.status });
    }

    const data = await response.json();
    
    // The API seems to return an array, we take the first element
    if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data[0]);
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Erro no proxy da API de CEP:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao consultar o CEP.' }, { status: 500 });
  }
}
