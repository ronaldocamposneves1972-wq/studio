
'use client'

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useCollection, useFirestore, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import type { Client, Proposal, ProposalSummary } from "@/lib/types"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { File, MoreHorizontal, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"


const getProposalStatusVariant = (status: Proposal['status']) => {
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

export default function ContractsByClientPage() {
  const firestore = useFirestore()
  const router = useRouter()
  const [viewingProposalId, setViewingProposalId] = useState<string | null>(null);

  const proposalRef = useMemoFirebase(() => {
    if (!firestore || !viewingProposalId) return null;
    return doc(firestore, 'sales_proposals', viewingProposalId);
  }, [firestore, viewingProposalId]);

  const { data: viewingProposal, isLoading: isLoadingProposal } = useDoc<Proposal>(proposalRef);

  const clientsWithFinalizedProposalsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(
        collection(firestore, 'clients'), 
        where('status', '==', 'Aprovado')
    )
  }, [firestore])

  const { data: clients, isLoading } = useCollection<Client>(clientsWithFinalizedProposalsQuery);

  const contracts = useMemo(() => {
    if (!clients) return [];
    return clients.flatMap(client => 
      (client.proposals || [])
        .filter(p => p.status === 'Finalizada')
        .map(p => ({ ...p, clientName: client.name, clientId: client.id }))
    ).sort((a, b) => new Date(b.approvedAt || 0).getTime() - new Date(a.approvedAt || 0).getTime());
  }, [clients]);


  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
          <TableCell><Skeleton className="h-5 w-40" /></TableCell>
          <TableCell><Skeleton className="h-5 w-28" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
        </TableRow>
      ))
    }

    if (!contracts || contracts.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-24 text-center">
            Nenhum contrato finalizado encontrado.
          </TableCell>
        </TableRow>
      )
    }

    return contracts.map(contract => (
      <TableRow key={contract.id}>
        <TableCell className="font-medium cursor-pointer" onClick={() => router.push(`/dashboard/clients/${contract.clientId}`)}>{contract.clientName}</TableCell>
        <TableCell>
            <div>{contract.productName}</div>
            <div className="text-xs text-muted-foreground">{contract.bankName}</div>
        </TableCell>
        <TableCell>R$ {contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
        <TableCell>{contract.approvedAt ? new Date(contract.approvedAt).toLocaleDateString('pt-BR') : '—'}</TableCell>
        <TableCell className="text-right">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => setViewingProposalId(contract.id)}>
                        <Eye className="mr-2 h-4 w-4" /> Ver Detalhes da Proposta
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => router.push(`/dashboard/clients/${contract.clientId}`)}>Ver Cliente</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <>
    <Dialog open={!!viewingProposalId} onOpenChange={(open) => !open && setViewingProposalId(null)}>
        <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
                <DialogTitle>Detalhes da Proposta</DialogTitle>
                <DialogDescription>
                    Informações completas do contrato finalizado.
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
                                <Button asChild variant="secondary" className="w-full justify-start">
                                    <a href={viewingProposal.formalizationLink} target="_blank" rel="noopener noreferrer" className="truncate">
                                        {viewingProposal.formalizationLink}
                                    </a>
                                </Button>
                             </div>
                         </div>
                    )}
                </div>
            )}
        </DialogContent>
      </Dialog>

    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contratos por Cliente</h1>
          <p className="text-muted-foreground">
            Consulte todas as propostas com status "Finalizada".
          </p>
        </div>
         <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1">
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Exportar
                </span>
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Contratos Finalizados</CardTitle>
          <CardDescription>
            A lista abaixo contém todas as propostas que foram aceitas e finalizadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Produto/Banco</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data de Finalização</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderContent()}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
                Mostrando <strong>{contracts?.length || 0}</strong> contratos.
            </div>
        </CardFooter>
      </Card>
    </div>
    </>
  )
}
