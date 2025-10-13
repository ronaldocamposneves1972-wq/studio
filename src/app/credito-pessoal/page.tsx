
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/logo';
import { ArrowRight, CheckCircle, ChevronDown, Menu, DollarSign, Clock, Briefcase, Landmark, CreditCard, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';

const appName = 'Safecred';
const logoUrl = 'https://ik.imagekit.io/bpsmw0nyu/logo.png';

export default function CreditoPessoalPage() {
  const router = useRouter();
  const [productCarouselApi, setProductCarouselApi] = useState<CarouselApi>();
  const [statsCarouselApi, setStatsCarouselApi] = useState<CarouselApi>();
  const [productCurrent, setProductCurrent] = useState(0);
  const [statsCurrent, setStatsCurrent] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [statsCount, setStatsCount] = useState(0);

  useEffect(() => {
    if (!productCarouselApi) return;
    setProductCount(productCarouselApi.scrollSnapList().length);
    setProductCurrent(productCarouselApi.selectedScrollSnap());
    productCarouselApi.on("select", () => setProductCurrent(productCarouselApi.selectedScrollSnap()));
  }, [productCarouselApi]);

  useEffect(() => {
    if (!statsCarouselApi) return;
    setStatsCount(statsCarouselApi.scrollSnapList().length);
    setStatsCurrent(statsCarouselApi.selectedScrollSnap());
    statsCarouselApi.on("select", () => setStatsCurrent(statsCarouselApi.selectedScrollSnap()));
  }, [statsCarouselApi]);

  const scrollToProduct = useCallback((index: number) => productCarouselApi?.scrollTo(index), [productCarouselApi]);
  const scrollToStat = useCallback((index: number) => statsCarouselApi?.scrollTo(index), [statsCarouselApi]);

  const productCards = [
      {
        title: "Crédito Pessoal",
        description: "Dinheiro rápido para suas necessidades.",
        icon: DollarSign,
        href: "/credito-pessoal"
      },
      {
        title: "Antecipação FGTS",
        description: "Use um dinheiro que já é seu.",
        icon: Clock,
        href: "/antecipacao-fgts"
      },
      {
        title: "Crédito CLT",
        description: "Vantagens exclusivas para assalariados.",
        icon: Briefcase,
        href: "/credito-clt"
      },
      {
        title: "Refinanciamento",
        description: "Use seu bem como linha de crédito.",
        icon: Landmark,
        href: "/refinanciamento"
      }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
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
                <DropdownMenuItem asChild><Link href="#">Crédito imobiliário</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="#">Cartão consignado</Link></DropdownMenuItem>
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
                          <Link href="#">Crédito imobiliário</Link>
                          <Link href="#">Cartão consignado</Link>    
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
                          <Link href="#">Renegociação</Link>
                          <Link href="#">Faturas</Link>
                      </AccordionContent>
                      </AccordionItem>
                  </Accordion>
                  </div>
              </SheetContent>
              </Sheet>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-semibold">Para todos os momentos</div>
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Crédito Pessoal Descomplicado</h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Precisando de dinheiro para organizar as contas, reformar a casa ou realizar um sonho? Nosso crédito pessoal é a solução rápida e flexível que você procura.
                  </p>
                </div>
                <ul className="grid gap-2 py-4">
                  <li><CheckCircle className="mr-2 inline-block h-4 w-4 text-primary" /> Liberação rápida do dinheiro na sua conta.</li>
                  <li><CheckCircle className="mr-2 inline-block h-4 w-4 text-primary" /> Taxas de juros competitivas e transparentes.</li>
                  <li><CheckCircle className="mr-2 inline-block h-4 w-4 text-primary" /> Processo 100% digital, do seu jeito e no seu tempo.</li>
                  <li><CheckCircle className="mr-2 inline-block h-4 w-4 text-primary" /> Prazos flexíveis para você se organizar.</li>
                </ul>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/cadastro?quiz=credito-pessoal">
                      Solicite agora
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <img src="https://picsum.photos/seed/personal-credit/600/600" alt="Crédito Pessoal" data-ai-hint="happy person money" className="mx-auto aspect-square overflow-hidden rounded-xl object-cover object-center sm:w-full" />
            </div>
          </div>
        </section>

        {/* For Every Moment Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Para cada momento, um {appName} diferente</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Oferecemos diversas soluções de crédito para te ajudar a realizar seus sonhos e organizar sua vida financeira.
                </p>
              </div>
            </div>
            <div className="mt-12">
              <div className="md:hidden">
                 <Carousel setApi={setProductCarouselApi} className="w-full">
                  <CarouselContent>
                    {productCards.map((card, index) => (
                      <CarouselItem key={index} className="basis-3/4">
                        <Link href={card.href} className="block group h-full">
                          <Card className="h-full rounded-xl">
                            <CardContent className="flex flex-col items-center justify-center text-center p-6 gap-4">
                              <div className="flex items-center justify-center h-24 w-24 rounded-full bg-primary/10 text-primary mb-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <card.icon className="h-12 w-12" />
                              </div>
                              <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">{card.title}</h3>
                              <p className="text-base text-muted-foreground">{card.description}</p>
                            </CardContent>
                          </Card>
                        </Link>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
                <div className="py-2 flex justify-center gap-1">
                  {Array.from({ length: productCount }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => scrollToProduct(i)}
                      className={cn(
                        "h-2 w-2 rounded-full",
                        productCurrent === i ? "bg-primary" : "bg-primary/20"
                      )}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                 {productCards.map((card, index) => (
                    <Link href={card.href} key={index} className="block group h-full">
                      <Card className="h-full rounded-xl hover:border-primary/50 hover:shadow-lg transition-all">
                        <CardContent className="flex flex-col items-center justify-center text-center p-6 gap-4">
                            <div className="flex items-center justify-center h-24 w-24 rounded-full bg-primary/10 text-primary mb-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <card.icon className="h-12 w-12" />
                            </div>
                            <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">{card.title}</h3>
                            <p className="text-base text-muted-foreground">{card.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* Stats Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
           <div className="container grid items-center justify-center gap-8 px-4 text-center md:px-6">
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">O banco feito de futuro está presente na vida de milhões de pessoas</h2>
                </div>
                
                <div className="md:hidden">
                    <Carousel setApi={setStatsCarouselApi} className="w-full max-w-xs mx-auto">
                        <CarouselContent>
                            <CarouselItem>
                                <div className="flex flex-col items-center gap-2 p-4">
                                    <Users className="w-10 h-10 text-primary"/>
                                    <p className="font-semibold text-lg">+70 mil pessoas</p>
                                    <p className="text-muted-foreground">com dívidas solucionadas todos os meses.</p>
                                </div>
                            </CarouselItem>
                            <CarouselItem>
                                <div className="flex flex-col items-center gap-2 p-4">
                                    <DollarSign className="w-10 h-10 text-primary"/>
                                    <p className="font-semibold text-lg">+2 bilhões</p>
                                    <p className="text-muted-foreground">em descontos para você quitar dívidas com as melhores condições.</p>
                                </div>
                            </CarouselItem>
                             <CarouselItem>
                                <div className="flex flex-col items-center gap-2 p-4">
                                    <CreditCard className="w-10 h-10 text-primary"/>
                                    <p className="font-semibold text-lg">+1 milhão de pessoas</p>
                                    <p className="text-muted-foreground">com nome limpo e reinseridas no crédito.</p>
                                </div>
                            </CarouselItem>
                            <CarouselItem>
                                <div className="flex flex-col items-center gap-2 p-4">
                                    <Check className="w-10 h-10 text-primary"/>
                                    <p className="font-semibold text-lg">100 anos</p>
                                    <p className="text-muted-foreground">sempre cuidando da sua segurança.</p>
                                </div>
                            </CarouselItem>
                        </CarouselContent>
                    </Carousel>
                     <div className="py-2 flex justify-center gap-1">
                      {Array.from({ length: statsCount }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => scrollToStat(i)}
                          className={cn(
                            "h-2 w-2 rounded-full",
                            statsCurrent === i ? "bg-primary" : "bg-primary/20"
                          )}
                          aria-label={`Go to slide ${i + 1}`}
                        />
                      ))}
                    </div>
                </div>

                <div className="hidden md:grid md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-5xl">
                    <div className="flex flex-col items-center gap-2">
                        <Users className="w-10 h-10 text-primary"/>
                        <p className="font-semibold text-lg">+70 mil pessoas</p>
                        <p className="text-muted-foreground">com dívidas solucionadas todos os meses.</p>
                    </div>
                     <div className="flex flex-col items-center gap-2">
                        <DollarSign className="w-10 h-10 text-primary"/>
                        <p className="font-semibold text-lg">+2 bilhões</p>
                        <p className="text-muted-foreground">em descontos para você quitar dívidas com as melhores condições.</p>
                    </div>
                     <div className="flex flex-col items-center gap-2">
                        <CreditCard className="w-10 h-10 text-primary"/>
                        <p className="font-semibold text-lg">+1 milhão de pessoas</p>
                        <p className="text-muted-foreground">com nome limpo e reinseridas no crédito.</p>
                    </div>
                     <div className="flex flex-col items-center gap-2">
                        <Check className="w-10 h-10 text-primary"/>
                        <p className="font-semibold text-lg">100 anos</p>
                        <p className="text-muted-foreground">sempre cuidando da sua segurança.</p>
                    </div>
                </div>
            </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 {appName}. Todos os direitos reservados.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">Termos de Serviço</Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">Política de Privacidade</Link>
        </nav>
      </footer>
    </div>
  );
}

    