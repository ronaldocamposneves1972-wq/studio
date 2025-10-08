
'use client'

import {
  File,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"

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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Skeleton } from "@/components/ui/skeleton"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import type { Proposal, ProposalStatus } from "@/lib/types"
import { useState } from "react"

const getStatusVariant = (status: ProposalStatus) => {
  switch (status) {
    case 'Finalizada':
      return 'default';
    case 'Cancelada':
      return 'destructive';
    case 'Em negociação':
      return 'secondary';
    case 'Aberta':
      return 'outline';
    default:
      return 'secondary';
  }
}

export default function ProposalsPage() {
  const router = useRouter()
  const firestore = useFirestore()
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<ProposalStatus | 'all'>('all')


  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (activeTab === 'all') {
      // It's better to avoid querying all documents if security rules don't allow it.
      // If you have a role that can see all, you'd check for that role here.
      // For a salesperson, it's safer to only allow querying their own proposals.
      return query(collection(firestore, 'sales_proposals'), where('salesRepId', '==', user.uid));
    }
    // Filter by both salesRepId and status for other tabs
    return query(
      collection(firestore, 'sales_proposals'),
      where('salesRepId', '==', user.uid),
      where('status', '==', activeTab)
    );
  }, [firestore, user, activeTab]);

  const { data: proposals, isLoading } = useCollection<Proposal>(proposalsQuery)

  const renderTableContent = (proposalList: Proposal[] | null) => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-32"/></TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-40"/></TableCell>
          <TableCell><Skeleton className="h-6 w-20 rounded-full"/></TableCell>
          <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto"/></TableCell>
          <TableCell><Skeleton className="h-8 w-8 ml-auto"/></TableCell>
        </TableRow>
      ))
    }

    if (!proposalList || proposalList.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-24 text-center">
            Nenhuma proposta encontrada.
          </TableCell>
        </TableRow>
      )
    }

    return proposalList.map(proposal => (
      <TableRow key={proposal.id} onClick={() => router.push(`/dashboard/clients/${proposal.clientId}`)} className="cursor-pointer">
        <TableCell className="font-medium">{proposal.clientName}</TableCell>
        <TableCell className="hidden md:table-cell">{proposal.productName}</TableCell>
        <TableCell>
          <Badge variant={getStatusVariant(proposal.status)}>{proposal.status}</Badge>
        </TableCell>
        <TableCell className="text-right">R$ {proposal.value.toLocaleString('pt-br')}</TableCell>
        <TableCell onClick={e => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-haspopup="true" size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Alternar menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => router.push(`/dashboard/clients/${proposal.clientId}`)}>
                <Users className="mr-2 h-4 w-4" /> Ver Cliente
              </DropdownMenuItem>
              <DropdownMenuItem>Enviar por WhatsApp</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))
  }


  return (
    <Tabs defaultValue="all" onValueChange={(value) => setActiveTab(value as any)}>
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="Aberta">Abertas</TabsTrigger>
          <TabsTrigger value="Finalizada">Finalizadas</TabsTrigger>
          <TabsTrigger value="Cancelada" className="hidden sm:flex">
            Canceladas
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Exportar
            </span>
          </Button>
        </div>
      </div>
      <TabsContent value={activeTab}>
        <Card>
          <CardHeader>
            <CardTitle>Minhas Propostas</CardTitle>
            <CardDescription>
              Gerencie suas propostas de vendas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Produto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderTableContent(proposals)}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Mostrando <strong>{proposals?.length || 0}</strong> propostas.
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
