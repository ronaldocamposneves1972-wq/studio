
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
    // Here you would typically check if the client exists
    // and redirect them accordingly. For now, we'll just redirect to the general registration.
    console.log('CPF Válido:', data.cpf);
    router.push(`/cadastro?cpf=${data.cpf}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="absolute top-0 left-0 right-0 z-20 px-4 lg:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Link href="/" className="flex items-center gap-2">
                    {logoUrl ? (
                    <Image src={logoUrl} alt={appName} width={32} height={32} />
                    ) : (
                    <AppLogo className="h-8 w-auto text-white" />
                    )}
                    <span className="text-xl font-semibold text-white">{appName}</span>
                </Link>
            </div>
            <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => router.push('/dashboard')}>
                Acessar Painel
            </Button>
      </header>

      <main className="flex-1">
        <section className="relative w-full h-screen flex items-center justify-center">
            {/* Background Image */}
            <Image
                src="https://picsum.photos/seed/hero-banner/1920/1080"
                alt="Banner principal"
                layout="fill"
                objectFit="cover"
                className="z-0"
                data-ai-hint="business meeting"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 z-1"></div>
            
            {/* Content */}
            <div className="relative z-10 text-white text-center p-4 max-w-lg w-full">
                <div className="bg-black/30 backdrop-blur-sm p-8 rounded-xl shadow-2xl">
                    <h1 className="text-2xl font-bold mb-2">Peça seu Cartão de Crédito e sua Conta {appName}</h1>
                    <p className="text-muted-foreground text-white/80 mb-6">Comece agora mesmo. É rápido, fácil e seguro.</p>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="cpf"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="sr-only">Digite seu CPF</FormLabel>
                                    <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="Digite seu CPF"
                                        maxLength={14}
                                        className="h-14 text-center text-lg bg-white/10 border-white/20 focus:bg-white/20 focus:ring-offset-primary"
                                        onChange={(e) => {
                                            const maskedValue = maskCPF(e.target.value);
                                            field.onChange(maskedValue);
                                        }}
                                    />
                                    </FormControl>
                                    <FormMessage className="text-primary-foreground/80" />
                                </FormItem>
                                )}
                            />
                            <Button type="submit" size="lg" className="w-full h-14 text-lg" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Continuar'}
                                {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </section>
      </main>
    </div>
  );
}
