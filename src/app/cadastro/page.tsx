
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { addDoc, collection, query, limit, where, arrayUnion } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/logo';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import type { Quiz, TimelineEvent } from '@/lib/types';
import { StandaloneQuizForm } from '@/components/quiz/standalone-quiz-form';

function CadastroContent() {
  const searchParams = useSearchParams();
  const quizSlug = searchParams.get('quiz');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const quizQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const q = quizSlug 
      ? where('slug', '==', quizSlug) 
      : where('placement', '==', 'landing_page');
    return query(collection(firestore, 'quizzes'), q, limit(1));
  }, [firestore, quizSlug]);

  const { data: quizzes, isLoading: isLoadingQuiz } = useCollection<Quiz>(quizQuery);
  const quiz = quizzes?.[0];

  const handleSubmit = async (answers: Record<string, any>) => {
    setIsSubmitting(true);
    
    const now = new Date().toISOString();
    
    const timelineEvent: TimelineEvent = {
        id: `tl-${Date.now()}`,
        activity: `Cliente cadastrado via formulário "${quiz?.name || 'Inicial'}"`,
        timestamp: now,
        user: { name: "Sistema" }
    };

    const newClient: Record<string, any> = {
      status: 'Novo',
      quizId: quiz?.id || null,
      answers: answers,
      createdAt: now,
      timeline: arrayUnion(timelineEvent)
    };

    const fieldMapping: Record<string, string> = {
        'q-name': 'name',
        'q-email': 'email',
        'q-phone': 'phone',
        'q-cpf': 'cpf',
        'q-birthdate': 'birthDate',
        'q-mothername': 'motherName',
        'q-cep': 'cep',
        'q-complement': 'complement',
        'q-neighborhood': 'neighborhood',
        'q-city': 'city',
        'q-state': 'state',
    };

    for (const key in fieldMapping) {
        if (answers[key]) {
            newClient[fieldMapping[key]] = answers[key];
        }
    }

    const addressParts = [answers['q-address'], answers['q-number']].filter(Boolean);
    if (addressParts.length > 0) {
      newClient.address = addressParts.join(', ');
    }


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
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
             <div className="space-y-4 py-4 min-h-[200px]">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="flex justify-between">
                <Skeleton className="h-10 w-24" />
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
    
    if (quiz && quiz.questions && quiz.questions.length > 0) {
       return <StandaloneQuizForm quiz={quiz} onComplete={handleSubmit} isSubmitting={isSubmitting} />;
    }

    return (
        <div className="text-center text-muted-foreground py-10">
            <h3 className="text-2xl font-bold text-foreground">Formulário Indisponível</h3>
            <p>O formulário de cadastro não está disponível no momento. Tente novamente mais tarde.</p>
            <p className="text-sm mt-2">Verifique se um quiz para esta página foi criado e configurado corretamente.</p>
        </div>
    );
  }

  return renderContent();
}

export default function CadastroPage() {
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
        <Card className="w-full max-w-2xl">
            <CardContent className="p-6 md:p-8">
              <Suspense fallback={<div>Carregando...</div>}>
                <CadastroContent />
              </Suspense>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
