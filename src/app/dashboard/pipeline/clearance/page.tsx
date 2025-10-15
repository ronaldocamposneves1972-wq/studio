
'use client'

import Image from "next/image"
import Link from "next/link"
import {
  File,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
  Users,
  Trash2,
  Pencil,
  Send,
  Loader2,
  Check,
  ShoppingCart,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import type { Client, ClientStatus, TimelineEvent, Transaction, Product, ProposalSummary, WhatsappMessageTemplate } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
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
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking, useUser } from "@/firebase"
import { collection, doc, query, where, writeBatch, getDoc, addDoc, getDocs, limit, arrayUnion, updateDoc } from "firebase/firestore"
import { useMemo } from "react"
import { addBusinessDays, cn } from "@/lib/utils"
import { sendWhatsappMessage } from "@/lib/whatsapp"


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

function SendFormalizationDialog({
    client,
    isOpen,
    onOpenChange
}: {
    client: Client,
    isOpen: boolean,
    onOpenChange: (open: boolean) => void
}) {
    const [formalizationLink, setFormalizationLink] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const acceptedProposal = useMemo(() => client.proposals?.find(p => p.status === 'Finalizada'), [client]);

    const handleConfirm = async () => {
        if (!firestore || !client || !user || !formalizationLink || !acceptedProposal) {
            toast({
                variant: 'destructive',
                title: 'Erro de Dados',
                description: 'Informações da proposta, cliente ou link estão ausentes.',
            });
            return;
        }

        setIsSubmitting(true);
        toast({ title: 'Processando...' });

        const batch = writeBatch(firestore);
        const nowISO = new Date().toISOString();

        try {
            // --- 1. Update proposal with formalization link ---
            const clientRef = doc(firestore, 'clients', client.id);
            const proposalDocRef = doc(firestore, 'sales_proposals', acceptedProposal.id);

            const updatedProposals = client.proposals?.map(p => 
                p.id === acceptedProposal.id ? { ...p, formalizationLink } : p
            );

            batch.update(clientRef, { proposals: updatedProposals });
            batch.update(proposalDocRef, { formalizationLink });

            // --- 2. Add timeline event ---
            const timelineEvent: TimelineEvent = {
                id: `tl-${Date.now()}-formalization`,
                activity: `Link de formalização enviado ao cliente.`,
                details: `Link: ${formalizationLink}`,
                timestamp: nowISO,
                user: { name: user.displayName || user.email || 'Usuário', avatarUrl: user.photoURL || '' },
            };
            batch.update(clientRef, { timeline: arrayUnion(timelineEvent) });

            // --- 3. Commit batch ---
            await batch.commit();

            // --- 4. Send WhatsApp Message ---
            const templatesQuery = query(collection(firestore, 'whatsapp_templates'), where('stage', '==', 'Formalização'), limit(1));
            const templatesSnap = await getDocs(templatesQuery);
            if (!templatesSnap.empty) {
                const template = templatesSnap.docs[0].data() as WhatsappMessageTemplate;
                await sendWhatsappMessage(template, { clientName: client.name, formalizationLink }, client.phone);
            }
            
            toast({
                title: "Formalização Enviada!",
                description: `O link foi enviado para ${client.name}. Aguardando assinatura.`
            });
            onOpenChange(false);
            setFormalizationLink('');

        } catch (error) {
            console.error("Error sending formalization: ", error);
            toast({
                variant: 'destructive',
                title: 'Erro ao enviar formalização',
                description: error instanceof Error ? error.message : 'Não foi possível completar a operação.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Enviar Link de Formalização</DialogTitle>
                    <DialogDescription>
                        Insira o link do contrato para o cliente <strong>{client.name}</strong> assinar. A mensagem será enviada por WhatsApp.
                    </DialogDescription>
                </DialogHeader>
                 <div className="space-y-4 py-2">
                    <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
                        <p><strong>Proposta:</strong> {acceptedProposal?.productName}</p>
                        <p><strong>Valor:</strong> R$ {acceptedProposal?.value.toLocaleString('pt-br', {minimumFractionDigits: 2})}</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="formalization-link" className={cn(!formalizationLink && 'text-destructive')}>Link de Formalização (Obrigatório)</Label>
                        <Input
                            id="formalization-link"
                            value={formalizationLink}
                            onChange={(e) => setFormalizationLink(e.target.value)}
                            placeholder="https://banco.com/contrato/assinar/xyz"
                            className={cn(!formalizationLink && 'border-destructive focus-visible:ring-destructive')}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleConfirm} disabled={!formalizationLink || isSubmitting}>
                         {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar e Enviar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function ClearancePage() {
  const router = useRouter()
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser();
  const [clientToFormalize, setClientToFormalize] = useState<Client | null>(null);
  const [clientToProcess, setClientToProcess] = useState<Client | null>(null);

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    // Filter for clients in 'Aprovado' status
    return query(collection(firestore, 'clients'), where('status', '==', 'Aprovado'))
  }, [firestore])
  
  const { data: clients, isLoading } = useCollection<Client>(clientsQuery)
  
  const handleDeleteClient = (client: Client) => {
    if(!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'clients', client.id));
    toast({
      title: "Cliente excluído!",
      description: `O cliente "${client.name}" foi removido com sucesso.`,
    });
  }

  const handleContractSigned = async (client: Client, createSalesOrder: boolean) => {
      const acceptedProposal = client.proposals?.find(p => p.status === 'Finalizada');

      if (!firestore || !user || !client || !acceptedProposal) {
           toast({
                variant: 'destructive',
                title: 'Erro de Dados',
                description: 'Não foi possível localizar todos os dados necessários.',
            });
            return;
      }
      
      toast({ title: 'Processando Contrato Assinado...' });

      const batch = writeBatch(firestore);
      const nowISO = new Date().toISOString();

      try {
            // --- Update client status to Ledger ---
            const clientRef = doc(firestore, 'clients', client.id);
            batch.update(clientRef, { status: 'Ledger' });
            
            // --- Add timeline events ---
            const timelineEvents: TimelineEvent[] = [
                 {
                    id: `tl-${Date.now()}-signed`,
                    activity: `Contrato assinado pelo cliente.`,
                    timestamp: nowISO,
                    user: { name: user.displayName || user.email || 'Usuário', avatarUrl: user.photoURL || '' },
                },
                {
                    id: `tl-${Date.now()}-ledger`,
                    activity: `Status alterado para "Ledger"`,
                    details: "Cliente enviado para a etapa final de pagamento.",
                    timestamp: nowISO,
                    user: { name: user.displayName || user.email || "Usuário", avatarUrl: user.photoURL || '' }
                }
            ];
            batch.update(clientRef, { timeline: arrayUnion(...timelineEvents) });

            // --- Commit batch ---
            await batch.commit();

            toast({
                title: "Contrato Confirmado!",
                description: `O cliente ${client.name} foi movido para Ledger.`
            });

            if (createSalesOrder) {
                // Redirect to client page to open sales order dialog
                router.push(`/dashboard/clients/${client.id}?action=openSalesOrder`);
            }
            
      } catch (error) {
           console.error("Error confirming signed contract: ", error);
            toast({
                variant: 'destructive',
                title: 'Erro ao confirmar assinatura',
                description: error instanceof Error ? error.message : 'Não foi possível completar a operação.',
            });
      } finally {
        setClientToProcess(null);
      }
  };
  
  const clientList = clients || []

  const renderTableContent = (clientList: Client[]) => {
    if (isLoading) {
       return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-32"/></TableCell>
          <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-40"/></TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-28"/></TableCell>
          <TableCell><Skeleton className="h-6 w-20 rounded-full"/></TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24"/></TableCell>
          <TableCell><Skeleton className="h-8 w-8"/></TableCell>
        </TableRow>
      ))
    }

    if (clientList.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-24 text-center">
            Nenhum cliente em fase de clearance.
          </TableCell>
        </TableRow>
      )
    }
    
    return clientList.map(client => {
      const acceptedProposal = client.proposals?.find(p => p.status === 'Finalizada');
      const hasFormalizationLink = !!acceptedProposal?.formalizationLink;

      return (
      <TableRow key={client.id}>
        <TableCell className="font-medium cursor-pointer" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>{client.name}</TableCell>
        <TableCell className="hidden sm:table-cell cursor-pointer" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>{client.email}</TableCell>
        <TableCell className="hidden md:table-cell cursor-pointer" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>{client.phone}</TableCell>
        <TableCell className="cursor-pointer" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
          <Badge variant={getStatusVariant(client.status)}>{client.status}</Badge>
        </TableCell>
        <TableCell className="hidden md:table-cell cursor-pointer" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
          {client.createdAt ? new Date(client.createdAt).toLocaleDateString('pt-BR') : '-'}
        </TableCell>
        <TableCell>
            {hasFormalizationLink ? (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button size="sm">
                            <Check className="mr-2 h-4 w-4" /> Contrato Assinado
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Contrato Assinado!</AlertDialogTitle>
                        <AlertDialogDescription>
                           Deseja incluir algum produto para gerar um Pedido de Venda para <strong>{client.name}</strong>?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogAction onClick={() => handleContractSigned(client, true)}>
                            <ShoppingCart className="mr-2 h-4 w-4" /> Sim, criar Pedido
                        </AlertDialogAction>
                        <AlertDialogAction onClick={() => handleContractSigned(client, false)}>
                           Não, apenas mover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
            ) : (
                <Button variant="outline" size="sm" onClick={() => setClientToFormalize(client)}>
                    <Send className="mr-2 h-4 w-4" /> Enviar para Cliente
                </Button>
            )}
        </TableCell>
      </TableRow>
      )
    })
  }

  return (
    <>
       <Card className="mt-4">
          <CardHeader>
            <CardTitle>Clearance</CardTitle>
            <CardDescription>
              Clientes com propostas aprovadas aguardando formalização e pagamento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Criado em
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderTableContent(clientList)}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Mostrando <strong>{clientList?.length || 0}</strong> de <strong>{clientList?.length || 0}</strong>{" "}
              clientes em clearance.
            </div>
          </CardFooter>
        </Card>
        {clientToFormalize && (
            <SendFormalizationDialog
                client={clientToFormalize}
                isOpen={!!clientToFormalize}
                onOpenChange={(open) => !open && setClientToFormalize(null)}
            />
        )}
    </>
  )
}
