
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, limit, getDoc, arrayUnion } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/logo';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Quiz, Client, ClientDocument } from '@/lib/types';
import { StandaloneQuizForm } from '@/components/quiz/standalone-quiz-form';


export default function StandaloneQuizPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const params = useParams();
  const firestore = useFirestore();
  const clientId = Array.isArray(params.id) ? params.id[0] : params.id;

  const quizQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'quizzes'), where('placement', '==', 'client_link'), limit(1));
  }, [firestore]);

  const { data: quizzes, isLoading: isLoadingQuiz } = useCollection<Quiz>(quizQuery);
  const quiz = quizzes?.[0];

  const uploadFileToCloudinary = async (file: File, clientId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientId', clientId);

    toast({ title: `Enviando ${file.name}...`, description: 'Por favor, aguarde.' });

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
             throw new Error(`O servidor respondeu com status ${response.status}`);
        }
        throw new Error(errorData.error || 'Falha no upload do servidor.');
    }

    return response.json();
  };

  const handleStepFileUpload = async (questionId: string, files: FileList): Promise<boolean> => {
    if (!firestore || !clientId) {
      toast({ variant: 'destructive', title: 'Erro', description: 'ID do cliente ou conexão não disponível.' });
      return false;
    }
    
    const clientRef = doc(firestore, 'clients', clientId);
    const fileUploadPromises = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        fileUploadPromises.push(uploadFileToCloudinary(file, clientId));
    }

    try {
        const uploadResults = await Promise.all(fileUploadPromises);

        const newDocuments: ClientDocument[] = uploadResults.map((uploadData, index) => ({
            id: uploadData.public_id,
            clientId: clientId,
            fileName: uploadData.original_filename || files[index].name,
            fileType: uploadData.resource_type || 'raw',
            cloudinaryPublicId: uploadData.public_id,
            secureUrl: uploadData.secure_url,
            uploadedAt: new Date().toISOString(),
        }));

        if (newDocuments.length > 0) {
            updateDocumentNonBlocking(clientRef, {
                documents: arrayUnion(...newDocuments)
            });
        }
        
        toast({ title: "Arquivo(s) enviado(s)!", description: `${files.length} arquivo(s) foram adicionados com sucesso.`});
        return true;
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Falha no upload de um ou mais arquivos.';
        toast({ variant: 'destructive', title: 'Erro no Upload', description: errorMessage });
        return false;
    }
  }

  const handleSubmit = async (answers: Record<string, any>) => {
    setIsSubmitting(true);
    try {
        if (!firestore || !clientId) {
            throw new Error("Firestore ou ID do cliente não disponível");
        }

        const clientRef = doc(firestore, 'clients', clientId);
        const serializableAnswers: Record<string, any> = {};

        // Filter out any file objects, as they are handled by handleStepFileUpload
        for (const key in answers) {
            if (!(answers[key] instanceof File) && !(answers[key] instanceof FileList)) {
                serializableAnswers[key] = answers[key];
            }
        }
        
        const clientSnap = await getDoc(clientRef);
        if (!clientSnap.exists()) {
            throw new Error("Documento do cliente não encontrado.");
        }
        const clientData = clientSnap.data() as Client;

        const updatePayload: Record<string, any> = {
            answers: { ...clientData.answers, ...serializableAnswers },
            status: 'Em análise',
        };

        updateDocumentNonBlocking(clientRef, updatePayload);

        toast({
            title: 'Respostas recebidas!',
            description: 'Obrigado por enviar seus dados. Em breve nossa equipe continuará o processo.',
        });
        setIsSubmitted(true);

    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Não foi possível enviar suas respostas. Tente novamente.';
        toast({
            variant: 'destructive',
            title: 'Ops! Algo deu errado.',
            description: errorMessage,
        });
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
            <p className="text-muted-foreground">Seus dados foram enviados com sucesso.</p>
        </div>
      );
    }
    
    if (quiz && quiz.questions && quiz.questions.length > 0) {
      return <StandaloneQuizForm quiz={quiz} onComplete={handleSubmit} isSubmitting={isSubmitting} onFileUpload={handleStepFileUpload} />;
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
