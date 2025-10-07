
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/logo';
import { ArrowRight, CheckCircle, ChevronDown, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function CreditoCLTPage() {
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="link">
                Pra você <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild><Link href="/credito-pessoal">Crédito Pessoal</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/credito-clt">Crédito CLT</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="#">Financiamento</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="#">Cartões de crédito</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="#">Investimentos</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="#">Título de capitalização</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="#">Consórcio</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="#">Seguros</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="link">
                Para Aposentados <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild><Link href="#">Crédito consignado</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/refinanciamento">Refinanciamento</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="#">Portabilidade</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="#">Siape</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="link">
                Ajuda <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild><Link href="#">Central de ajuda</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="#">Ajuda para você</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="#">Ajuda para Micro empresas</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="#">Dúvidas frequentes</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="#">iToken</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="#">Renegociação</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="#">Faturas</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>+Acessos</Button>
            <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right">
                <div className="grid gap-4 py-6">
                <Link href="/" className="font-bold">Início</Link>
                <Accordion type="single" collapsible>
                    <AccordionItem value="pra-voce">
                    <AccordionTrigger>Pra você</AccordionTrigger>
                    <AccordionContent className="grid gap-2 pl-4">
                        <Link href="/credito-pessoal">Crédito Pessoal</Link>
                        <Link href="/credito-clt">Crédito CLT</Link>
                        <Link href="#">Financiamento</Link>
                        <Link href="#">Cartões de crédito</Link>
                        <Link href="#">Investimentos</Link>
                        <Link href="#">Título de capitalização</Link>
                        <Link href="#">Consórcio</Link>
                        <Link href="#">Seguros</Link>
                    </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="aposentados">
                    <AccordionTrigger>Para Aposentados</AccordionTrigger>
                    <AccordionContent className="grid gap-2 pl-4">
                        <Link href="#">Crédito consignado</Link>
                        <Link href="/refinanciamento">Refinanciamento</Link>
                        <Link href="#">Portabilidade</Link>
                        <Link href="#">Siape</Link>
                    </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="ajuda">
                    <AccordionTrigger>Ajuda</AccordionTrigger>
                    <AccordionContent className="grid gap-2 pl-4">
                        <Link href="#">Central de ajuda</Link>
                        <Link href="#">Ajuda para você</Link>
                        <Link href="#">Ajuda para Micro empresas</Link>
                        <Link href="#">Dúvidas frequentes</Link>
                        <Link href="#">iToken</Link>
                        <Link href="#">Renegociação</Link>
                        <Link href="#">Faturas</Link>
                    </AccordionContent>
                    </AccordionItem>
                </Accordion>
                </div>
            </SheetContent>
            </Sheet>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
               <img src="https://picsum.photos/seed/clt-credit/600/600" alt="Crédito CLT" data-ai-hint="formal worker" className="mx-auto aspect-square overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last" />
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-semibold">Exclusivo para você, trabalhador</div>
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Crédito para Assalariados CLT</h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Aproveite as vantagens de ser um trabalhador com carteira assinada. Oferecemos uma linha de crédito com condições especiais e débito em conta para sua comodidade.
                  </p>
                </div>
                <ul className="grid gap-2 py-4">
                  <li><CheckCircle className="mr-2 inline-block h-4 w-4 text-primary" /> Taxas de juros reduzidas.</li>
                  <li><CheckCircle className="mr-2 inline-block h-4 w-4 text-primary" /> Pagamento facilitado com débito em conta.</li>
                  <li><CheckCircle className="mr-2 inline-block h-4 w-4 text-primary" /> Análise de crédito rápida e sem complicação.</li>
                  <li><CheckCircle className="mr-2 inline-block h-4 w-4 text-primary" /> Mais segurança e controle para seu orçamento.</li>
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
