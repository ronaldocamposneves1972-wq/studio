
'use client'

import Image from "next/image"
import Link from "next/link"
import {
  ChevronLeft,
  Copy,
  CreditCard,
  ListFilter,
  MoreVertical,
  Truck,
  Upload,
  User,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Activity,
  Link2,
  Trash2,
  Pencil,
  Info,
  Download,
  FileText,
  Loader2,
  Check,
  Eye,
  MoreHorizontal,
  PlusCircle,
  FileWarning
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useParams } from 'next/navigation'


import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import type { Client, ClientStatus, TimelineEvent, Proposal, ClientDocument, DocumentStatus, ProposalStatus, ProposalSummary } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDoc, useFirestore, useMemoFirebase, useUser, updateDocumentNonBlocking, useCollection } from "@/firebase"
import { doc, arrayUnion, arrayRemove, updateDoc, deleteDoc, collection, addDoc, serverTimestamp, query, where, writeBatch } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ProposalDialog } from "@/components/dashboard/proposal-dialog"


const getStatusVariant = (status: ClientStatus) => {
  switch (status) {
    case 'Aprovado':
      return 'default';
    case 'Reprovado':
      return 'destructive';
    case 'Em análise':
      return 'secondary';
    case 'Pendente':
      return 'outline';
    default:
      return 'secondary';
  }
}

const getProposalStatusVariant = (status: ProposalStatus) => {
  switch (status) {
    case 'Finalizada':
      return 'default';
    case 'Cancelada':
      return 'destructive';
    case 'Em negociação':
      return 'secondary';
    case 'Aberta':
    default:
      return 'outline';
  }
}

const getTimelineIcon = (activity: string) => {
    if (activity.toLowerCase().includes('proposta')) return <FileText className="h-4 w-4 text-muted-foreground" />;
    if (activity.toLowerCase().includes('documentos')) return <Upload className="h-4 w-4 text-muted-foreground" />;
    if (activity.toLowerCase().includes('quiz')) return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    if (activity.toLowerCase().includes('cadastrado')) return <User className="h-4 w-4 text-muted-foreground" />;
    return <Activity className="h-4 w-4 text-muted-foreground" />;
}

