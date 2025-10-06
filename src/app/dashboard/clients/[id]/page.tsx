
'use client'

import Image from "next/image"
import Link from "next/link"
import {
  ChevronLeft,
  Copy,
  CreditCard,
  File,
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
import { useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { doc, arrayUnion } from "firebase/firestore"
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
    if (activity.toLowerCase().includes('proposta')) return <File className="h-4 w-4 text-muted-foreground" />;
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

  const clientRef = useMemoFirebase(() => {
    if (!firestore || !clientId) return null
    return doc(firestore, 'clients', clientId)
  }, [firestore, clientId])

  const { data: client, isLoading: isLoadingClient } = useDoc<Client>(clientRef);

  const proposals = allProposals.filter(p => p.clientName === client?.name)

  const handleStatusChange = (newStatus: ClientStatus) => {
    if (!clientRef) return;
    updateDocumentNonBlocking(clientRef, { status: newStatus });
    toast({
      title: "Status atualizado!",
      description: `O status do cliente foi alterado para ${newStatus}.`,
    })
  }
  
  const handleDeleteClient = () => {
    if (!clientRef) return;
    deleteDocumentNonBlocking(clientRef);
    toast({
      title: "Cliente excluído!",
      description: "O cliente foi removido com sucesso.",
    });
    router.push('/dashboard/clients');
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
      // NOTE: This approach uses an unsigned upload preset for simplicity.
      // For production, a signed upload from a server-side route is more secure.
      const formData = new FormData();
      formData.append('file', file);
      // This is a common preset name, but you must create an 'unsigned' upload preset 
      // in your Cloudinary account and name it 'consorciatech' or change this value.
      formData.append('upload_preset', 'consorciatech'); 
      formData.append('folder', `clients/${clientId}`);

      // You need to set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in your .env.local file
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) {
        throw new Error('A variável de ambiente NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME não está definida.');
      }
      
      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Falha no upload para o Cloudinary.');
      }

      const cloudinaryData = await uploadResponse.json();

      const newDocument: ClientDocument = {
        id: cloudinaryData.public_id,
        clientId: clientId,
        fileName: cloudinaryData.original_filename || file.name,
        fileType: cloudinaryData.resource_type || 'raw',
        cloudinaryPublicId: cloudinaryData.public_id,
        secureUrl: cloudinaryData.secure_url,
        uploadedAt: new Date().toISOString(),
      };
      
      await updateDocumentNonBlocking(clientRef, {
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
        description: error instanceof Error ? error.message : 'Não foi possível enviar o arquivo. Verifique as configurações do Cloudinary.',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  const translatedLabels: { [key: string]: string } = {
    'name': 'Nome', 'email': 'Email', 'phone': 'Telefone', 'cpf': 'CPF', 'birthdate': 'Data de Nascimento',
    'mothername': 'Nome da Mãe', 'cep': 'CEP', 'address': 'Endereço', 'complement': 'Complemento', 'number': 'Número',
    'neighborhood': 'Bairro', 'city': 'Cidade', 'state': 'Estado',
  };

  const fieldOrder = ['name', 'cpf', 'birthdate', 'phone', 'email', 'mothername', 'cep', 'address', 'number', 'complement', 'neighborhood', 'city', 'state'];

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
          <Button className="mt-4" asChild>
            <Link href="/dashboard/clients">Voltar para Clientes</Link>
          </Button>
        </div>
      </div>
    )
  }

  const documents = client.documents || [];

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-[1fr_250px] lg:grid-cols-[1fr_350px]">
            <div className="grid auto-rows-max items-start gap-4 lg:col-span-2">
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
                                <Select onValueChange={handleStatusChange} value={client.status}>
                                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Novo"><Badge variant="secondary" className="mr-2"/>Novo</SelectItem>
                                        <SelectItem value="Em análise"><Badge variant="secondary" className="mr-2"/>Em análise</SelectItem>
                                        <SelectItem value="Pendente"><Badge variant="outline" className="mr-2"/>Pendente</SelectItem>
                                        <SelectItem value="Aprovado"><Badge variant="default" className="mr-2"/>Aprovado</SelectItem>
                                        <SelectItem value="Reprovado"><Badge variant="destructive" className="mr-2"/>Reprovado</SelectItem>
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
                                        <p className="text-muted-foreground">Clique no botão abaixo para adicionar documentos.</p>
                                    </div>
                                )}
                                {documents.length > 0 && (
                                     <Table>
                                        <TableHeader>
                                            <TableRow>
                                            <TableHead>Nome do Arquivo</TableHead>
                                            <TableHead className="hidden sm:table-cell">Tipo</TableHead>
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
                                                    <TableCell className="hidden md:table-cell">{new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <a href={doc.secureUrl} target="_blank" rel="noopener noreferrer">
                                                                <Download className="mr-2 h-4 w-4" />
                                                                Baixar
                                                            </a>
                                                        </Button>
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
          </div>
        </div>
    </div>
  )
}

    