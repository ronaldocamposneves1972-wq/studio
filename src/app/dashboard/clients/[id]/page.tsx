
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
  FileWarning,
  Receipt,
  ShoppingCart,
  Recycle,
} from "lucide-react"
import { useState, useEffect, useRef, useMemo } from "react"
import { useParams } from 'next/navigation'
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"


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
import type { Client, ClientStatus, TimelineEvent, Proposal, ClientDocument, DocumentStatus, ProposalStatus, ProposalSummary, SalesOrder, SalesOrderSummary, Transaction, Product, WhatsappMessageTemplate } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDoc, useFirestore, useMemoFirebase, useUser, updateDocumentNonBlocking, useCollection } from "@/firebase"
import { doc, arrayUnion, arrayRemove, updateDoc, deleteDoc, collection, addDoc, serverTimestamp, query, where, writeBatch, getDoc, getDocs, limit } from "firebase/firestore"
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
import { cn, calculateMonthlyRate, addBusinessDays, maskCPF, maskPhone } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { ProposalDialog } from "@/components/dashboard/proposal-dialog"
import { SalesOrderDialog } from "@/components/dashboard/sales-order-dialog"
import { sendWhatsappMessage } from "@/lib/whatsapp"

const clientSchema = z.object({
    name: z.string().min(3, "O nome completo é obrigatório."),
    email: z.string().email("Por favor, insira um e-mail válido."),
    phone: z.string().min(10, "O telefone é obrigatório."),
    cpf: z.string().optional(),
    birthDate: z.string().optional(),
    motherName: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;


const getStatusVariant = (status: ClientStatus) => {
  switch (status) {
    case 'Aprovado':
    case 'Ledger':
      return 'default';
    case 'Reprovado':
    case 'Reciclagem':
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
    if (activity.toLowerCase().includes('reciclagem')) return <Recycle className="h-4 w-4 text-muted-foreground" />;
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

function EditClientDialog({
    client,
    isOpen,
    onOpenChange,
    onSave,
}: {
    client: Client;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: ClientFormData) => Promise<void>;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Helper function to parse DD/MM/YYYY into YYYY-MM-DD
    const parseBirthDate = (dateString?: string): string => {
        if (!dateString) return '';
        const parts = dateString.split('/');
        if (parts.length === 3) {
            // Assuming DD/MM/YYYY -> YYYY-MM-DD
            const [day, month, year] = parts;
            if (day && month && year && day.length === 2 && month.length === 2 && year.length === 4) {
                 return `${year}-${month}-${day}`;
            }
        }
        // If it's already in YYYY-MM-DD or some other format, return as is.
        // The input[type=date] is robust enough to handle YYYY-MM-DD.
        return dateString;
    };


    const { register, handleSubmit, formState: { errors }, control } = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
            cpf: client.cpf || '',
            birthDate: parseBirthDate(client.birthDate),
            motherName: client.motherName || '',
        }
    });

    const handleFormSubmit = async (data: ClientFormData) => {
        setIsSubmitting(true);
        await onSave(data);
        setIsSubmitting(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Cliente</DialogTitle>
                    <DialogDescription>
                        Atualize as informações de <strong>{client.name}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input id="name" {...register('name')} />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" {...register('email')} />
                            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        id="phone"
                                        {...field}
                                        onChange={(e) => field.onChange(maskPhone(e.target.value))}
                                    />
                                )}
                            />
                            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="grid gap-2">
                            <Label htmlFor="cpf">CPF</Label>
                             <Controller
                                name="cpf"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        id="cpf"
                                        {...field}
                                        onChange={(e) => field.onChange(maskCPF(e.target.value))}
                                    />
                                )}
                            />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="birthDate">Data de Nascimento</Label>
                            <Input id="birthDate" type="date" {...register('birthDate')} />
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="motherName">Nome da Mãe</Label>
                        <Input id="motherName" {...register('motherName')} />
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}


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
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const [isSalesOrderDialogOpen, setIsSalesOrderDialogOpen] = useState(false);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [viewingProposalId, setViewingProposalId] = useState<string | null>(null);
  const [proposalToAccept, setProposalToAccept] = useState<ProposalSummary | null>(null);
  const [viewingDocument, setViewingDocument] = useState<ClientDocument | null>(null);


  const proposalRef = useMemoFirebase(() => {
    if (!firestore || !viewingProposalId) return null;
    return doc(firestore, 'sales_proposals', viewingProposalId);
  }, [firestore, viewingProposalId]);

  const { data: viewingProposal, isLoading: isLoadingProposal } = useDoc<Proposal>(proposalRef);

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

  const handleReproveAndMoveToOpportunityPanel = async () => {
    if (!clientRef || !user) return;

    const now = new Date().toISOString();
    const timelineEvent: TimelineEvent = {
        id: `tl-${Date.now()}`,
        activity: `Cliente movido para o Painel de Oportunidades`,
        details: `Status alterado para "Reprovado". Nova análise em 30 dias.`,
        timestamp: now,
        user: { name: user.displayName || user.email || "Usuário", avatarUrl: user.photoURL || '' }
    };

    try {
      await updateDoc(clientRef, { 
        status: 'Reprovado',
        reprovalDate: now,
        timeline: arrayUnion(timelineEvent) 
      });
      toast({
        title: "Cliente movido!",
        description: "O cliente foi movido para o Painel de Oportunidades para reanálise futura.",
      });
      router.push('/dashboard/opportunity-panel');
    } catch (e) {
      console.error(e)
      toast({
        variant: "destructive",
        title: "Erro ao mover cliente",
        description: "Não foi possível completar a operação."
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
        id: uploadData.id,
        clientId: clientId,
        fileName: uploadData.fileName,
        secureUrl: uploadData.secureUrl,
        unsterilePublicId: uploadData.unsterilePublicId,
        fileType: uploadData.fileType,
        uploadedAt: new Date().toISOString(),
        validationStatus: 'pending',
      };
      
      const timelineEvent: TimelineEvent = {
        id: `tl-${Date.now()}`,
        activity: `Documento "${file.name}" enviado`,
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
    if (!clientRef || !client?.documents || !docToDelete.unsterilePublicId) return;

    try {
      const pathParts = docToDelete.unsterilePublicId.split('/');
      const filename = pathParts.pop();
      const folder = pathParts.join('/');
      
      const deleteUrl = new URL(window.location.origin + '/api/upload');
      deleteUrl.searchParams.append('folder', folder);
      deleteUrl.searchParams.append('filename', filename!);

      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        throw new Error(errorData.error || 'Falha ao deletar arquivo na API.');
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
  };

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
    window.open(doc.secureUrl, '_blank');
  };


    const handleInitiateDocumentation = async () => {
    if (!clientRef || !user || !firestore || !client) return;

    try {
        const now = new Date().toISOString();

        const timelineEvent: TimelineEvent = {
            id: `tl-${Date.now()}`,
            activity: `Status alterado para "Em análise"`,
            details: "Iniciada a coleta de documentos.",
            timestamp: now,
            user: { name: user.displayName || user.email || "Usuário", avatarUrl: user.photoURL || '' }
        };

        // Update client status
        await updateDoc(clientRef, { status: 'Em análise', timeline: arrayUnion(timelineEvent) });

        toast({
            title: "Cliente movido para Documentação",
            description: `${client.name} agora está na etapa de coleta de documentos.`
        });

        // --- Send WhatsApp Message ---
        const templatesQuery = query(collection(firestore, 'whatsapp_templates'), where('stage', '==', 'Documentação'));
        const templatesSnap = await getDocs(templatesQuery);
        
        if (!templatesSnap.empty) {
            const template = templatesSnap.docs[0].data() as WhatsappMessageTemplate;
            const placeholders = {
                clientName: client.name,
                quizLink: quizLink
            };
            await sendWhatsappMessage(template, placeholders, client.phone);
            toast({
                title: "Notificação enviada!",
                description: "O link de documentação foi enviado ao cliente via WhatsApp."
            });
        } else {
             toast({
                variant: 'destructive',
                title: "Template não encontrado",
                description: "Nenhum modelo de WhatsApp encontrado para a etapa 'Documentação'."
            });
        }
        
        router.push('/dashboard/pipeline/Documentacao');

    } catch (error) {
        console.error("Error initiating documentation:", error);
        toast({
            variant: 'destructive',
            title: "Erro",
            description: "Não foi possível iniciar a etapa de documentação.",
        });
    }
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
        const now = new Date().toISOString();
    
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
                createdAt: now,
                status: 'Aberta'
            };
            batch.set(newProposalRef, newProposalData);
    
            // 2. Create the summary to be denormalized into the client document
            const proposalSummary: ProposalSummary = {
                id: newProposalRef.id,
                productId: data.productId,
                productName: data.productName,
                bankName: data.bankName,
                value: data.value,
                installments: data.installments,
                installmentValue: data.installmentValue,
                status: 'Aberta',
                createdAt: now
            };
    
            // 3. Create the timeline event
            const timelineEvent: TimelineEvent = {
                id: `tl-${Date.now()}-proposal`,
                activity: `Nova proposta "${data.productName}" criada.`,
                details: `Valor: R$ ${data.value.toLocaleString('pt-br')}`,
                timestamp: now,
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
    
const handleSendToCreditDesk = async (acceptedProposal: ProposalSummary) => {
    if (!firestore || !client || !clientRef || !user ) {
        toast({ variant: 'destructive', title: 'Erro de Dados' });
        return;
    }
    
    toast({ title: 'Enviando para mesa de crédito...' });
    
    const batch = writeBatch(firestore);
    const nowISO = new Date().toISOString();

    try {
        // Update client status to 'Aprovado'
        batch.update(clientRef, { status: 'Aprovado' });

        // Update the status of all proposals
        const updatedProposals = client.proposals?.map(p => {
            if (p.id === acceptedProposal.id) {
                // This is the accepted one
                return { ...p, status: 'Finalizada' as ProposalStatus, approvedAt: nowISO };
            }
            if (p.status === 'Aberta' || p.status === 'Em negociação') {
                // Cancel all other open proposals
                return { ...p, status: 'Cancelada' as ProposalStatus };
            }
            return p;
        });
        batch.update(clientRef, { proposals: updatedProposals });

        // Also update the main proposal documents in the `sales_proposals` collection
        client.proposals?.forEach(p => {
            const proposalDocRef = doc(firestore, 'sales_proposals', p.id);
            if (p.id === acceptedProposal.id) {
                batch.update(proposalDocRef, { status: 'Finalizada', approvedAt: nowISO });
            } else if (p.status === 'Aberta' || p.status === 'Em negociação') {
                batch.update(proposalDocRef, { status: 'Cancelada' });
            }
        });

        // Add a timeline event
        const timelineEvent: TimelineEvent = {
            id: `tl-${Date.now()}-approved`,
            activity: `Proposta "${acceptedProposal.productName}" aprovada internamente.`,
            details: `Cliente movido para "Aprovado" e enviado para a esteira de Clearance.`,
            timestamp: nowISO,
            user: { name: user.displayName || user.email || 'Usuário', avatarUrl: user.photoURL || '' },
        };
        batch.update(clientRef, { timeline: arrayUnion(timelineEvent) });

        // Commit all writes
        await batch.commit();

        toast({
            title: "Proposta Aprovada!",
            description: `O cliente ${client.name} foi enviado para a esteira de Clearance.`
        });
        setProposalToAccept(null);
        router.push('/dashboard/pipeline/clearance');

    } catch (error) {
        console.error("Error accepting proposal: ", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao aprovar proposta',
            description: error instanceof Error ? error.message : 'Não foi possível completar a operação.',
        });
    }
};


    const handleDeleteProposal = async (proposalToDelete: ProposalSummary) => {
        if (!firestore || !client || !clientRef) return;

        toast({ title: 'Excluindo proposta...' });

        const batch = writeBatch(firestore);

        // 1. Remove from client's proposals array
        batch.update(clientRef, {
            proposals: arrayRemove(proposalToDelete)
        });

        // 2. Delete from sales_proposals collection
        const proposalDocRef = doc(firestore, 'sales_proposals', proposalToDelete.id);
        batch.delete(proposalDocRef);

        try {
            await batch.commit();
            toast({
                title: "Proposta Excluída!",
                description: `A proposta "${proposalToDelete.productName}" foi removida.`
            });
        } catch (error) {
            console.error("Error deleting proposal:", error);
            toast({
                variant: 'destructive',
                title: 'Erro ao excluir',
                description: 'Não foi possível remover a proposta.'
            });
        }
    };

    const handleSaveSalesOrder = async (data: any) => {
        if (!firestore || !user || !client || !clientRef) return;

        const batch = writeBatch(firestore);
        const now = new Date().toISOString();

        try {
            // 1. Create the main sales order document
            const salesOrderCollection = collection(firestore, 'sales_orders');
            const newSalesOrderRef = doc(salesOrderCollection);

            const newSalesOrderData: SalesOrder = {
                id: newSalesOrderRef.id,
                clientId: client.id,
                clientName: client.name,
                salesRepId: user.uid,
                salesRepName: user.displayName || user.email || 'Usuário',
                createdAt: now,
                dueDate: data.dueDate,
                items: data.items,
                totalValue: data.totalValue,
            };
            batch.set(newSalesOrderRef, newSalesOrderData);

            // 2. Create the summary for the client document
            const salesOrderSummary: SalesOrderSummary = {
                id: newSalesOrderRef.id,
                createdAt: now,
                dueDate: data.dueDate,
                totalValue: data.totalValue,
                itemCount: data.items.length,
            };

            // 3. Create the timeline event
            const timelineEvent: TimelineEvent = {
                id: `tl-${Date.now()}-salesorder`,
                activity: `Novo pedido de venda (R$ ${data.totalValue.toLocaleString('pt-br')}) criado.`,
                timestamp: now,
                user: { name: user.displayName || user.email || 'Usuário', avatarUrl: user.photoURL || '' },
            };

            // 4. Update the client document
            batch.update(clientRef, {
                salesOrders: arrayUnion(salesOrderSummary),
                timeline: arrayUnion(timelineEvent),
            });
            
             // 5. Create Transaction (Contas a Receber)
            const transactionCollection = collection(firestore, 'transactions');
            const newTransactionRef = doc(transactionCollection);
            const newTransactionData: Transaction = {
                id: newTransactionRef.id,
                description: `Recebimento - Pedido de Venda - ${client.name}`,
                amount: data.totalValue,
                type: 'income',
                status: 'pending',
                dueDate: data.dueDate,
                clientId: client.id,
                clientName: client.name,
                category: 'Venda de Produto/Serviço',
                accountId: '', // Needs to be assigned later
            };
            batch.set(newTransactionRef, newTransactionData);

            // 6. Commit all writes
            await batch.commit();

            toast({ title: "Pedido de Venda Salvo!", description: "O novo pedido e a conta a receber foram registrados." });
            setIsSalesOrderDialogOpen(false);

        } catch (error) {
            console.error("Error saving sales order:", error);
            toast({
                variant: 'destructive',
                title: "Erro ao Salvar Pedido",
                description: "Não foi possível registrar o pedido de venda."
            });
        }
    }

    const handleDeleteSalesOrder = async (orderToDelete: SalesOrderSummary) => {
        if (!firestore || !client || !clientRef) return;

        toast({ title: 'Excluindo pedido de venda...' });

        const batch = writeBatch(firestore);

        // 1. Remove from client's salesOrders array
        batch.update(clientRef, {
            salesOrders: arrayRemove(orderToDelete)
        });

        // 2. Delete from sales_orders collection
        const salesOrderDocRef = doc(firestore, 'sales_orders', orderToDelete.id);
        batch.delete(salesOrderDocRef);

        try {
            await batch.commit();
            toast({
                title: "Pedido de Venda Excluído!",
                description: `O pedido foi removido com sucesso.`
            });
        } catch (error) {
            console.error("Error deleting sales order:", error);
            toast({
                variant: 'destructive',
                title: 'Erro ao excluir',
                description: 'Não foi possível remover o pedido de venda.'
            });
        }
    };
    
    const handleUpdateClient = async (data: ClientFormData) => {
        if (!clientRef || !user) return;
        
        try {
            await updateDoc(clientRef, {
                ...data,
                phone: data.phone.replace(/\D/g, ''),
            });
            toast({ title: "Cliente atualizado com sucesso!" });
            setIsEditClientOpen(false);
        } catch (error) {
            console.error("Error updating client: ", error);
            toast({
                variant: 'destructive',
                title: 'Erro ao atualizar cliente',
                description: 'Não foi possível salvar as alterações.'
            });
        }
    };


    const clientDataToDisplay = useMemo(() => {
        if (!client) return [];

        const translatedLabels: { [key: string]: string } = {
            'name': 'Nome',
            'email': 'Email',
            'phone': 'Telefone',
            'cpf': 'CPF',
            'birthDate': 'Data de Nascimento',
            'motherName': 'Nome da Mãe',
            'trabalho': 'Profissão',
            'cep': 'CEP',
            'address': 'Endereço',
            'address-number': 'Número',
            'complement': 'Complemento',
            'neighborhood': 'Bairro',
            'city': 'Cidade',
            'state': 'Estado',
        };

        const fieldOrder = [
            'name', 'cpf', 'birthDate', 'phone', 'email', 'motherName', 'trabalho',
            'cep', 'address', 'address-number', 'complement', 'neighborhood', 'city', 'state'
        ];
        
        const combinedData: Record<string, any> = {};

        // Helper to add data if key doesn't exist
        const addData = (key: string, value: any) => {
            if (value) {
                 combinedData[key] = value;
            }
        };

        // 1. Add main client fields based on fieldOrder, giving them priority
        fieldOrder.forEach(key => {
            const clientKey = key as keyof Client;
            if (client[clientKey]) {
                addData(key, client[clientKey]);
            }
        });

        // 2. Add answers from quiz, only if the field hasn't been filled by a main client field
        if (client.answers) {
            for (const answerKey in client.answers) {
                // remove 'q-' prefix if it exists
                const cleanKey = answerKey.startsWith('q-') ? answerKey.substring(2) : answerKey;
                if (!combinedData.hasOwnProperty(cleanKey)) {
                   addData(cleanKey, client.answers[answerKey]);
                }
            }
        }
        
        // 3. Prepare for display, mapping and translating
        return fieldOrder
            .filter(key => combinedData.hasOwnProperty(key)) // Only show fields that have data
            .map(key => ({
                key,
                label: translatedLabels[key] || key.charAt(0).toUpperCase() + key.slice(1), // Translate or capitalize
                value: String(combinedData[key]),
            }));

    }, [client]);

    const handleSendProposalWhatsApp = async (proposal: ProposalSummary) => {
        if (!firestore || !client?.phone || !client?.name) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Cliente ou telefone não encontrado.' });
            return;
        }

        toast({ title: 'Enviando WhatsApp...' });

        try {
            const q = query(collection(firestore, 'whatsapp_templates'), where('stage', '==', 'Envio de Proposta'), limit(1));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({ variant: 'destructive', title: 'Template não encontrado', description: 'Crie um modelo para "Envio de Proposta" nas configurações.' });
                return;
            }

            const template = querySnapshot.docs[0].data() as WhatsappMessageTemplate;

            const proposalDetails = `*${proposal.productName}*\nValor: *R$ ${proposal.value.toLocaleString('pt-br', { minimumFractionDigits: 2 })}*\nParcelas: *${proposal.installments}x* de R$ *${proposal.installmentValue?.toLocaleString('pt-br', { minimumFractionDigits: 2 })}*`;
            
            const placeholders = {
                clientName: client.name,
                proposalDetails: proposalDetails,
            };

            await sendWhatsappMessage(template, placeholders, client.phone);

            toast({ title: 'Proposta enviada!', description: 'A proposta foi enviada para o WhatsApp do cliente.' });
        } catch (error) {
            console.error("Error sending WhatsApp proposal:", error);
            toast({ variant: 'destructive', title: 'Erro ao enviar', description: 'Não foi possível enviar a mensagem.' });
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
  const salesOrders = client.salesOrders || [];
  const allDocumentsValidated = documents.length > 0 && documents.every(doc => doc.validationStatus === 'validated');
  const hasAcceptedProposal = proposals.some(p => p.status === 'Finalizada');


  return (
    <>
      <ProposalDialog
          open={isProposalDialogOpen}
          onOpenChange={setIsProposalDialogOpen}
          onSave={handleSaveProposal}
          client={client}
      />
      <SalesOrderDialog
        open={isSalesOrderDialogOpen}
        onOpenChange={setIsSalesOrderDialogOpen}
        onSave={handleSaveSalesOrder}
        client={client}
      />
      <EditClientDialog
        client={client}
        isOpen={isEditClientOpen}
        onOpenChange={setIsEditClientOpen}
        onSave={handleUpdateClient}
      />
       <AlertDialog open={!!proposalToAccept} onOpenChange={(open) => !open && setProposalToAccept(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Enviar para Mesa de Crédito?</AlertDialogTitle>
                <AlertDialogDescription>
                    Isso marcará a proposta como 'Finalizada' e moverá o cliente para a esteira de 'Clearance' para aguardar a formalização. As outras propostas abertas serão canceladas.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-2">
                <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
                    <p><strong>Produto:</strong> {proposalToAccept?.productName}</p>
                    <p><strong>Valor:</strong> R$ {proposalToAccept?.value.toLocaleString('pt-br', {minimumFractionDigits: 2})}</p>
                    {proposalToAccept?.installments && <p><strong>Parcelas:</strong> {proposalToAccept.installments}x de R$ {proposalToAccept.installmentValue?.toLocaleString('pt-br', {minimumFractionDigits: 2})}</p>}
                </div>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setProposalToAccept(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleSendToCreditDesk(proposalToAccept!)}>
                    Sim, Enviar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
      <Dialog open={!!viewingProposalId} onOpenChange={(open) => !open && setViewingProposalId(null)}>
        <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
                <DialogTitle>Detalhes da Proposta</DialogTitle>
                <DialogDescription>
                    Informações completas da oportunidade de crédito.
                </DialogDescription>
            </DialogHeader>
            {isLoadingProposal && <div className="space-y-4 py-4">
                <Skeleton className="h-4 w-1/2"/>
                <Skeleton className="h-4 w-3/4"/>
                <Skeleton className="h-4 w-1/2"/>
                <Skeleton className="h-4 w-2/3"/>
            </div>}
            {viewingProposal && (
                <div className="grid gap-4 py-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-muted-foreground">Produto</p><p>{viewingProposal.productName}</p></div>
                        <div><p className="text-muted-foreground">Status</p><p><Badge variant={getProposalStatusVariant(viewingProposal.status)}>{viewingProposal.status}</Badge></p></div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-muted-foreground">Banco</p><p>{viewingProposal.bankName || 'N/A'}</p></div>
                        <div><p className="text-muted-foreground">Atendente</p><p>{viewingProposal.salesRepName}</p></div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-muted-foreground">Valor Solicitado</p><p>R$ {viewingProposal.value.toLocaleString('pt-br', {minimumFractionDigits: 2})}</p></div>
                         {viewingProposal.installments && <div><p className="text-muted-foreground">Parcelas</p><p>{viewingProposal.installments}x de R$ {viewingProposal.installmentValue?.toLocaleString('pt-br', {minimumFractionDigits: 2})}</p></div>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-muted-foreground">Data de Criação</p><p>{new Date(viewingProposal.createdAt).toLocaleString('pt-br')}</p></div>
                        <div><p className="text-muted-foreground">Data de Aprovação</p><p>{viewingProposal.approvedAt ? new Date(viewingProposal.approvedAt).toLocaleString('pt-br') : '—'}</p></div>
                    </div>
                     {viewingProposal.formalizationLink && (
                         <div className="grid gap-2">
                             <p className="text-muted-foreground">Link de Formalização</p>
                             <div className="flex items-center gap-2">
                                <Input value={viewingProposal.formalizationLink} readOnly className="bg-muted"/>
                                <Button asChild variant="secondary"><a href={viewingProposal.formalizationLink} target="_blank" rel="noopener noreferrer">Abrir Link</a></Button>
                             </div>
                         </div>
                    )}
                </div>
            )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!viewingDocument} onOpenChange={(open) => !open && setViewingDocument(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>{viewingDocument?.fileName}</DialogTitle>
                <DialogDescription>
                    Visualização do documento.
                </DialogDescription>
            </DialogHeader>
            <div className="flex-1 rounded-md overflow-hidden">
                {viewingDocument && (
                    <iframe
                        src={viewingDocument.secureUrl}
                        title={viewingDocument.fileName}
                        className="w-full h-full border-0"
                    />
                )}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button>Fechar</Button>
                </DialogClose>
            </DialogFooter>
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
                               <Badge variant={getStatusVariant(client.status)}>{client.status}</Badge>
                                {client.status === 'Novo' && (
                                    <Button onClick={handleInitiateDocumentation}>
                                        <Send className="h-4 w-4 mr-2" />
                                        Iniciar Documentação
                                    </Button>
                                )}
                                {client.status === 'Em análise' && (
                                    <Button disabled={!allDocumentsValidated} onClick={handleSendToCreditAnalysis}>
                                        <Send className="h-4 w-4 mr-2"/>
                                        Enviar para Análise
                                    </Button>
                                )}
                               <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button size="icon" variant="outline"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onSelect={() => setIsEditClientOpen(true)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Editar Cliente
                                  </DropdownMenuItem>
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
                        <TabsTrigger value="proposals">Propostas</TabsTrigger>
                        {hasAcceptedProposal && <TabsTrigger value="venda">Venda</TabsTrigger>}
                        {hasAcceptedProposal && <TabsTrigger value="payment_guides">Guias de Pagamento</TabsTrigger>}
                        <TabsTrigger value="history">Histórico</TabsTrigger>
                      </TabsList>
                       <TabsContent value="quiz">
                          <Card>
                              <CardHeader>
                                  <CardTitle>Respostas do Cadastro Inicial</CardTitle>
                                  <CardDescription>Respostas fornecidas pelo cliente no formulário de qualificação.</CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {clientDataToDisplay.length > 0 ? (
                                    <>
                                        {clientDataToDisplay.map(({ key, label, value }) => (
                                            <div className="grid grid-cols-[150px_1fr] gap-2 items-center" key={key}>
                                                <p className="font-medium text-sm text-muted-foreground">{label}</p>
                                                <p className="text-foreground">{value}</p>
                                            </div>
                                        ))}
                                        <div className="grid grid-cols-[150px_1fr] gap-2 items-center border-t pt-4 mt-4">
                                            <p className="font-medium text-sm text-muted-foreground">Data do Cadastro</p>
                                            <p className="text-foreground">{new Date(client.createdAt).toLocaleString('pt-BR')}</p>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground">Nenhum dado do cliente encontrado.</p>
                                )}
                              </CardContent>
                              {client.quizId && (
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
                                                      statusBadge = <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="mr-2 h-4 w-4" /> Validado</Badge>;
                                                      break;
                                                  case 'rejected':
                                                      statusBadge = <Badge variant="destructive"><XCircle className="mr-2 h-4 w-4" /> Rejeitado</Badge>;
                                                      break;
                                                  case 'pending':
                                                  default:
                                                      statusBadge = <Badge variant="secondary"><Clock className="mr-2 h-4 w-4" /> Pendente</Badge>;
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
                                                              <DropdownMenuItem onSelect={() => setViewingDocument(doc)}>
                                                                  <Eye className="mr-2 h-4 w-4" /> Ver
                                                              </DropdownMenuItem>
                                                              <DropdownMenuItem onSelect={() => handleDownload(doc)}>
                                                                  <Download className="mr-2 h-4 w-4" /> Baixar
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
                                                                          Esta ação não pode ser desfeita. O documento <strong>{doc.fileName}</strong> será removido permanentemente.
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
                                <CardContent className="space-y-6">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Produto</TableHead>
                                                <TableHead>Valor Principal</TableHead>
                                                <TableHead>Parcelas</TableHead>
                                                <TableHead>Juros (Mês)</TableHead>
                                                <TableHead>Juros (Total)</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Criado em</TableHead>
                                                <TableHead>Aprovado em</TableHead>
                                                <TableHead className="text-right">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoadingProposals ? (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="h-24 text-center">
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                                    </TableCell>
                                                </TableRow>
                                            ) : proposals?.length > 0 ? (
                                                proposals.map(p => {
                                                    const monthlyRate = p.installments && p.installmentValue ? calculateMonthlyRate(p.value, p.installments, p.installmentValue) : 0;
                                                    const totalRate = monthlyRate * (p.installments || 0);

                                                    return (
                                                        <TableRow key={p.id}>
                                                            <TableCell>
                                                                <div className="font-medium">{p.productName}</div>
                                                                <div className="text-sm text-muted-foreground">{p.bankName}</div>
                                                            </TableCell>
                                                            <TableCell>R$ {p.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</TableCell>
                                                            <TableCell>{p.installments ? `${p.installments}x de R$ ${p.installmentValue?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'N/A'}</TableCell>
                                                            <TableCell className="font-mono">{(monthlyRate * 100).toFixed(2)}%</TableCell>
                                                            <TableCell className="font-mono">{(totalRate * 100).toFixed(2)}%</TableCell>
                                                            <TableCell><Badge variant={getProposalStatusVariant(p.status)}>{p.status}</Badge></TableCell>
                                                            <TableCell>{new Date(p.createdAt).toLocaleDateString('pt-br')}</TableCell>
                                                            <TableCell>{p.approvedAt ? new Date(p.approvedAt).toLocaleDateString('pt-BR') : '—'}</TableCell>
                                                            <TableCell className="text-right">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onSelect={() => setViewingProposalId(p.id)}>
                                                                            <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onSelect={() => setProposalToAccept(p)} disabled={hasAcceptedProposal || p.status !== 'Aberta'}>
                                                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Enviar para Mesa
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onSelect={() => handleSendProposalWhatsApp(p)}>
                                                                            <MessageSquare className="mr-2 h-4 w-4" /> Enviar por WhatsApp
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                                                </DropdownMenuItem>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader><AlertDialogTitle>Excluir Proposta?</AlertDialogTitle><AlertDialogDescription>A proposta para <strong>{p.productName}</strong> será permanentemente removida.</AlertDialogDescription></AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                                    <AlertDialogAction onClick={() => handleDeleteProposal(p)} className="bg-destructive hover:bg-destructive/90">Sim, excluir</AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="text-center h-24">Nenhuma proposta encontrada.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                    
                                    {client.status === 'Pendente' && (
                                        <div className="text-center py-6 border-t">
                                            <h3 className="text-lg font-semibold mb-2">Gerenciar Oportunidades</h3>
                                            <p className="text-muted-foreground max-w-md mx-auto mb-4">
                                                Adicione novas propostas ou marque o cliente como reprovado.
                                            </p>
                                            <div className="flex justify-center gap-4 mt-4">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline">
                                                            <FileWarning className="mr-2 h-4 w-4" />
                                                            Nenhum Crédito Aprovado
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Mover para Painel de Oportunidades?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Deseja mover o cliente <strong>{client.name}</strong> para "Reprovado" e acompanhá-lo no Painel de Oportunidades para uma futura reanálise em 30 dias?
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={handleReproveAndMoveToOpportunityPanel} className="bg-destructive hover:bg-destructive/90">
                                                                Sim, Mover e Reprovar
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
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="venda">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Pedidos de Venda</CardTitle>
                                        <CardDescription>
                                            Gerencie os pedidos de venda para o contrato aprovado.
                                        </CardDescription>
                                    </div>
                                     <Button onClick={() => setIsSalesOrderDialogOpen(true)}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Lançar Novo Pedido
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    {salesOrders.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center text-center gap-4 min-h-60 rounded-lg border-2 border-dashed p-6">
                                            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                                            <h3 className="text-xl font-semibold">Nenhum pedido de venda criado</h3>
                                            <p className="text-muted-foreground max-w-sm">
                                                Após a formalização, lance o pedido de venda para este contrato.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>ID Pedido</TableHead>
                                                    <TableHead>Data</TableHead>
                                                    <TableHead>Vencimento</TableHead>
                                                    <TableHead>Itens</TableHead>
                                                    <TableHead className="text-right">Valor Total</TableHead>
                                                    <TableHead className="text-right">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {salesOrders.map(order => (
                                                    <TableRow key={order.id}>
                                                        <TableCell className="font-mono">{order.id.substring(0, 8)}...</TableCell>
                                                        <TableCell>{new Date(order.createdAt).toLocaleDateString('pt-br')}</TableCell>
                                                        <TableCell>{new Date(order.dueDate).toLocaleDateString('pt-br')}</TableCell>
                                                        <TableCell>{order.itemCount}</TableCell>
                                                        <TableCell className="text-right">R$ {order.totalValue.toLocaleString('pt-br', { minimumFractionDigits: 2 })}</TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent>
                                                                    <DropdownMenuItem>
                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                        Editar
                                                                    </DropdownMenuItem>
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                                            </DropdownMenuItem>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>Excluir Pedido de Venda?</AlertDialogTitle>
                                                                                <AlertDialogDescription>O pedido de venda será permanentemente removido. Esta ação não pode ser desfeita.</AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                                <AlertDialogAction onClick={() => handleDeleteSalesOrder(order)} className="bg-destructive hover:bg-destructive/90">Sim, excluir</AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                         <TabsContent value="payment_guides">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Guias de Pagamento</CardTitle>
                                    <CardDescription>
                                        Gerencie os boletos de seguro, comissão e outras taxas.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col items-center justify-center text-center gap-4 min-h-60 rounded-lg border-2 border-dashed p-6">
                                        <Receipt className="h-12 w-12 text-muted-foreground" />
                                        <h3 className="text-xl font-semibold">Nenhuma guia de pagamento</h3>
                                        <p className="text-muted-foreground max-w-sm">
                                            Anexe aqui os boletos de seguro prestamista, taxas de comissão e outros documentos de pagamento relevantes para este contrato.
                                        </p>
                                        <Button>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Anexar Guia
                                        </Button>
                                    </div>
                                </CardContent>
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