const Timeline = ({ events }: { events?: TimelineEvent[] }) => {
    if (!events || events.length === 0) {
        return <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
    }

    const sortedEvents = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="space-y-8">
            {sortedEvents.map((event) => (
                <div key={event.id} className="flex items-start">
                    <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            {getTimelineIcon(event.activity)}
                        </div>
                    </div>
                    <div className="ml-4">
                        <p className="font-medium text-sm">{event.activity}</p>
                        {event.details && <p className="text-sm text-muted-foreground">{event.details}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                            {new Date(event.timestamp).toLocaleString('pt-BR')} por {event.user?.name || 'Sistema'}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};


export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [quizLink, setQuizLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<ClientDocument | null>(null);
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const link = `${window.location.origin}/q/${clientId}`;
      setQuizLink(link);
    }
  }, [clientId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(quizLink).then(() => {
      setIsCopied(true);
      toast({ title: 'Link copiado!', description: 'O link do quiz foi copiado para a área de transferência.' });
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    });
  };

  const clientRef = useMemoFirebase(() => {
    if (!firestore || !clientId) return null
    return doc(firestore, 'clients', clientId)
  }, [firestore, clientId])

  const { data: client, isLoading: isLoadingClient, error } = useDoc<Client>(clientRef);

  const proposals = client?.proposals || [];
  const isLoadingProposals = isLoadingClient;


  const handleStatusChange = async (newStatus: ClientStatus) => {
    if (!clientRef || !user) return;

    const timelineEvent: TimelineEvent = {
        id: `tl-${Date.now()}`,
        activity: `Status alterado para "${newStatus}"`,
        timestamp: new Date().toISOString(),
        user: { name: user.displayName || user.email || "Usuário", avatarUrl: user.photoURL || '' }
    };
    
    try {
      await updateDoc(clientRef, { status: newStatus, timeline: arrayUnion(timelineEvent) });
      toast({
        title: "Status atualizado!",
        description: `O status do cliente foi alterado para ${newStatus}.`,
      })
    } catch(e) {
        console.error(e)
        toast({
            variant: "destructive",
            title: "Erro ao atualizar",
            description: "Não foi possível atualizar o status."
        })
    }
  }
  
  const handleDeleteClient = async () => {
    if (!clientRef) return;
    try {
        await deleteDoc(clientRef);
        toast({
        title: "Cliente excluído!",
        description: "O cliente foi removido com sucesso.",
        });
        router.push('/dashboard/clients');
    } catch(e) {
        console.error(e)
        toast({
            variant: "destructive",
            title: "Erro ao excluir",
            description: "Não foi possível excluir o cliente."
        })
    }
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !clientId || !clientRef || !user) return;

    setIsUploading(true);
    toast({ title: 'Enviando arquivo...', description: 'Por favor, aguarde.' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', clientId);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        let errorData;
        try {
            errorData = await uploadResponse.json();
        } catch (e) {
             throw new Error(`O servidor respondeu com status ${uploadResponse.status}`);
        }
        throw new Error(errorData.error || 'Falha no upload do servidor.');
      }

      const uploadData = await uploadResponse.json();

      const newDocument: ClientDocument = {
        id: uploadData.public_id,
        clientId: clientId,
        fileName: uploadData.original_filename || file.name,
        fileType: uploadData.resource_type || 'raw',
        cloudinaryPublicId: uploadData.public_id,
        secureUrl: uploadData.secure_url,
        uploadedAt: new Date().toISOString(),
        validationStatus: 'pending',
      };
      
      const timelineEvent: TimelineEvent = {
        id: `tl-${Date.now()}`,
        activity: `Documento "${file.name}" enviado`,
        details: `Tipo: ${uploadData.resource_type}`,
        timestamp: new Date().toISOString(),
        user: { name: user.displayName || user.email || 'Usuário', avatarUrl: user.photoURL || '' },
      };

      await updateDoc(clientRef, {
        documents: arrayUnion(newDocument),
        timeline: arrayUnion(timelineEvent)
      });

      toast({
        title: 'Arquivo enviado!',
        description: `${file.name} foi adicionado com sucesso.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no Upload',
        description: error instanceof Error ? error.message : 'Não foi possível enviar o arquivo.',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteDocument = async (docToDelete: ClientDocument) => {
    if (!clientRef || !client?.documents) return;

    try {
        const response = await fetch('/api/upload', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              public_id: docToDelete.cloudinaryPublicId,
              resource_type: docToDelete.fileType
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao deletar arquivo no Cloudinary.');
        }

        const updatedDocuments = client.documents.filter(doc => doc.id !== docToDelete.id);
        await updateDoc(clientRef, {
            documents: updatedDocuments
        });

        toast({
            title: "Documento excluído",
            description: `${docToDelete.fileName} foi removido com sucesso.`
        });

    } catch (error) {
        console.error("Error deleting document:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Excluir",
            description: error instanceof Error ? error.message : "Não foi possível excluir o documento.",
        });
    }
  }

  const handleValidationStatusChange = async (docToUpdate: ClientDocument, newStatus: DocumentStatus) => {
    if (!clientRef || !client?.documents || !user) return;
    try {
        const now = new Date().toISOString();
        const updatedDocuments = client.documents.map(doc =>
            doc.id === docToUpdate.id ? { 
                ...doc, 
                validationStatus: newStatus, 
                statusUpdatedAt: now,
                validatedAt: newStatus !== 'pending' ? now : doc.validatedAt,
                validatedBy: newStatus !== 'pending' ? (user.displayName || user.email || 'Sistema') : doc.validatedBy,
            } : doc
        );
        
        const timelineEvent: TimelineEvent = {
            id: `tl-${Date.now()}`,
            activity: `Documento "${docToUpdate.fileName}" ${newStatus === 'validated' ? 'validado' : newStatus === 'rejected' ? 'rejeitado' : 'marcado como pendente'}.`,
            timestamp: now,
            user: { name: user.displayName || user.email || 'Usuário', avatarUrl: user.photoURL || '' },
        };

        await updateDoc(clientRef, {
            documents: updatedDocuments,
            timeline: arrayUnion(timelineEvent)
        });
        toast({
            title: `Status do documento atualizado para ${newStatus}.`,
            description: `${docToUpdate.fileName} foi atualizado.`
        });
    } catch(e) {
        console.error(e)
        toast({
            variant: "destructive",
            title: "Erro ao atualizar",
            description: "Não foi possível atualizar o status de validação."
        })
    }
  }
  
  const handleDownload = (doc: ClientDocument) => {
    const link = document.createElement('a');
    link.href = doc.secureUrl;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const translatedLabels: { [key: string]: string } = {
    'name': 'Nome', 'email': 'Email', 'phone': 'Telefone', 'cpf': 'CPF', 'birthdate': 'Data de Nascimento',
    'mothername': 'Nome da Mãe', 'cep': 'CEP', 'address': 'Endereço', 'complement': 'Complemento', 'number': 'Número',
    'neighborhood': 'Bairro', 'city': 'Cidade', 'state': 'Estado',
  };

  const fieldOrder = ['name', 'cpf', 'birthdate', 'phone', 'email', 'mothername', 'cep', 'address', 'number', 'complement', 'neighborhood', 'city', 'state'];
    
    const handleViewDocument = (doc: ClientDocument) => {
       setViewingDocument(doc);
    };

    const handleInitiateDocumentation = async () => {
        if (!clientRef || !user) return;
        
        const timelineEvent: TimelineEvent = {
            id: `tl-${Date.now()}`,
            activity: `Status alterado para "Em análise"`,
            details: "Iniciada a coleta de documentos.",
            timestamp: new Date().toISOString(),
            user: { name: user.displayName || user.email || "Usuário", avatarUrl: user.photoURL || '' }
        };

        await updateDoc(clientRef, { status: 'Em análise', timeline: arrayUnion(timelineEvent) });
        
        toast({
            title: "Cliente movido para Documentação",
            description: `${client?.name} agora está na etapa de coleta de documentos.`
        });
        router.push('/dashboard/pipeline/Documentacao');
    };

    const handleSendToCreditAnalysis = async () => {
        if (!clientRef || !user || !client) return;
        
        const timelineEvent: TimelineEvent = {
            id: `tl-${Date.now()}`,
            activity: `Status alterado para "Pendente"`,
            details: "Aguardando análise e geração de propostas.",
            timestamp: new Date().toISOString(),
            user: { name: user.displayName || user.email || "Usuário", avatarUrl: user.photoURL || '' }
        };

        await updateDoc(clientRef, { status: 'Pendente', timeline: arrayUnion(timelineEvent) });
        
        toast({
            title: "Enviado para Análise de Crédito",
            description: `${client?.name} está na etapa de cotação de valor.`
        });
        router.push('/dashboard/pipeline/valor');
    };

    const handleSaveProposal = async (data: any) => {
        if (!firestore || !user || !client || !clientRef) return;
    
        const batch = writeBatch(firestore);
    
        try {
            // 1. Create the main proposal document in 'sales_proposals'
            const proposalCollection = collection(firestore, 'sales_proposals');
            const newProposalRef = doc(proposalCollection); // Create a reference with a new ID
    
            const newProposalData: Proposal = {
                id: newProposalRef.id,
                ...data,
                clientId: client.id,
                clientName: client.name,
                salesRepId: user.uid,
                salesRepName: user.displayName || user.email,
                createdAt: new Date().toISOString(),
                status: 'Aberta'
            };
            batch.set(newProposalRef, newProposalData);
    
            // 2. Create the summary to be denormalized into the client document
            const proposalSummary: ProposalSummary = {
                id: newProposalRef.id,
                productName: data.productName,
                value: data.value,
                status: 'Aberta'
            };
    
            // 3. Create the timeline event
            const timelineEvent: TimelineEvent = {
                id: `tl-${Date.now()}-proposal`,
                activity: `Nova proposta "${data.productName}" criada.`,
                details: `Valor: R$ ${data.value.toLocaleString('pt-br')}`,
                timestamp: new Date().toISOString(),
                user: { name: user.displayName || user.email || "Usuário", avatarUrl: user.photoURL || '' }
            };
    
            // 4. Update the client document with the proposal summary and timeline event
            batch.update(clientRef, {
                proposals: arrayUnion(proposalSummary),
                timeline: arrayUnion(timelineEvent)
            });
    
            // 5. Commit all writes at once
            await batch.commit();
    
            toast({
                title: "Proposta criada!",
                description: "A nova proposta foi adicionada ao cliente."
            });
            setIsProposalDialogOpen(false);
    
        } catch (error) {
            console.error("Error saving proposal:", error);
            toast({
                variant: "destructive",
                title: "Erro ao salvar proposta",
                description: "Ocorreu um erro ao tentar salvar a nova proposta."
            });
        }
    };


  if (isLoadingClient) {
     return (
       <div className="grid flex-1 items-start gap-4 md:gap-8">
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="grid gap-2">
                           <Skeleton className="h-6 w-48" />
                           <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-96 w-full" />
            </CardContent>
        </Card>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-[80vh]">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">Cliente não encontrado</h3>
          <p className="text-sm text-muted-foreground">O cliente que você está procurando não existe ou foi excluído.</p>
           {error && <p className="text-xs text-destructive mt-2">{error.message}</p>}
          <Button className="mt-4" asChild>
            <Link href="/dashboard/clients">Voltar para Clientes</Link>
          </Button>
        </div>
      </div>
    )
  }

  const documents = client.documents || [];
  const isViewingImage = viewingDocument && (viewingDocument.fileType.startsWith('image'));
  const allDocumentsValidated = documents.length > 0 && documents.every(doc => doc.validationStatus === 'validated');


  return (
    <>
      <ProposalDialog
          open={isProposalDialogOpen}
          onOpenChange={setIsProposalDialogOpen}
          onSave={handleSaveProposal}
          client={client}
      />
      <Dialog open={!!viewingDocument} onOpenChange={(open) => !open && setViewingDocument(null)}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>{viewingDocument?.fileName}</DialogTitle>
            <DialogDescription>
                 Visualizando documento. <a onClick={() => handleDownload(viewingDocument!)} className="text-primary hover:underline cursor-pointer">Fazer download</a>.
            </DialogDescription>
          </DialogHeader>
          <div className="h-full w-full relative bg-muted flex items-center justify-center">
            {isViewingImage ? (
              <Image src={viewingDocument.secureUrl} alt={viewingDocument.fileName} layout="fill" objectFit="contain" />
            ) : (
                 <div className="text-center p-8">
                    <FileText className="h-24 w-24 mx-auto text-muted-foreground" />
                    <p className="mt-4 text-lg font-semibold">Pré-visualização não disponível.</p>
                    <p className="text-muted-foreground">Este tipo de arquivo não pode ser exibido. Use a opção de download.</p>
                </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <div className="grid flex-1 auto-rows-max items-start gap-4 lg:grid-cols-3 lg:gap-8">
          <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-3">
              <Card>
                  <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                              <Image alt="Avatar do Cliente" className="aspect-square rounded-full object-cover" height="64" src={`https://picsum.photos/seed/${client.id}/100/100`} width="64" data-ai-hint="person portrait" />
                              <div className="grid gap-1">
                                  <CardTitle className="text-2xl">{client.name}</CardTitle>
                                  <CardDescription>{client.email} &middot; {client.phone}</CardDescription>
                              </div>
                          </div>
                          <div className="flex items-center gap-2">
                              <Select onValueChange={(val) => handleStatusChange(val as ClientStatus)} value={client.status}>
                                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="Novo">Novo</SelectItem>
                                      <SelectItem value="Em análise">Em análise</SelectItem>
                                      <SelectItem value="Pendente">Pendente</SelectItem>
                                      <SelectItem value="Aprovado">Aprovado</SelectItem>
                                      <SelectItem value="Reprovado">Reprovado</SelectItem>
                                  </SelectContent>
                              </Select>
                               <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button size="icon" variant="outline"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" /> Editar Cliente</DropdownMenuItem>
                                   <DropdownMenuSeparator />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Excluir Cliente
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>Esta ação não pode ser desfeita. Isso irá deletar permanentemente o cliente <strong>{client.name}</strong>.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                          Sim, excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                          </div>
                      </div>
                  </CardHeader>
                  <CardContent>
                     <Tabs defaultValue="quiz">
                      <TabsList className="mb-4">
                        <TabsTrigger value="quiz">Ficha Inicial</TabsTrigger>
                        <TabsTrigger value="documents">Documentos</TabsTrigger>
                        <TabsTrigger value="history">Histórico</TabsTrigger>
                        <TabsTrigger value="proposals">Propostas</TabsTrigger>
                      </TabsList>
                       <TabsContent value="quiz">
                          <Card>
                              <CardHeader>
                                  <CardTitle>Respostas do Cadastro Inicial</CardTitle>
                                  <CardDescription>Respostas fornecidas pelo cliente no formulário de qualificação.</CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {client.answers ? (
                                  <>
                                    {fieldOrder.map((fieldKey) => {
                                      const answerKey = `q-${fieldKey.toLowerCase().replace(' ', '')}`;
                                      const value = client.answers![answerKey];
                                      if (value === undefined) return null;
                                      const questionLabel = translatedLabels[fieldKey.toLowerCase() as keyof typeof translatedLabels] || fieldKey;
                                      return (
                                        <div className="grid grid-cols-[150px_1fr] gap-2 items-center" key={fieldKey}>
                                          <p className="font-medium text-sm text-muted-foreground">{questionLabel}</p>
                                          <p className="text-foreground">{String(value) || "Não informado"}</p>
                                        </div>
                                      );
                                    })}
                                    {client.createdAt && (
                                      <div className="grid grid-cols-[150px_1fr] gap-2 items-center border-t pt-4 mt-4">
                                        <p className="font-medium text-sm text-muted-foreground">Data do Cadastro</p>
                                        <p className="text-foreground">{new Date(client.createdAt).toLocaleString('pt-BR')}</p>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-muted-foreground">Nenhuma resposta do quiz encontrada.</p>
                                )}
                              </CardContent>
                               {client.status === 'Novo' && (
                                  <CardFooter className="border-t px-6 py-4 flex justify-end">
                                      <Button onClick={handleInitiateDocumentation}>
                                          <Send className="h-4 w-4 mr-2" />
                                          Iniciar Coleta de Documentos
                                      </Button>
                                  </CardFooter>
                              )}
                              {client.quizId && ! (client.status === 'Novo') && (
                              <CardFooter className="border-t px-6 py-4">
                                  <p className="text-sm text-muted-foreground">Quiz ID: <span className="font-mono text-primary">{client.quizId}</span></p>
                              </CardFooter>
                              )}
                          </Card>
                      </TabsContent>
                      <TabsContent value="history">
                         <Card>
                             <CardHeader><CardTitle>Linha do Tempo</CardTitle></CardHeader>
                             <CardContent><Timeline events={client.timeline} /></CardContent>
                         </Card>
                      </TabsContent>
                      <TabsContent value="documents">
                        <Card>
                          <CardHeader>
                            <CardTitle>Documentos</CardTitle>
                            <CardDescription>Gerencie os documentos enviados pelo cliente para análise.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                              {documents.length === 0 && (
                                  <div className={cn(
                                      "flex flex-col items-center justify-center text-center gap-4 min-h-60 rounded-lg border-2 border-dashed p-6"
                                  )}>
                                      <Upload className="h-12 w-12 text-muted-foreground" />
                                      <h3 className="text-xl font-semibold">Nenhum documento enviado</h3>
                                      <p className="text-muted-foreground">Envie um link para o cliente ou adicione arquivos manualmente.</p>
                                  </div>
                              )}
                              {documents.length > 0 && (
                                   <Table>
                                      <TableHeader>
                                          <TableRow>
                                          <TableHead>Nome do Arquivo</TableHead>
                                          <TableHead>Status</TableHead>
                                          <TableHead>Data de Envio</TableHead>
                                          <TableHead>Data de Validação</TableHead>
                                          <TableHead>Validado Por</TableHead>
                                          <TableHead className="text-right">Ações</TableHead>
                                          </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                          {documents.map((doc) => {
                                             const status = doc.validationStatus || 'pending';
                                             let statusBadge;
                                             switch (status) {
                                                  case 'validated':
                                                      statusBadge = <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="h-4 w-4 mr-1" /> Validado</Badge>;
                                                      break;
                                                  case 'rejected':
                                                      statusBadge = <Badge variant="destructive"><XCircle className="h-4 w-4 mr-1" /> Rejeitado</Badge>;
                                                      break;
                                                  case 'pending':
                                                  default:
                                                      statusBadge = <Badge variant="secondary"><Clock className="h-4 w-4 mr-1" /> Pendente</Badge>;
                                                      break;
                                             }
                                             
                                             const oneHour = 60 * 60 * 1000;
                                             const isFinalStatus = doc.validationStatus === 'validated' || doc.validationStatus === 'rejected';
                                             const isLocked = isFinalStatus && doc.statusUpdatedAt && (new Date().getTime() - new Date(doc.statusUpdatedAt).getTime()) > oneHour;
                                             
                                             const canValidate = !isLocked && status !== 'validated';
                                             const canReject = !isLocked && status !== 'rejected';
                                             const canMarkPending = isFinalStatus && !isLocked;

                                             return (
                                              <TableRow key={doc.id}>
                                                  <TableCell className="font-medium flex items-center gap-2">
                                                      <FileText className="h-4 w-4 text-muted-foreground" />
                                                      {doc.fileName}
                                                  </TableCell>
                                                  <TableCell>{statusBadge}</TableCell>
                                                  <TableCell>{new Date(doc.uploadedAt).toLocaleString('pt-BR')}</TableCell>
                                                  <TableCell>{doc.validatedAt ? new Date(doc.validatedAt).toLocaleString('pt-BR') : '—'}</TableCell>
                                                  <TableCell>{doc.validatedBy || '—'}</TableCell>

                                                  <TableCell className="text-right">
                                                      <DropdownMenu>
                                                          <DropdownMenuTrigger asChild>
                                                              <Button size="icon" variant="ghost">
                                                                  <MoreHorizontal className="h-4 w-4" />
                                                              </Button>
                                                          </DropdownMenuTrigger>
                                                          <DropdownMenuContent>
                                                              <DropdownMenuItem onSelect={() => handleViewDocument(doc)}>
                                                                  <Eye className="mr-2 h-4 w-4" />
                                                                  Ver
                                                              </DropdownMenuItem>
                                                               <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                                                  <Download className="mr-2 h-4 w-4" />
                                                                  Baixar
                                                               </DropdownMenuItem>
                                                              <DropdownMenuSeparator />

                                                              <AlertDialog>
                                                                  <AlertDialogTrigger asChild>
                                                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={!canValidate}>
                                                                          <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                          Validar
                                                                      </DropdownMenuItem>
                                                                  </AlertDialogTrigger>
                                                                  <AlertDialogContent>
                                                                      <AlertDialogHeader>
                                                                          <AlertDialogTitle>Confirmar Validação?</AlertDialogTitle>
                                                                          <AlertDialogDescription>
                                                                              Você tem certeza de que deseja marcar o documento <strong>{doc.fileName}</strong> como validado?
                                                                          </AlertDialogDescription>
                                                                      </AlertDialogHeader>
                                                                      <AlertDialogFooter>
                                                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                          <AlertDialogAction onClick={() => handleValidationStatusChange(doc, 'validated')}>Sim, validar</AlertDialogAction>
                                                                      </AlertDialogFooter>
                                                                  </AlertDialogContent>
                                                              </AlertDialog>

                                                              <AlertDialog>
                                                                  <AlertDialogTrigger asChild>
                                                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={!canReject} className="text-destructive focus:text-destructive">
                                                                          <XCircle className="mr-2 h-4 w-4" />
                                                                          Rejeitar
                                                                      </DropdownMenuItem>
                                                                  </AlertDialogTrigger>
                                                                  <AlertDialogContent>
                                                                      <AlertDialogHeader>
                                                                          <AlertDialogTitle>Confirmar Rejeição?</AlertDialogTitle>
                                                                          <AlertDialogDescription>
                                                                              Você tem certeza de que deseja rejeitar o documento <strong>{doc.fileName}</strong>?
                                                                          </AlertDialogDescription>
                                                                      </AlertDialogHeader>
                                                                      <AlertDialogFooter>
                                                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                          <AlertDialogAction onClick={() => handleValidationStatusChange(doc, 'rejected')} className="bg-destructive hover:bg-destructive/90">Sim, rejeitar</AlertDialogAction>
                                                                      </AlertDialogFooter>
                                                                  </AlertDialogContent>
                                                              </AlertDialog>

                                                               <DropdownMenuItem onSelect={() => handleValidationStatusChange(doc, 'pending')} disabled={!canMarkPending}>
                                                                  <Clock className="mr-2 h-4 w-4" />
                                                                  Marcar como Pendente
                                                               </DropdownMenuItem>
                                                              <DropdownMenuSeparator />
                                                               <AlertDialog>
                                                                  <AlertDialogTrigger asChild>
                                                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                                          <Trash2 className="mr-2 h-4 w-4" />
                                                                          Deletar
                                                                      </DropdownMenuItem>
                                                                  </AlertDialogTrigger>
                                                                  <AlertDialogContent>
                                                                      <AlertDialogHeader>
                                                                      <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
                                                                      <AlertDialogDescription>
                                                                          Esta ação não pode ser desfeita. O documento <strong>{doc.fileName}</strong> será removido permanentemente do Cloudinary e do sistema.
                                                                      </AlertDialogDescription>
                                                                      </AlertDialogHeader>
                                                                      <AlertDialogFooter>
                                                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                      <AlertDialogAction onClick={() => handleDeleteDocument(doc)} className="bg-destructive hover:bg-destructive/90">
                                                                          Sim, excluir
                                                                      </AlertDialogAction>
                                                                      </AlertDialogFooter>
                                                                  </AlertDialogContent>
                                                              </AlertDialog>
                                                          </DropdownMenuContent>
                                                      </DropdownMenu>
                                                  </TableCell>
                                              </TableRow>
                                          )})}
                                      </TableBody>
                                  </Table>
                              )}
                          </CardContent>
                          {client.status === 'Em análise' ? (
                            <CardFooter className="border-t px-6 py-4 flex justify-between items-center flex-wrap gap-4">
                                <div className="flex-grow flex items-center gap-2 min-w-[300px]">
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                    <Button onClick={handleFileSelect} disabled={isUploading}>
                                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                        {isUploading ? 'Enviando...' : 'Adicionar Arquivo'}
                                    </Button>
                                    <div className="flex-1">
                                        <div className="flex gap-2">
                                            <Input id="quiz-link" value={quizLink} readOnly className="h-9 bg-muted/50" />
                                            <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleCopyLink}>
                                                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Envie este link para o cliente solicitar a documentação.</p>
                                    </div>
                                </div>
                                <Button disabled={!allDocumentsValidated} onClick={handleSendToCreditAnalysis}>
                                    <Send className="h-4 w-4 mr-2"/> 
                                    Enviar para Análise de Crédito
                                </Button>
                            </CardFooter>
                          ) : (
                             <CardFooter className="border-t px-6 py-4">
                               <p className="text-sm text-muted-foreground">
                                O cliente já avançou no processo. Não é mais possível adicionar documentos ou enviar para análise.
                               </p>
                             </CardFooter>
                          )}
                        </Card>
                      </TabsContent>
                      <TabsContent value="proposals">
                          <Card>
                              <CardHeader>
                                  <CardTitle>Propostas</CardTitle>
                                  <CardDescription>Oportunidades de crédito e consórcio para o cliente.</CardDescription>
                              </CardHeader>
                               {client.status === 'Pendente' ? (
                                  <CardContent className="text-center py-10">
                                      <div className="flex flex-col items-center gap-4">
                                          <h3 className="text-lg font-semibold">Aguardando Análise de Propostas</h3>
                                          <p className="text-muted-foreground max-w-md">
                                              Este cliente está na etapa de "Valor". Use as opções abaixo para adicionar oportunidades de crédito ou marcar que não há opções disponíveis no momento.
                                          </p>
                                          <div className="flex gap-4 mt-4">
                                               <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                      <Button variant="outline">
                                                          <FileWarning className="mr-2 h-4 w-4" />
                                                          Nenhum Crédito Aprovado
                                                      </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                      <AlertDialogHeader>
                                                      <AlertDialogTitle>Confirmar Reprovação?</AlertDialogTitle>
                                                      <AlertDialogDescription>
                                                          Deseja mover o cliente <strong>{client.name}</strong> para o status "Reprovado"? Essa ação pode ser revertida manualmente mais tarde.
                                                      </AlertDialogDescription>
                                                      </AlertDialogHeader>
                                                      <AlertDialogFooter>
                                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                      <AlertDialogAction onClick={() => handleStatusChange('Reprovado')} className="bg-destructive hover:bg-destructive/90">
                                                          Sim, Reprovar
                                                      </AlertDialogAction>
                                                      </AlertDialogFooter>
                                                  </AlertDialogContent>
                                              </AlertDialog>
                                              <Button onClick={() => setIsProposalDialogOpen(true)}>
                                                  <PlusCircle className="mr-2 h-4 w-4" />
                                                  Adicionar Oportunidade
                                              </Button>
                                          </div>
                                      </div>
                                  </CardContent>
                              ) : (
                                  <CardContent>
                                      <Table>
                                          <TableHeader>
                                              <TableRow>
                                                  <TableHead>Produto</TableHead>
                                                  <TableHead>Status</TableHead>
                                                  <TableHead className="text-right">Valor</TableHead>
                                              </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                              {isLoadingProposals && (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="h-24 text-center">
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                                    </TableCell>
                                                </TableRow>
                                              )}
                                              {!isLoadingProposals && proposals?.map(p => (
                                              <TableRow key={p.id}>
                                                  <TableCell>{p.productName}</TableCell>
                                                  <TableCell><Badge variant={getProposalStatusVariant(p.status)}>{p.status}</Badge></TableCell>
                                                  <TableCell className="text-right">R$ {p.value.toLocaleString('pt-BR')}</TableCell>
                                              </TableRow>
                                              ))}
                                              {!isLoadingProposals && proposals?.length === 0 && (
                                                  <TableRow>
                                                      <TableCell colSpan={3} className="text-center h-24">Nenhuma proposta encontrada.</TableCell>
                                                  </TableRow>
                                              )}
                                          </TableBody>
                                      </Table>
                                  </CardContent>
                              )}
                          </Card>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
              </Card>
          </div>
      </div>
    </>
  )
}

    