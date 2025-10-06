

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
  MoreHorizontal
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
import { proposals as allProposals } from "@/lib/placeholder-data"
import type { Client, ClientStatus, TimelineEvent, Proposal, ClientDocument } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase"
import { doc, arrayUnion, arrayRemove, updateDoc, deleteDoc } from "firebase/firestore"
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
    return (
        <div className="space-y-8">
            {events.map((event) => (
                <div key={event.id} className="flex items-start">
                    <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            {getTimelineIcon(event.activity)}
                        </div>
                    </div>
                    <div className="ml-4">
                        <p className="font-medium text-sm">{event.activity}</p>
                        <p className="text-sm text-muted-foreground">{event.details}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {new Date(event.timestamp).toLocaleString('pt-BR')} por {event.user.name}
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
  const { toast } = useToast();
  const router = useRouter();

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [quizLink, setQuizLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<ClientDocument | null>(null);

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

  const proposals = allProposals.filter(p => p.clientName === client?.name)

  const handleStatusChange = async (newStatus: ClientStatus) => {
    if (!clientRef) return;
    try {
      await updateDoc(clientRef, { status: newStatus });
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
    if (!file || !clientId || !clientRef) return;

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
        validated: false,
      };
      
      await updateDoc(clientRef, {
        documents: arrayUnion(newDocument)
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

  const handleToggleValidation = async (docToValidate: ClientDocument) => {
    if (!clientRef || !client?.documents) return;
    try {
        const updatedDocuments = client.documents.map(doc =>
            doc.id === docToValidate.id ? { ...doc, validated: !doc.validated } : doc
        );
        await updateDoc(clientRef, {
            documents: updatedDocuments
        });
        toast({
            title: `Documento ${!docToValidate.validated ? 'validado' : 'marcado como pendente'}.`,
            description: `${docToValidate.fileName} foi atualizado.`
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


  const translatedLabels: { [key: string]: string } = {
    'name': 'Nome', 'email': 'Email', 'phone': 'Telefone', 'cpf': 'CPF', 'birthdate': 'Data de Nascimento',
    'mothername': 'Nome da Mãe', 'cep': 'CEP', 'address': 'Endereço', 'complement': 'Complemento', 'number': 'Número',
    'neighborhood': 'Bairro', 'city': 'Cidade', 'state': 'Estado',
  };

  const fieldOrder = ['name', 'cpf', 'birthdate', 'phone', 'email', 'mothername', 'cep', 'address', 'number', 'complement', 'neighborhood', 'city', 'state'];

    const getInlineViewUrl = (doc: ClientDocument | null): string => {
        if (!doc || !doc.secureUrl) return '';

        const isPdf = doc.fileName.toLowerCase().endsWith('.pdf');
        
        if (isPdf && doc.fileType === 'raw') {
            // Insert fl_inline transformation for raw PDFs
            return doc.secureUrl.replace('/upload/', '/upload/fl_inline/');
        }

        return doc.secureUrl;
    };
    
    const handleViewDocument = (doc: ClientDocument) => {
       setViewingDocument(doc);
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
  const isViewingImage = viewingDocument && viewingDocument.fileType === 'image';


  return (
    <>
      <Dialog open={!!viewingDocument} onOpenChange={(open) => !open && setViewingDocument(null)}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>{viewingDocument?.fileName}</DialogTitle>
            <DialogDescription>
                Visualizando documento. <a href={getInlineViewUrl(viewingDocument)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Abrir em nova aba</a>.
            </DialogDescription>
          </DialogHeader>
          <div className="h-full w-full relative bg-muted flex items-center justify-center">
            {isViewingImage ? (
              <Image src={viewingDocument.secureUrl} alt={viewingDocument.fileName} layout="fill" objectFit="contain" />
            ) : (
                 <div className="text-center p-8">
                    <FileText className="h-24 w-24 mx-auto text-muted-foreground" />
                    <p className="mt-4 text-lg font-semibold">Pré-visualização não disponível.</p>
                    <p className="text-muted-foreground">Este tipo de arquivo não pode ser exibido aqui. Use a opção "Abrir em nova aba" para visualizá-lo.</p>
                </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    <div className="grid flex-1 auto-rows-max items-start gap-4 lg:grid-cols-3 lg:gap-8">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
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
                   <Tabs defaultValue="documents">
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
                                    <p className="text-muted-foreground">Clique no botão abaixo ou envie um link para o cliente.</p>
                                </div>
                            )}
                            {documents.length > 0 && (
                                 <Table>
                                    <TableHeader>
                                        <TableRow>
                                        <TableHead>Nome do Arquivo</TableHead>
                                        <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                                        <TableHead>Validado</TableHead>
                                        <TableHead className="hidden md:table-cell">Data de Envio</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {documents.map((doc) => (
                                            <TableRow key={doc.id}>
                                                <TableCell className="font-medium flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    {doc.fileName}
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell capitalize">{doc.fileType}</TableCell>
                                                <TableCell>
                                                    {doc.validated ? (
                                                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                           <Clock className="h-4 w-4" />
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">{new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}</TableCell>
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
                                                             <DropdownMenuItem onSelect={() => window.open(getInlineViewUrl(doc), '_blank')}>
                                                                <Download className="mr-2 h-4 w-4" />
                                                                Abrir / Baixar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => handleToggleValidation(doc)}>
                                                                <Check className="mr-2 h-4 w-4" />
                                                                {doc.validated ? 'Marcar como Pendente' : 'Validar'}
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
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                         <CardFooter className="border-t px-6 py-4 flex justify-between items-center">
                           <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                           <Button onClick={handleFileSelect} disabled={isUploading}>
                               {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                               {isUploading ? 'Enviando...' : 'Adicionar Arquivo'}
                           </Button>
                            <Button disabled={!documents || documents.length === 0}> <Send className="h-4 w-4 mr-2"/> Enviar para Validação</Button>
                         </CardFooter>
                      </Card>
                    </TabsContent>
                    <TabsContent value="proposals">
                        <Card>
                            <CardHeader><CardTitle>Propostas</CardTitle></CardHeader>
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
                                    {proposals.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell>{p.productName}</TableCell>
                                        <TableCell><Badge variant={p.status === 'Finalizada' ? 'default' : p.status === 'Cancelada' ? 'destructive' : 'secondary'}>{p.status}</Badge></TableCell>
                                        <TableCell className="text-right">R$ {p.value.toLocaleString('pt-BR')}</TableCell>
                                    </TableRow>
                                    ))}
                                     {proposals.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center">Nenhuma proposta encontrada.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
            </Card>
        </div>
         <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <div className="space-y-2">
                             <Label htmlFor="quiz-link">Link de Documentação para Cliente</Label>
                             <div className="flex gap-2">
                                <Input id="quiz-link" value={quizLink} readOnly />
                                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                             </div>
                             <p className="text-xs text-muted-foreground">Envie este link para o cliente solicitar a documentação.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
    </>
  )
}
