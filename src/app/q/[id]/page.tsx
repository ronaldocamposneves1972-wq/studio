
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError, useDoc } from '@/firebase';
import { doc, collection, query, where, limit, getDoc, arrayUnion, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/logo';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Quiz, Client, ClientDocument, TimelineEvent, WhatsappMessageTemplate } from '@/lib/types';
import { StandaloneQuizForm } from '@/components/quiz/standalone-quiz-form';
import { useForm } from 'react-hook-form';
import { sendWhatsappMessage } from '@/lib/whatsapp';
import Image from 'next/image';

const appName = 'Safecred';
const logoUrl = 'https://ik.imagekit.io/bpsmw0nyu/logo.png';

export default function StandaloneQuizPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const params = useParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const clientId = Array.isArray(params.id) ? params.id[0] : params.id;
  const form = useForm();

  const quizQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'quizzes'), where('slug', '==', 'client_link'), limit(1));
  }, [firestore]);

  const { data: quizzes, isLoading: isLoadingQuiz } = useCollection<Quiz>(quizQuery);
  const quiz = quizzes?.[0];

  const clientRef = useMemoFirebase(() => {
    if (!firestore || !clientId) return null;
    return doc(firestore, 'clients', clientId);
  }, [firestore, clientId]);

  const { data: client, isLoading: isLoadingClient } = useDoc<Client>(clientRef);

  const uploadFile = async (file: File, clientId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientId', clientId);

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
        throw new Error(errorData.error || `Falha no upload de ${file.name}.`);
    }

    return response.json();
  };

  const handleCEPChange = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, '');
    if (cleanedCep.length !== 8) {
      return;
    }

    try {
      const response = await fetch(`/api/cep/${cleanedCep}`);
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'CEP não encontrado ou inválido.');
      }
      
      form.setValue('q-address', data.street);
      form.setValue('q-neighborhood', data.neighborhood);
      form.setValue('q-city', data.city);
      form.setValue('q-state', data.state);
      
      toast({
          title: "Endereço encontrado!",
          description: "Os campos de endereço foram preenchidos automaticamente."
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Não foi possível encontrar o endereço.";
      console.error('Failed to fetch address from CEP:', error);
       toast({
        variant: "destructive",
        title: "CEP inválido",
        description: `Não foi possível encontrar o endereço para este CEP. Por favor, preencha manualmente.`,
      });
      // Re-throw the error to be caught by the caller (handleNext in the form)
      throw error;
    }
  };


  const handleSubmit = async (answers: Record<string, any>) => {
    setIsSubmitting(true);
    toast({ title: 'Enviando respostas e arquivos...', description: 'Por favor, aguarde.' });
    
    if (!firestore || !clientId) {
        toast({ variant: 'destructive', title: 'Erro de Configuração', description: 'Serviço de banco de dados não encontrado.' });
        setIsSubmitting(false);
        return;
    }

    const clientRef = doc(firestore, 'clients', clientId);
    let updatePayload: Record<string, any> = {};

    try {
        const fileUploadPromises: Promise<any>[] = [];
        const nonFileAnswers: Record<string, any> = {};

        for (const key in answers) {
            const value = answers[key];
            if (value instanceof FileList && value.length > 0) {
                 for (let i = 0; i < value.length; i++) {
                    const file = value[i];
                    fileUploadPromises.push(uploadFile(file, clientId));
                }
            } else if (!(value instanceof FileList)) {
                nonFileAnswers[key] = value;
            }
        }
        
        const uploadResults = await Promise.all(fileUploadPromises);

        const now = new Date().toISOString();
        const timelineEvents: TimelineEvent[] = [];

        const newDocuments: ClientDocument[] = uploadResults.map((uploadData) => {
            timelineEvents.push({
                id: `tl-${Date.now()}-${uploadData.id}`,
                activity: `Documento "${uploadData.original_filename}" enviado via link`,
                timestamp: now,
                user: { name: "Cliente" }
            });
            return {
                id: uploadData.id,
                clientId: clientId,
                fileName: uploadData.original_filename,
                fileType: uploadData.resource_type || 'raw',
                secureUrl: uploadData.secure_url,
                uploadedAt: now,
                folder: uploadData.folder,
                validationStatus: 'pending',
            };
        });
        
        if (Object.keys(nonFileAnswers).length > 0) {
             timelineEvents.push({
                id: `tl-${Date.now()}-answers`,
                activity: `Respostas adicionais fornecidas via link`,
                timestamp: now,
                user: { name: "Cliente" }
            });
        }
        
        const clientSnap = await getDoc(clientRef);
        if (!clientSnap.exists()) {
            throw new Error("Documento do cliente não encontrado.");
        }
        const clientData = clientSnap.data() as Client;
        
        updatePayload = {
            answers: { ...clientData.answers, ...nonFileAnswers },
            status: 'Em análise',
        };

        if (newDocuments.length > 0) {
            updatePayload.documents = arrayUnion(...(clientData.documents || []), ...newDocuments);
        }

        if (timelineEvents.length > 0) {
            updatePayload.timeline = arrayUnion(...(clientData.timeline || []), ...timelineEvents);
        }

        await updateDoc(clientRef, updatePayload);
        
        toast({
            title: 'Respostas recebidas!',
            description: 'Seus dados e arquivos foram enviados com sucesso.',
        });
        setIsSubmitted(true);

        if (quiz?.whatsappTemplateId && clientData.name && clientData.phone) {
            const templateRef = doc(firestore, 'whatsapp_templates', quiz.whatsappTemplateId);
            const templateSnap = await getDoc(templateRef);
            if (templateSnap.exists()) {
                const template = templateSnap.data() as WhatsappMessageTemplate;
                await sendWhatsappMessage(template, { clientName: clientData.name, quizLink: window.location.href }, clientData.phone);
                 toast({
                    title: "Notificação enviada!",
                    description: "Uma confirmação foi enviada para o seu WhatsApp."
                });
            }
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Não foi possível processar o envio. Tente novamente.';
        console.error("Quiz Submission Error:", error);
        toast({
            variant: 'destructive',
            title: 'Ops! Algo deu errado.',
            description: errorMessage,
        });

        // Specific handling for permission errors to leverage the debugging system.
        if (error instanceof Error && error.message.includes('permission')) {
             const permissionError = new FirestorePermissionError({
                path: clientRef.path,
                operation: 'update',
                requestResourceData: updatePayload,
             });
            errorEmitter.emit('permission-error', permissionError);
        }
    } finally {
        setIsSubmitting(false);
    }
};
  
  const renderContent = () => {
    if (isLoadingQuiz || isLoadingClient) {
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

    if (isSubmitted || (client && client.documents && client.documents.length > 0)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 text-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h3 className="text-2xl font-bold">Obrigado!</h3>
            <p className="text-muted-foreground">Seus dados e documentos já foram enviados. Nossa equipe entrará em contato em breve.</p>
        </div>
      );
    }
    
    if (quiz && quiz.questions && quiz.questions.length > 0) {
      return <StandaloneQuizForm 
        formContext={form}
        quiz={quiz} 
        onComplete={handleSubmit} 
        isSubmitting={isSubmitting} 
        onCEPChange={handleCEPChange}
      />;
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
            {logoUrl ? (
                <Image src={logoUrl} alt={appName} width={32} height={32} />
            ) : (
                <AppLogo className="h-8 w-auto" />
            )}
            <span className="text-xl font-semibold text-primary">{appName}</span>
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
