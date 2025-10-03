
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, query, limit, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/logo';
import { ArrowRight, CheckCircle, Handshake, Landmark, Phone, User, Mail, ChevronRight, ChevronLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Quiz } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';


function QuizForm({ quiz, onComplete }: { quiz: Quiz, onComplete: (answers: any) => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const totalSteps = quiz.questions.length;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };
  
  const currentQuestion = quiz.questions[currentStep];

  if (!currentQuestion) {
    return <p>Carregando pergunta...</p>;
  }

  return (
    <div className="space-y-4">
      <Progress value={((currentStep + 1) / totalSteps) * 100} className="w-full" />
       <div className="space-y-2 text-left">
          <h3 className="text-2xl font-bold">{quiz.name}</h3>
          <p className="text-muted-foreground">Passo {currentStep + 1} de {totalSteps}</p>
        </div>

      <div className="space-y-4 py-4 min-h-[150px]">
        <Label htmlFor={currentQuestion.id} className="text-lg">{currentQuestion.text}</Label>
        {currentQuestion.type === 'text' && (
          <Input
            id={currentQuestion.id}
            type="text"
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            placeholder="Sua resposta"
          />
        )}
        {currentQuestion.type === 'number' && (
           <Input
            id={currentQuestion.id}
            type="number"
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            placeholder="Digite um número"
          />
        )}
        {currentQuestion.type === 'email' && (
           <Input
            id={currentQuestion.id}
            type="email"
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            placeholder="seu@email.com"
          />
        )}
         {currentQuestion.type === 'tel' && (
           <Input
            id={currentQuestion.id}
            type="tel"
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            placeholder="(99) 99999-9999"
          />
        )}
         {currentQuestion.type === 'radio' && currentQuestion.options && (
          <RadioGroup 
            onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            value={answers[currentQuestion.id] || ''}
            className="space-y-2"
          >
            {currentQuestion.options.map((option, index) => (
               <div key={index} className="flex items-center space-x-2">
                 <RadioGroupItem value={option} id={`${currentQuestion.id}-${index}`} />
                 <Label htmlFor={`${currentQuestion.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )}
      </div>

      <div className="flex justify-between items-center pt-4">
        {currentStep > 0 ? (
          <Button variant="outline" onClick={handleBack}>
             <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        ) : <div></div>}
        <Button onClick={handleNext}>
          {currentStep === totalSteps - 1 ? 'Finalizar' : 'Continuar'}
           <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
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


  const handleSubmit = async (answers: any) => {
    setIsSubmitting(true);

    const newClient = {
      name: answers['q-name'] || 'Novo Cliente',
      email: answers['q-email'] || '',
      phone: answers['q-phone'] || '',
      cpf: answers['q-cpf'] || '',
      birthDate: answers['q-birthdate'] || '',
      motherName: answers['q-mother'] || '',
      cep: answers['q-cep'] || '',
      address: answers['q-address'] || '',
      complement: answers['q-complement'] || '',
      status: 'Novo',
      quizId: quiz?.id,
      answers,
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
    if (isLoadingQuiz || isSubmitting) {
       return (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-40 w-full" />
            <div className="flex justify-between">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
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
      return <QuizForm quiz={quiz} onComplete={handleSubmit} />;
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
        <Card className="w-full max-w-2xl">
            <CardContent className="p-6 md:p-8">
                {renderContent()}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
