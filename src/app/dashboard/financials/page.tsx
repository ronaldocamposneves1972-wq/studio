
'use client'

import { DollarSign, File } from "lucide-react"
import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import type { Proposal, ProposalStatus } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

export default function FinancialsPage() {
  const firestore = useFirestore()

  const finalizedProposalsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, 'sales_proposals'), where('status', '==', 'Finalizada'))
  }, [firestore])

  const { data: finalizedProposals, isLoading } = useCollection<Proposal>(finalizedProposalsQuery)

  const commissions = useMemo(() => {
    if (!finalizedProposals) return [];
    return finalizedProposals.map(p => ({
      ...p,
      commission: p.value * 0.025, // Assume 2.5% commission
      paymentStatus: (p as any).paymentStatus || 'A Pagar', // Placeholder logic
    }))
  }, [finalizedProposals])


  const { totalPaid, totalPayable } = useMemo(() => {
      if (!commissions) return { totalPaid: 0, totalPayable: 0 };
      const paid = commissions.filter(c => c.paymentStatus === 'Paga').reduce((sum, c) => sum + c.commission, 0);
      const payable = commissions.filter(c => c.paymentStatus === 'A Pagar').reduce((sum, c) => sum + c.commission, 0);
      return { totalPaid: paid, totalPayable: payable };
  }, [commissions]);


  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Acompanhe as comissões e o desempenho financeiro.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido (Mês)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">R$ {totalPaid.toLocaleString('pt-br')}</div> }
            <p className="text-xs text-muted-foreground">+5.2% vs. mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões a Pagar</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">R$ {totalPayable.toLocaleString('pt-br')}</div> }
            <p className="text-xs text-muted-foreground">Vencimento próximo: R$ {(totalPayable*0.3).toLocaleString('pt-br')}</p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="paid">Pagas</TabsTrigger>
            <TabsTrigger value="payable">A Pagar</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Exportar</span>
            </Button>
          </div>
        </div>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Extrato de Comissões</CardTitle>
              <CardDescription>
                Detalhes de todas as comissões geradas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venda (ID)</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Atendente</TableHead>
                    <TableHead>Status Pagamento</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                     Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                        </TableRow>
                     ))
                  ) : (
                    commissions.map(c => (
                        <TableRow key={c.id}>
                        <TableCell className="font-mono">{c.id.substring(0,8).toUpperCase()}</TableCell>
                        <TableCell>{c.clientName}</TableCell>
                        <TableCell className="hidden md:table-cell">{c.salesRepName}</TableCell>
                        <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.paymentStatus === 'Paga' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                            {c.paymentStatus}
                            </span>
                        </TableCell>
                        <TableCell className="text-right">R$ {c.commission.toLocaleString('pt-br')}</TableCell>
                        </TableRow>
                    ))
                  )}
                   {!isLoading && commissions.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">Nenhuma comissão encontrada.</TableCell>
                        </TableRow>
                   )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
