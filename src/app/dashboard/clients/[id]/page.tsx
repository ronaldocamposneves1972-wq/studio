

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
  Activity
} from "lucide-react"

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
import type { Client, ClientStatus, TimelineEvent, Proposal } from "@/lib/types"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDoc, useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { doc, collection, query, where } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"

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


export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();

  const clientRef = useMemoFirebase(() => {
    if (!firestore || !params.id) return null
    return doc(firestore, 'clients', params.id)
  }, [firestore, params.id])

  const { data: client, isLoading: isLoadingClient } = useDoc<Client>(clientRef);

  // TODO: Fetch proposals from Firestore
  const proposals = allProposals.filter(p => p.clientName === client?.name)

  const docRg = PlaceHolderImages.find(i => i.id === 'document-rg');
  const docCnh = PlaceHolderImages.find(i => i.id === 'document-cnh');
  const docProof = PlaceHolderImages.find(i => i.id === 'document-proof');


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
            O cliente que você está procurando não existe ou você não tem permissão para vê-lo.
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
                                <Select defaultValue={client.status}>
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
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <Tabs defaultValue="quiz">
                        <TabsList className="mb-4">
                          <TabsTrigger value="quiz">Ficha Inicial</TabsTrigger>
                          <TabsTrigger value="history">Histórico</TabsTrigger>
                          <TabsTrigger value="documents">Documentos</TabsTrigger>
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
                                    Object.entries(client.answers).map(([key, value]) => {
                                      // Find the question text from the original quiz if available
                                      // This part is complex without fetching the quiz definition itself
                                      const questionLabel = key.replace('q-', '').replace('-', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                      return(
                                        <div className="grid gap-1" key={key}>
                                          <p className="font-medium">{questionLabel}</p>
                                          <p className="text-muted-foreground">{value || "Não informado"}</p>
                                        </div>
                                      )
                                     })
                                  ) : (
                                    <p className="text-muted-foreground">Nenhuma resposta do quiz encontrada.</p>
                                  )}
                                </CardContent>
                                <CardFooter className="border-t px-6 py-4 flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">Link do Quiz: <span className="font-mono text-primary">/q/{client.id.slice(0,8)}</span></p>
                                    <Button variant="outline" size="sm"><Copy className="h-3 w-3 mr-2" /> Copiar Link</Button>
                                </CardFooter>
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
                              <CardDescription>Documentos enviados pelo cliente para análise.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 md:grid-cols-3">
                              {[docCnh, docRg, docProof].map((doc, index) => (
                                doc && (
                                <Card key={index}>
                                  <CardContent className="p-2">
                                    <Image src={doc.imageUrl} alt={doc.description} width={600} height={400} className="rounded-md object-cover aspect-video" data-ai-hint={doc.imageHint} />
                                  </CardContent>
                                  <CardFooter className="flex justify-between p-2 pt-0">
                                    <p className="text-sm font-medium">{doc.description.split("a ")[1]}</p>
                                    <Badge variant="default"><CheckCircle2 className="h-3 w-3 mr-1" /> Validado</Badge>
                                  </CardFooter>
                                </Card>
                                )
                              ))}
                            </CardContent>
                             <CardFooter className="border-t px-6 py-4">
                                <Button> <Send className="h-4 w-4 mr-2"/> Enviar para Validação</Button>
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

    

    