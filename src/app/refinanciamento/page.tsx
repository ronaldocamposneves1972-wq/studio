
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/logo';
import { ArrowRight, CheckCircle } from 'lucide-react';

export default function RefinanciamentoPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-16 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <AppLogo className="h-8 w-auto" />
          <span className="text-xl font-semibold">ConsorciaTech</span>
        </div>
        <nav className="hidden lg:flex gap-4 sm:gap-6">
           <Button variant="link" asChild><Link href="/">Início</Link></Button>
           <Button variant="link" asChild><Link href="/credito-pessoal">Crédito Pessoal</Link></Button>
           <Button variant="link" asChild><Link href="/credito-clt">Crédito CLT</Link></Button>
           <Button variant="link" asChild><Link href="/antecipacao-fgts">Antecipação FGTS</Link></Button>
           <Button variant="link" asChild><Link href="/refinanciamento">Refinanciamento</Link></Button>
        </nav>
        <Button variant="ghost" onClick={() => router.push('/dashboard')}>Área do Admin</Button>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <img src="https://picsum.photos/seed/refinance-house/600/600" alt="Refinanciamento" data-ai-hint="house keys" className="mx-auto aspect-square overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last" />
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-semibold">Use seu bem como crédito</div>
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Refinanciamento de Imóvel ou Veículo</h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Seu imóvel ou veículo quitado vale crédito na praça. Use seu bem como garantia e consiga as menores taxas de juros do mercado para grandes projetos.
                  </p>
                </div>
                <ul className="grid gap-2 py-4">
                  <li><CheckCircle className="mr-2 inline-block h-4 w-4 text-primary" /> Obtenha altos valores de crédito.</li>
                  <li><CheckCircle className="mr-2 inline-block h-4 w-4 text-primary" /> As menores taxas de juros do mercado.</li>
                  <li><CheckCircle className="mr-2 inline-block h-4 w-4 text-primary" /> Prazos longos para pagar com tranquilidade.</li>
                  <li><CheckCircle className="mr-2 inline-block h-4 w-4 text-primary" /> Você continua usando seu bem normalmente.</li>
                </ul>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/cadastro">
                      Solicite agora
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 ConsorciaTech. Todos os direitos reservados.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <a href="#" className="text-xs hover:underline underline-offset-4">Termos de Serviço</a>
          <a href="#" className="text-xs hover:underline underline-offset-4">Política de Privacidade</a>
        </nav>
      </footer>
    </div>
  );
}
