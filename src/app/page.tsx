'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AppLogo } from '@/components/logo';
import { validateCPF, maskCPF } from '@/lib/utils';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"

const appName = 'Safecred';
const logoUrl = 'https://ik.imagekit.io/bpsmw0nyu/logo.png';

const CpfSchema = z.object({
  cpf: z.string().refine(validateCPF, {
    message: 'Por favor, insira um CPF válido.',
  }),
});

type CpfFormData = z.infer<typeof CpfSchema>;

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CpfFormData>({
    resolver: zodResolver(CpfSchema),
    defaultValues: {
      cpf: '',
    },
  });

  const onSubmit = (data: CpfFormData) => {
    setIsLoading(true);
    console.log('CPF Válido:', data.cpf);
    router.push(`/cadastro?cpf=${data.cpf}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-16 flex items-center justify-between border-b">
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
        <Button variant="ghost" onClick={() => router.push('/dashboard')}>
          Acessar Painel
        </Button>
      </header>

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
                <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
                    <div className="flex flex-col justify-center space-y-4">
                        <div className="space-y-4">
                            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                                Peça seu Cartão de Crédito e sua Conta {appName}
                            </h1>
                            <p className="max-w-[600px] text-muted-foreground md:text-xl">
                                Comece agora mesmo. É rápido, fácil e seguro.
                            </p>
                        </div>
                         <div className="w-full max-w-sm space-y-4 pt-4">
                             <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="cpf"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Digite seu CPF</FormLabel>
                                            <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="000.000.000-00"
                                                maxLength={14}
                                                className="h-12 text-base"
                                                onChange={(e) => {
                                                    const maskedValue = maskCPF(e.target.value);
                                                    field.onChange(maskedValue);
                                                }}
                                            />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="animate-spin" /> : 'Continuar'}
                                        {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                                    </Button>
                                </form>
                            </Form>
                        </div>
                    </div>
                     <Carousel className="w-full max-w-full">
                        <CarouselContent>
                            <CarouselItem>
                                <div className="p-1">
                                <Card>
                                    <CardContent className="flex aspect-square items-center justify-center p-0">
                                        <Image
                                            src="https://picsum.photos/seed/hero-banner/600/600"
                                            alt="Banner principal"
                                            width={600}
                                            height={600}
                                            className="mx-auto aspect-square overflow-hidden rounded-xl object-cover w-full h-full"
                                            data-ai-hint="business person smiling"
                                        />
                                    </CardContent>
                                </Card>
                                </div>
                            </CarouselItem>
                        </CarouselContent>
                    </Carousel>
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
