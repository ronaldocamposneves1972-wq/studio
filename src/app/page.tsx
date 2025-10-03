'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/logo';
import { ArrowRight, CheckCircle, Handshake, Landmark, Phone, User, Mail } from 'lucide-react';

export default function LandingPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Add lead to Firestore and generate quiz link
    console.log({ name, email, phone });

    toast({
      title: 'Cadastro recebido!',
      description: 'Em breve, você receberá um link para continuar.',
    });

    // Reset form
    setName('');
    setEmail('');
    setPhone('');
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-16 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <AppLogo className="h-8 w-auto" />
          <span className="text-xl font-semibold">ConsorciaTech</span>
        </div>
        <nav className="flex gap-4 sm:gap-6">
           <Button variant="ghost" onClick={() => router.push('/dashboard')}>Área do Admin</Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-card">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Seu Crédito ou Consórcio de forma simples e digital.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Realize seus sonhos com a ConsorciaTech. Oferecemos as melhores condições para você comprar seu imóvel, carro ou investir no seu futuro.
                  </p>
                </div>
              </div>
              <div className="mx-auto w-full max-w-sm space-y-4 rounded-lg bg-background p-6 shadow-lg">
                <div className="space-y-2 text-center">
                  <h3 className="text-2xl font-bold">Comece agora!</h3>
                  <p className="text-muted-foreground">Preencha seus dados para uma simulação.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Seu nome"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                     <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                         className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(99) 99999-9999"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isLoading}
                         className="pl-10"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Enviando...' : 'Receber Simulação'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>

        <section id="consortium" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
               <div className="flex flex-col justify-center space-y-4">
                 <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Consórcio</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Planeje seu futuro sem juros</h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  O consórcio é a união de pessoas para formar uma poupança conjunta, destinada à aquisição de bens. Sem juros e com parcelas que cabem no seu bolso.
                </p>
                <ul className="grid gap-2 py-4">
                    <li><CheckCircle className="mr-2 inline-block h-4 w-4 text-primary" />Sem taxa de juros.</li>
                    <li><CheckCircle className="mr-2 inline-block h-4 w-4 text-primary" />Poder de compra à vista.</li>
                    <li><CheckCircle className="mr-2 inline-block h-4 w-4 text-primary" />Flexibilidade para usar o crédito.</li>
                </ul>
              </div>
              <img src="https://picsum.photos/seed/family-house/600/400" alt="Consórcio" data-ai-hint="family house" className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full" />
            </div>
          </div>
        </section>
        
        <section id="credit" className="w-full py-12 md:py-24 lg:py-32 bg-card">
          <div className="container px-4 md:px-6">
             <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <img src="https://picsum.photos/seed/fast-money/600/400" alt="Crédito" data-ai-hint="fast money" className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last" />
              <div className="flex flex-col justify-center space-y-4">
                 <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Crédito</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Realize seus projetos agora mesmo</h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Com nossas linhas de crédito, você tem o dinheiro que precisa com rapidez e as melhores taxas do mercado para tirar seus planos do papel.
                </p>
                <ul className="grid gap-2 py-4">
                    <li><CheckCircle className="mr-2 inline-block h-4 w-4 text-primary" />Liberação rápida do dinheiro.</li>
                    <li><CheckCircle className="mr-2 inline-block h-4 w-4 text-primary" />Taxas de juros competitivas.</li>
                    <li><CheckCircle className="mr-2 inline-block h-4 w-4 text-primary" />Processo 100% digital e seguro.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                A maneira inteligente de alcançar seus objetivos
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Nossos especialistas estão prontos para encontrar a solução perfeita para você.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm">
                <Button type="submit" size="lg" onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}>
                    Quero uma simulação
                    <ArrowRight className="ml-2 h-4 w-4" />
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
