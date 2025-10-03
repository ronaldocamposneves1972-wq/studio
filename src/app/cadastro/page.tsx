
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, query, limit, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/logo';
import { CheckCircle, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import type { Quiz } from '@/lib/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { validateCPF, maskCPF, maskPhone, maskDate, maskCEP } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// --- Zod Schema for Validation ---
const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório.").refine(value => value.trim().split(' ').length >= 2, "Por favor, insira o nome completo."),
  cpf: z.string().min(14, "CPF é obrigatório.").refine(validateCPF, "CPF inválido."),
  birthDate: z.string().min(10, "Data de nascimento é obrigatória."),
  phone: z.string().min(14, "Telefone é obrigatório."),
  email: z.string().email("E-mail inválido."),
  motherName: z.string().min(1, "Nome da mãe é obrigatório.").refine(value => value.trim().split(' ').length >= 2, "Por favor, insira o nome completo."),
  cep: z.string().min(9, "CEP é obrigatório."),
  address: z.string().min(1, "Endereço é obrigatório."),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório."),
  city: z.string().min(1, "Cidade é obrigatória."),
  state: z.string().min(1, "Estado é obrigatório."),
  number: z.string().min(1, "Número é obrigatório."),
});

type FormData = z.infer<typeof formSchema>;


export default function CadastroPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const landingPageQuizQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'quizzes'), where('placement', '==', 'landing_page'), limit(1));
  }, [firestore]);

  const { data: quizzes, isLoading: isLoadingQuiz } = useCollection<Quiz>(landingPageQuizQuery);
  const quiz = quizzes?.[0];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      cpf: '',
      birthDate: '',
      phone: '',
      email: '',
      motherName: '',
      cep: '',
      address: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      number: '',
    },
  });

  const handleCEPBlur = useCallback(async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) {
      return;
    }
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();
      if (data.erro) {
        toast({ variant: 'destructive', title: 'CEP não encontrado.' });
        return;
      }
      form.setValue('address', data.logradouro);
      form.setValue('neighborhood', data.bairro);
      form.setValue('city', data.localidade);
      form.setValue('state', data.uf);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao buscar CEP.' });
    }
  }, [form, toast]);


  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    const newClient = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      cpf: data.cpf,
      birthDate: data.birthDate,
      motherName: data.motherName,
      cep: data.cep,
      address: `${data.address}, ${data.number}`,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      status: 'Novo',
      quizId: quiz?.id,
      answers: data, // Save all form data as answers
      createdAt: new Date().toISOString(),
    };

    try {
        if (!firestore) throw new Error("Firestore not available");
        const clientsCollection = collection(firestore, 'clients');
        await addDocumentNonBlocking(clientsCollection, newClient);
        
        toast({
            title: 'Cadastro recebido!',
            description: 'Obrigado por se cadastrar. Em breve nossa equipe entrará em contato.',
        });
        setIsSubmitted(true);
    } catch(error) {
         toast({
            variant: 'destructive',
            title: 'Ops! Algo deu errado.',
            description: 'Não foi possível enviar seu cadastro. Tente novamente.',
        });
    }

    setIsSubmitting(false);
  };
  
  const renderContent = () => {
    if (isLoadingQuiz) {
       return (
          <div className="space-y-4 animate-pulse">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="space-y-4 py-4 min-h-[300px]">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex justify-end">
                <Skeleton className="h-10 w-32" />
            </div>
        </div>
      );
    }

    if (isSubmitted) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 text-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h3 className="text-2xl font-bold">Obrigado!</h3>
            <p className="text-muted-foreground">Seu cadastro foi enviado com sucesso. Nossa equipe entrará em contato em breve.</p>
             <Button asChild><Link href="/">Voltar ao Início</Link></Button>
        </div>
      );
    }
    
    if (quiz) {
      return (
         <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="space-y-2 text-left">
                  <h3 className="text-2xl font-bold">{quiz.name}</h3>
                  <p className="text-muted-foreground">Preencha seus dados para iniciar a simulação.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Nome Completo*</FormLabel>
                          <FormControl><Input placeholder="Seu nome completo" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="cpf" render={({ field }) => (
                      <FormItem>
                          <FormLabel>CPF*</FormLabel>
                          <FormControl><Input placeholder="000.000.000-00" {...field} onChange={e => field.onChange(maskCPF(e.target.value))} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                   <FormField control={form.control} name="birthDate" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Data de Nascimento*</FormLabel>
                          <FormControl><Input placeholder="DD/MM/AAAA" {...field} onChange={e => field.onChange(maskDate(e.target.value))} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                   <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Telefone Celular*</FormLabel>
                          <FormControl><Input placeholder="(99) 99999-9999" {...field} onChange={e => field.onChange(maskPhone(e.target.value))} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                   <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Email*</FormLabel>
                          <FormControl><Input placeholder="seu@email.com" type="email" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                   <FormField control={form.control} name="motherName" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Nome da Mãe*</FormLabel>
                          <FormControl><Input placeholder="Nome completo da sua mãe" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-6">
                    <FormField control={form.control} name="cep" render={({ field }) => (
                      <FormItem>
                          <FormLabel>CEP*</FormLabel>
                          <FormControl><Input placeholder="00000-000" {...field} onChange={e => field.onChange(maskCEP(e.target.value))} onBlur={() => handleCEPBlur(field.value)} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                   <FormField control={form.control} name="state" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl><Input readOnly {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                   <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl><Input readOnly {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                   <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                          <FormLabel>Endereço</FormLabel>
                          <FormControl><Input readOnly {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                   <FormField control={form.control} name="neighborhood" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Bairro</FormLabel>
                          <FormControl><Input readOnly {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                   <FormField control={form.control} name="number" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Número*</FormLabel>
                          <FormControl><Input placeholder="Ex: 123" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="complement" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                          <FormLabel>Complemento</FormLabel>
                          <FormControl><Input placeholder="Apto, Bloco, etc." {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                </div>


                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isSubmitting ? 'Enviando...' : 'Finalizar Cadastro'}
                     <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
            </form>
         </Form>
      );
    }

    return (
        <div className="text-center text-muted-foreground py-10">
            <h3 className="text-2xl font-bold text-foreground">Formulário Indisponível</h3>
            <p>O formulário de cadastro não está disponível no momento. Tente novamente mais tarde.</p>
            <p className="text-sm mt-2">Verifique se um quiz com a localização "Página Inicial" foi criado nas configurações.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40 text-foreground">
      <header className="px-4 lg:px-6 h-16 flex items-center justify-between border-b bg-background">
        <div className="flex items-center gap-2">
          <AppLogo className="h-8 w-auto" />
          <span className="text-xl font-semibold">ConsorciaTech</span>
        </div>
        <Button variant="ghost" asChild>
            <Link href="/">Voltar</Link>
        </Button>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
            <CardContent className="p-6 md:p-8">
                {renderContent()}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
