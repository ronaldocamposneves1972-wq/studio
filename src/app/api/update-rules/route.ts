
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rules } = body;

    if (!rules || typeof rules !== 'string') {
      return NextResponse.json({ error: 'Conteúdo das regras ausente ou inválido.' }, { status: 400 });
    }

    // Navega para a raiz do projeto e encontra o arquivo 'firestore.rules'
    const rulesPath = path.join(process.cwd(), 'firestore.rules');

    await fs.writeFile(rulesPath, rules, 'utf8');

    return NextResponse.json({ message: 'Regras do Firestore atualizadas com sucesso.' });

  } catch (error) {
    console.error('Erro ao atualizar as regras do Firestore:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
