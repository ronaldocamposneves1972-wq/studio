
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, updateDocumentNonBlocking, useMemoFirebase, useStorage } from '@/firebase';
import { doc, collection, query, where, limit, getDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/logo';
import { CheckCircle, ChevronRight, ChevronLeft, Upload, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Quiz, Client } from '@/lib/types';


function StandaloneQuizForm({ quiz, clientId, onComplete, isSubmitting }: { quiz: Quiz, clientId: string, onComplete: (answers: any) => void, isSubmitting: boolean }) {
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

  const handleAnswerChange = (questionId: string, value: string | File) => {
    setAnswers({ ...answers, [questionId]: value });
  };
  
  const currentQuestion = quiz.questions[currentStep];

  if (!currentQuestion) {
    return <Skeleton className="w-full h-64" />;
  }

  const renderInput = () => {
    switch(currentQuestion.type) {
        case 'file':
            return (
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <Label htmlFor={currentQuestion.id} className="mt-4 text-lg cursor-pointer text-primary hover:underline">
                        Clique para enviar o arquivo
                    </Label>
                    <Input
                        id={currentQuestion.id}
                        type="file"
                        className="hidden"
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.files ? e.target.files[0] : '')}
                    />
                    {answers[currentQuestion.id] && <p className="mt-2 text-sm text-muted-foreground">Arquivo selecionado: {(answers[currentQuestion.id] as File).name}</p>}
                </div>
            );
        case 'radio':
            return (
                <RadioGroup 
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                    value={answers[currentQuestion.id] || ''}
                    className="space-y-2"
                >
                    {currentQuestion.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${currentQuestion.id}-${index}`} />
                        <Label htmlFor={`${currentQuestion.id}-${index}`}>{option}</Label>
                    </div>
                    ))}
                </RadioGroup>
            );
        default:
            return (
                <Input
                    id={currentQuestion.id}
                    type={currentQuestion.type}
                    value={typeof answers[currentQuestion.id] === 'string' ? answers[currentQuestion.id] : ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="Sua resposta"
                />
            );
    }
  }


  return (
    <div className="space-y-4">
      <Progress value={((currentStep + 1) / totalSteps) * 100} className="w-full" />
       <div className="space-y-2 text-left">
          <h3 className="text-2xl font-bold">{quiz.name}</h3>
          <p className="text-muted-foreground">Passo {currentStep + 1} de {totalSteps}</p>
        </div>

      <div className="space-y-4 py-4 min-h-[200px]">
        <Label htmlFor={currentQuestion.id} className="text-lg">{currentQuestion.text}</Label>
        {renderInput()}
      </div>

      <div className="flex justify-between items-center pt-4">
        {currentStep > 0 ? (
          <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
             <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        ) : <div></div>}
        <Button onClick={handleNext} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? 'Enviando...' : (currentStep === totalSteps - 1 ? 'Finalizar' : 'Continuar')}
          {!isSubmitting && currentStep < totalSteps - 1 && <ChevronRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}


export default function StandaloneQuizPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const params = useParams();
  const firestore = useFirestore();
  const storage = useStorage();
  const clientId = Array.isArray(params.id) ? params.id[0] : params.id;

  const quizQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'quizzes'), where('placement', '==', 'client_link'), limit(1));
  }, [firestore]);

  const { data: quizzes, isLoading: isLoadingQuiz } = useCollection<Quiz>(quizQuery);
  const quiz = quizzes?.[0];

  const uploadFile = async (file: File, clientId: string) => {
    if (!storage) throw new Error("Firebase Storage not available");
    const storageRef = ref(storage, `clients/${clientId}/documents/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return { name: file.name, url: downloadURL };
  };

  const handleSubmit = async (answers: any) => {
    setIsSubmitting(true);

    try {
      if (!firestore || !clientId) throw new Error("Firestore ou ID do cliente não disponível");

      const clientRef = doc(firestore, 'clients', clientId);
      const serializableAnswers: Record<string, any> = {};
      const newDocuments = [];

      for (const key in answers) {
        if (answers[key] instanceof File) {
          const file = answers[key] as File;
          toast({ title: `Enviando ${file.name}...`, description: 'Por favor, aguarde.' });
          const newDoc = await uploadFile(file, clientId);
          newDocuments.push(newDoc);
          serializableAnswers[key] = { name: newDoc.name, url: newDoc.url };
        } else {
          serializableAnswers[key] = answers[key];
        }
      }

      const clientSnap = await getDoc(clientRef);
      const clientData = clientSnap.data() as Client | undefined;
      const existingAnswers = clientData?.answers || {};
      const existingDocuments = clientData?.documents || [];

      const updatePayload: any = {
        answers: { ...existingAnswers, ...serializableAnswers },
        status: 'Em análise',
        documents: [...existingDocuments, ...newDocuments],
      };

      updateDocumentNonBlocking(clientRef, updatePayload);
      
      toast({
        title: 'Respostas recebidas!',
        description: 'Obrigado por enviar seus dados. Em breve nossa equipe continuará o processo.',
      });
      setIsSubmitted(true);

    } catch(error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Ops! Algo deu errado.',
        description: 'Não foi possível enviar suas respostas. Tente novamente.',
      });
    }

    setIsSubmitting(false);
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
            <p className="text-muted-foreground">Seus dados foram enviados com sucesso.</p>
        </div>
      );
    }
    
    if (quiz && quiz.questions && quiz.questions.length > 0) {
      return <StandaloneQuizForm quiz={quiz} clientId={clientId} onComplete={handleSubmit} isSubmitting={isSubmitting} />;
    }

    return (
        <div className="text-center text-muted-foreground py-10">
            <h3 className="text-2xl font-bold text-foreground">Quiz não encontrado</h3>
            <p>O link que você acessou pode estar expirado ou incorreto.</p>
            <p className="text-sm mt-2">Verifique se um quiz com a localização "Link para Cliente" foi criado nas configurações.</p>
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
