
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/logo';
import { ArrowRight, CheckCircle, Handshake, ShieldCheck, TrendingUp } from 'lucide-react';

export default function LandingPage() {
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
        <Button variant="ghost" onClick={() => router.push('/dashboard')}>+Acessos</Button>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-card">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                   <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-semibold">Sua Parceira Financeira</div>
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Soluções de Crédito Inteligentes para Você
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Na ConsorciaTech, transformamos seus planos em realidade com processos simples, taxas justas e um atendimento que entende suas necessidades.
                  </p>
                </div>
                 <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/cadastro">
                      Simule seu Crédito
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="mx-auto w-full max-w-lg flex items-center justify-center">
                 <img src="https://picsum.photos/seed/finance-hero/600/600" alt="Hero" data-ai-hint="financial growth" className="rounded-xl object-cover shadow-2xl aspect-square" />
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Por que escolher a ConsorciaTech?</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Somos mais que uma financeira. Somos seus parceiros na jornada para alcançar seus objetivos.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-12 py-12 lg:grid-cols-3">
              <div className="grid gap-2 text-center">
                 <ShieldCheck className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-xl font-bold">Segurança e Confiança</h3>
                <p className="text-muted-foreground">
                  Seus dados e transações protegidos com a mais alta tecnologia de segurança.
                </p>
              </div>
              <div className="grid gap-2 text-center">
                <Handshake className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-xl font-bold">Processo Simplificado</h3>
                <p className="text-muted-foreground">
                  Digital e sem burocracia. Resolvemos seu crédito de forma rápida para você não perder tempo.
                </p>
              </div>
               <div className="grid gap-2 text-center">
                <TrendingUp className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-xl font-bold">As Melhores Condições</h3>
                <p className="text-muted-foreground">
                  Analisamos seu perfil para oferecer as taxas mais competitivas e as melhores opções do mercado.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section id="cta" className="w-full py-12 md:py-24 lg:py-32 bg-card">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Pronto para dar o próximo passo?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Nossa equipe de especialistas está pronta para encontrar a solução de crédito perfeita para você. Comece sua simulação agora mesmo.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm">
                <Button asChild type="submit" size="lg">
                  <Link href="/cadastro">
                    Quero uma simulação
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
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
