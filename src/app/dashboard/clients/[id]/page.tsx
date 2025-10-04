

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
  FileText
} from "lucide-react"
import { useState, useEffect } from "react"
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
import { useDoc, useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { doc, collection, query, where } from "firebase/firestore"
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

  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);


  const clientRef = useMemoFirebase(() => {
    if (!firestore || !clientId) return null
    return doc(firestore, 'clients', clientId)
  }, [firestore, clientId])

  const { data: client, isLoading: isLoadingClient } = useDoc<Client>(clientRef);

  // TODO: Fetch proposals from Firestore
  const proposals = allProposals.filter(p => p.clientName === client?.name)

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => {
        toast({ title: 'Sucesso!', description: message });
    }).catch(err => {
        toast({ variant: 'destructive', title: 'Erro!', description: 'Não foi possível copiar o link.' });
    });
  };

  const handleGenerateDocLink = () => {
    const quizLink = `${window.location.origin}/q/${client?.id}`;
    setGeneratedLink(quizLink);
    setCooldown(600); // 10 minutes in seconds
    toast({ title: 'Link Gerado!', description: 'O link para envio de documentos foi criado e está visível abaixo.' });
  }

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

  const isProfileComplete = (client: Client | null): boolean => {
    if (!client) return false;

    const isFilled = (value: any) => value !== undefined && value !== null && value !== '';

    // Lista de campos obrigatórios para gerar o link.
    const requiredFields = [
        'name', 'cpf', 'birthDate', 'phone', 'email', 'motherName',
        'cep', 'address' 
        // 'complement' é opcional. 'number' está incluso no 'address'.
    ];

    // Checa se todos os campos obrigatórios estão preenchidos.
    return requiredFields.every(fieldKey => {
        // Tenta encontrar o valor no objeto principal (ex: client.name)
        if (isFilled((client as any)[fieldKey])) {
            return true;
        }

        // Se não encontrar, tenta no objeto de respostas do quiz.
        if (client.answers) {
            // Verifica a chave do quiz (ex: 'q-name')
            if (isFilled(client.answers[`q-${fieldKey}`])) {
                return true;
            }
             // Verifica chaves com variações de capitalização (ex: 'q-birthdate')
            if (isFilled(client.answers[`q-${fieldKey.toLowerCase()}`])) {
                return true;
            }
        }
        
        // Se não encontrou em nenhum lugar, o campo está faltando.
        return false;
    });
}

  const profileComplete = isProfileComplete(client);

  const translatedLabels: { [key: string]: string } = {
    'name': 'Nome',
    'email': 'Email',
    'phone': 'Telefone',
    'cpf': 'CPF',
    'birthdate': 'Data de Nascimento',
    'mothername': 'Nome da Mãe',
    'cep': 'CEP',
    'address': 'Endereço',
    'complement': 'Complemento',
    'number': 'Número',
    'neighborhood': 'Bairro',
    'city': 'Cidade',
    'state': 'Estado',
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
          <h3 className="text-2xl font-bold tracking-tight">
            Cliente não encontrado
          </h3>
          <p className="text-sm text-muted-foreground">
            O cliente que você está procurando não existe ou foi excluído.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/clients">Voltar para Clientes</Link>
          </Button>
        </div>
      </div>
    )
  }


  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-[1fr_250px] lg:grid-cols-[1fr_350px]">
            <div className="grid auto-rows-max items-start gap-4 lg:col-span-2">
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <Image
                                    alt="Avatar do Cliente"
                                    className="aspect-square rounded-full object-cover"
                                    height="64"
                                    src={`https://picsum.photos/seed/${client.id}/100/100`}
                                    width="64"
                                    data-ai-hint="person portrait"
                                />
                                <div className="grid gap-1">
                                    <CardTitle className="text-2xl">{client.name}</CardTitle>
                                    <CardDescription>
                                    {client.email} &middot; {client.phone}
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select onValueChange={handleStatusChange} value={client.status}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Novo"><Badge variant="secondary" className="mr-2"/>Novo</SelectItem>
                                        <SelectItem value="Em análise"><Badge variant="secondary" className="mr-2"/>Em análise</SelectItem>
                                        <SelectItem value="Pendente"><Badge variant="outline" className="mr-2"/>Pendente</SelectItem>
                                        <SelectItem value="Aprovado"><Badge variant="default" className="mr-2"/>Aprovado</SelectItem>
                                        <SelectItem value="Reprovado"><Badge variant="destructive" className="mr-2"/>Reprovado</SelectItem>
                                    </SelectContent>
                                </Select>
                                 <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="icon" variant="outline">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Editar Cliente
                                    </DropdownMenuItem>
                                     <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                          onSelect={(e) => e.preventDefault()}
                                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Excluir Cliente
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. Isso irá deletar permanentemente o cliente <strong>{client.name}</strong>.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={handleDeleteClient}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
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
                               <CardHeader>
                                   <CardTitle>Linha do Tempo</CardTitle>
                               </CardHeader>
                               <CardContent>
                                  <Timeline events={client.timeline} />
                               </CardContent>
                           </Card>
                        </TabsContent>
                        <TabsContent value="documents">
                          <Card>
                            <CardHeader>
                              <CardTitle>Documentos</CardTitle>
                              <CardDescription>Gerencie os documentos enviados pelo cliente para análise.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {(!client.documents || client.documents.length === 0) && (
                                    <div className={cn(
                                        "flex flex-col items-center justify-center text-center gap-4 min-h-60 rounded-lg border-2 border-dashed p-6",
                                        generatedLink && "hidden"
                                    )}>
                                        <Upload className="h-12 w-12 text-muted-foreground" />
                                        <h3 className="text-xl font-semibold">Nenhum documento enviado</h3>
                                        <p className="text-muted-foreground">Solicite os documentos do cliente gerando um link seguro.</p>
                                    </div>
                                )}
                                {client.documents && client.documents.length > 0 && (
                                     <Table>
                                        <TableHeader>
                                            <TableRow>
                                            <TableHead>Nome do Arquivo</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {client.documents.map((doc, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                        {doc.name}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
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
                                 <Separator className="my-4" />
                                 <div className="space-y-4">
                                    {!profileComplete && (
                                        <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertTitle>Dados Incompletos</AlertTitle>
                                        <AlertDescription>
                                            É necessário que todos os dados da "Ficha Inicial" estejam preenchidos para gerar o link de envio de documentos.
                                        </AlertDescription>
                                        </Alert>
                                    )}
                                    {generatedLink ? (
                                    <div className="w-full space-y-4">
                                        <p className="text-sm text-muted-foreground">O link abaixo foi gerado para o cliente enviar a documentação. Você pode copiá-lo e enviar via WhatsApp ou E-mail.</p>
                                        <div className="flex items-center space-x-2">
                                            <Input value={generatedLink} readOnly />
                                            <Button onClick={() => copyToClipboard(generatedLink, "Link copiado para a área de transferência!")}><Copy className="h-4 w-4" /></Button>
                                        </div>
                                        {cooldown > 0 && (
                                            <p className="text-xs text-muted-foreground text-center">
                                                Você poderá gerar um novo link em {Math.floor(cooldown / 60)}:{(cooldown % 60).toString().padStart(2, '0')}
                                            </p>
                                        )}
                                    </div>
                                    ) : (
                                        <div className="flex justify-center">
                                            <Button onClick={handleGenerateDocLink} disabled={!profileComplete || cooldown > 0}>
                                                <Link2 className="mr-2 h-4 w-4" />
                                                { 'Gerar Link de Documentos'}
                                            </Button>
                                        </div>
                                    )}
                                 </div>
                            </CardContent>
                             <CardFooter className="border-t px-6 py-4 flex justify-end">
                                <Button disabled={!client.documents || client.documents.length === 0}> <Send className="h-4 w-4 mr-2"/> Enviar para Validação</Button>
                             </CardFooter>
                          </Card>
                        </TabsContent>
                        <TabsContent value="proposals">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Propostas</CardTitle>
                                </CardHeader>
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

    

    