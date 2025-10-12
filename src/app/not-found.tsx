
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/logo';
import { Frown } from 'lucide-react';
import Image from 'next/image';

const appName = 'Safecred';
const logoUrl = 'https://ik.imagekit.io/bpsmw0nyu/logo.png';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-secondary text-foreground p-4">
      <header className="absolute top-0 left-0 right-0 px-4 lg:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            {logoUrl ? (
              <Image src={logoUrl} alt={appName} width={32} height={32} />
            ) : (
              <AppLogo className="h-8 w-auto" />
            )}
            <span className="text-xl font-semibold text-primary">{appName}</span>
          </Link>
        </div>
      </header>
      <main className="flex flex-col items-center justify-center text-center space-y-6">
        <Frown className="h-24 w-24 text-primary opacity-50" />
        <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-primary">404 - Página Não Encontrada</h1>
            <p className="text-lg text-muted-foreground max-w-md">
                Oops! Parece que a página que você está procurando não existe ou foi movida.
            </p>
        </div>
        <Button asChild size="lg">
          <Link href="/">Voltar para a Página Inicial</Link>
        </Button>
      </main>
    </div>
  );
}
