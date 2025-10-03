import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle, TrendingUp, Users, Shield, Zap, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { AppLogo } from "@/components/logo";

const heroImage = PlaceHolderImages.find((img) => img.id === "hero");

const features = [
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: "Agilidade Digital",
    description: "Propostas e assinaturas eletrônicas enviadas diretamente pelo WhatsApp.",
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "CRM Integrado",
    description: "Visão 360º do cliente, com histórico completo e status em tempo real.",
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-primary" />,
    title: "Gestão Financeira",
    description: "Cálculo automático e relatórios detalhados de comissões.",
  },
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: "Processos Configuráveis",
    description: "Crie quizzes e formulários personalizados para a qualificação de clientes.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <AppLogo className="h-8 w-auto text-primary" />
          <span className="sr-only">ConsorciaTech</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="#features" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Funcionalidades
          </Link>
          <Link href="#contact" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Contato
          </Link>
          <Button asChild>
            <Link href="/dashboard">Acessar Plataforma</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-card">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              {heroImage && (
                 <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    width={1200}
                    height={800}
                    data-ai-hint={heroImage.imageHint}
                    className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
                  />
              )}
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    Transforme sua gestão de consórcios e créditos
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    ConsorciaTech é a plataforma completa para automatizar suas vendas, gerenciar clientes e otimizar seu financeiro.
                  </p>
                </div>
                <div className="w-full max-w-sm space-y-2">
                  <form className="flex space-x-2">
                    <Input type="email" placeholder="Seu melhor e-mail" className="max-w-lg flex-1" />
                    <Button type="submit">
                      Começar Agora <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground">
                    Inicie sua jornada para a eficiência.{" "}
                    <Link href="#" className="underline underline-offset-2" prefetch={false}>
                      Termos & Condições
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Nossas Funcionalidades</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                  Tudo que você precisa em um só lugar
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Desde a captação do cliente até o controle de comissões, nossa plataforma cobre todo o ciclo de vida da sua operação.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4 mt-12">
              {features.map((feature, index) => (
                <div key={index} className="grid gap-2 text-center md:text-left">
                  <div className="flex justify-center md:justify-start">{feature.icon}</div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-card">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
                Pronto para simplificar sua operação?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Comece hoje mesmo e veja como a ConsorciaTech pode impulsionar seus resultados.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Acessar a plataforma
                </Link>
              </Button>
            </div>
          </div>
        </section>
        
        <section id="contact" className="w-full py-12 md:py-24 lg:py-32 border-t">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">Fale Conosco</h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                Tem alguma dúvida? Preencha o formulário abaixo e nossa equipe entrará em contato.
              </p>
            </div>
            <div className="mx-auto w-full max-w-md space-y-4">
               <Card>
                <CardContent className="pt-6">
                  <form className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input id="name" placeholder="Seu nome completo" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email-contact">Email</Label>
                      <Input id="email-contact" type="email" placeholder="seu@email.com" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input id="phone" placeholder="(XX) XXXXX-XXXX" />
                    </div>
                    <Button type="submit" className="w-full">Enviar Mensagem</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 ConsorciaTech. Todos os direitos reservados.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Termos de Serviço
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Política de Privacidade
          </Link>
        </nav>
      </footer>
    </div>
  );
}
