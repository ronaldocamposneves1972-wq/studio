
'use client';

import { useState, useCallback } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { addDoc, collection, query, limit, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/logo';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import type { Quiz } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { validateCPF, maskCPF, maskPhone, maskDate, maskCEP } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// --- Zod Schema for Validation ---
const formSchema = z.object({
  'q-name': z.string().min(1, "Nome é obrigatório.").refine(value => value.trim().split(' ').length >= 2, "Por favor, insira o nome completo."),
  'q-cpf': z.string().min(14, "CPF é obrigatório.").refine(validateCPF, "CPF inválido."),
  'q-birthdate': z.string().min(10, "Data de nascimento é obrigatória."),
  'q-phone': z.string().min(14, "Telefone é obrigatório."),
  'q-email': z.string().email("E-mail inválido."),
  'q-mothername': z.string().min(1, "Nome da mãe é obrigatório.").refine(value => value.trim().split(' ').length >= 2, "Por favor, insira o nome completo da mãe."),
  'q-cep': z.string().min(9, "CEP é obrigatório."),
  'q-address': z.string().min(1, "Endereço é obrigatório."),
  'q-complement': z.string().optional(),
  'q-neighborhood': z.string().min(1, "Bairro é obrigatório."),
  'q-city': z.string().min(1, "Cidade é obrigatória."),
  'q-state': z.string().min(1, "Estado é obrigatório."),
  'q-number': z.string().min(1, "Número é obrigatório."),
});

type FormData = z.infer<typeof formSchema>;

const getMaskFunction = (questionId: string) => {
    switch (questionId) {
        case 'q-cpf': return maskCPF;
        case 'q-phone': return maskPhone;
        case 'q-birthdate': return maskDate;
        case 'q-cep': return maskCEP;
        default: return (value: string) => value;
    }
}


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
      'q-name': '',
      'q-cpf': '',
      'q-birthdate': '',
      'q-phone': '',
      'q-email': '',
      'q-mothername': '',
      'q-cep': '',
      'q-address': '',
      'q-complement': '',
      'q-neighborhood': '',
      'q-city': '',
      'q-state': '',
      'q-number': '',
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
      form.setValue('q-address', data.logradouro);
      form.setValue('q-neighborhood', data.bairro);
      form.setValue('q-city', data.localidade);
      form.setValue('q-state', data.uf);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao buscar CEP.' });
    }
  }, [form, toast]);


  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    // Convert answers to a Client-like structure
    const newClient = {
      name: data['q-name'],
      email: data['q-email'],
      phone: data['q-phone'],
      cpf: data['q-cpf'],
      birthDate: data['q-birthdate'],
      motherName: data['q-mothername'],
      cep: data['q-cep'],
      address: `${data['q-address']}, ${data['q-number']}`,
      complement: data['q-complement'],
      neighborhood: data['q-neighborhood'],
      city: data['q-city'],
      state: data['q-state'],
      status: 'Novo',
      quizId: quiz?.id,
      answers: data, // Save all raw form data
      createdAt: new Date().toISOString(),
    };

    try {
        if (!firestore) throw new Error("Firestore not available");
        const clientsCollection = collection(firestore, 'clients');
        await addDoc(clientsCollection, newClient);
        
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
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
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
      const personalDataQuestions = quiz.questions.filter(q => !['q-cep', 'q-address', 'q-neighborhood', 'q-city', 'q-state', 'q-number', 'q-complement'].includes(q.id));
      const addressQuestions = quiz.questions.filter(q => ['q-cep', 'q-address', 'q-neighborhood', 'q-city', 'q-state', 'q-number', 'q-complement'].includes(q.id));
      
      const getFieldProps = (qId: string) => {
        const isReadOnly = ['q-address', 'q-neighborhood', 'q-city', 'q-state'].includes(qId);
        let onBlur, onChange;

        if (qId === 'q-cep') {
            onBlur = () => handleCEPBlur(form.getValues('q-cep'));
        }
        
        const mask = getMaskFunction(qId);
        onChange = (e: React.ChangeEvent<HTMLInputElement>) => form.setValue(qId as keyof FormData, mask(e.target.value));

        return { isReadOnly, onBlur, onChange };
      };

      return (
         <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                <div className="space-y-2 text-left">
                  <h3 className="text-2xl font-bold">{quiz.name}</h3>
                  <p className="text-muted-foreground">Preencha seus dados para iniciar a simulação.</p>
                </div>

                <div>
                    <h4 className="text-lg font-semibold mb-4">Dados Pessoais</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {personalDataQuestions.map(question => {
                        const { onChange } = getFieldProps(question.id);
                        return (
                        <FormField
                            key={question.id}
                            control={form.control}
                            name={question.id as keyof FormData}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{question.text}</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field}
                                            onChange={(e) => {
                                                onChange(e); // Apply mask
                                                field.onChange(e); // Notify react-hook-form
                                            }}
                                            placeholder={question.text.replace('*','')} 
                                            type={question.type}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        )
                    })}
                    </div>
                </div>
                
                <div>
                    <h4 className="text-lg font-semibold mb-4 border-t pt-6">Endereço</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {quiz.questions.find(q => q.id === 'q-cep') && (
                            <FormField
                                control={form.control}
                                name="q-cep"
                                render={({ field }) => {
                                    const { onBlur, onChange } = getFieldProps('q-cep');
                                    return (
                                        <FormItem className="md:col-span-1">
                                            <FormLabel>CEP*</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    {...field}
                                                    onChange={(e) => {
                                                        onChange(e);
                                                        field.onChange(e);
                                                    }}
                                                    onBlur={onBlur}
                                                    placeholder="00000-000"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )
                                }}
                            />
                        )}
                        {quiz.questions.find(q => q.id === 'q-state') && (
                             <FormField
                                control={form.control}
                                name="q-state"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-1">
                                        <FormLabel>Estado</FormLabel>
                                        <FormControl><Input readOnly {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                         {quiz.questions.find(q => q.id === 'q-city') && (
                             <FormField
                                control={form.control}
                                name="q-city"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Cidade</FormLabel>
                                        <FormControl><Input readOnly {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                         {quiz.questions.find(q => q.id === 'q-address') && (
                            <FormField
                                control={form.control}
                                name="q-address"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Endereço</FormLabel>
                                        <FormControl><Input readOnly {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                         )}
                         {quiz.questions.find(q => q.id === 'q-neighborhood') && (
                            <FormField
                                control={form.control}
                                name="q-neighborhood"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Bairro</FormLabel>
                                        <FormControl><Input readOnly {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                         {quiz.questions.find(q => q.id === 'q-number') && (
                           <FormField
                                control={form.control}
                                name="q-number"
                                render={({ field }) => (
                                <FormItem className="md:col-span-1">
                                    <FormLabel>Número*</FormLabel>
                                    <FormControl><Input placeholder="Ex: 123" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        )}
                        {quiz.questions.find(q => q.id === 'q-complement') && (
                          <FormField
                                control={form.control}
                                name="q-complement"
                                render={({ field }) => (
                                <FormItem className="md:col-span-3">
                                    <FormLabel>Complemento</FormLabel>
                                    <FormControl><Input placeholder="Apto, Bloco, etc." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        )}
                    </div>
                </div>


                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isSubmitting ? 'Enviando...' : 'Finalizar Cadastro'}
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

