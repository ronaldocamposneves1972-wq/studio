'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/logo';
import { ArrowRight, CheckCircle, Handshake, Landmark, Phone, User, Mail, ChevronRight, ChevronLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Quiz } from '@/lib/types';


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

  // This check prevents rendering if questions are not yet available.
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


export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();

  const firstQuizQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'quizzes'), limit(1));
  }, [firestore]);

  const { data: quizzes, isLoading: isLoadingQuiz } = useCollection<Quiz>(firstQuizQuery);
  const quiz = quizzes?.[0];


  const handleSubmit = async (answers: any) => {
    setIsLoading(true);

    const newClient = {
      firstName: answers['q-name']?.split(' ')[0] || 'Novo',
      lastName: answers['q-name']?.split(' ').slice(1).join(' ') || 'Cliente',
      email: answers['q-email'] || '',
      phone: answers['q-phone'] || '',
      status: 'Novo',
      quizId: quiz?.id,
      answers,
      createdAt: new Date().toISOString(),
    };

    try {
        const clientsCollection = collection(firestore, 'clients');
        await addDocumentNonBlocking(clientsCollection, newClient);
        
        toast({
            title: 'Simulação recebida!',
            description: 'Obrigado por preencher. Em breve nossa equipe entrará em contato.',
        });
        setIsSubmitted(true);
    } catch(error) {
         toast({
            variant: 'destructive',
            title: 'Ops! Algo deu errado.',
            description: 'Não foi possível enviar sua simulação. Tente novamente.',
        });
    }


    setIsLoading(false);
  };
  
  const renderQuizContent = () => {
    if (isLoadingQuiz) {
      return <p>Carregando simulação...</p>;
    }

    if (isSubmitted) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h3 className="text-2xl font-bold">Obrigado!</h3>
            <p className="text-muted-foreground">Sua simulação foi enviada com sucesso. Nossa equipe entrará em contato em breve.</p>
            <Button onClick={() => setIsSubmitted(false)}>Voltar ao Início</Button>
        </div>
      );
    }
    
    // Ensure quiz and quiz.questions are valid before rendering the form
    if (quiz && quiz.questions && quiz.questions.length > 0) {
      return <QuizForm quiz={quiz} onComplete={handleSubmit} />;
    }

    return <p>Nenhum formulário de simulação disponível no momento.</p>;
  }

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
            <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_600px]">
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
              <div className="mx-auto w-full max-w-lg space-y-4 rounded-lg bg-background p-6 shadow-lg text-center">
                {renderQuizContent()}
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
