'use client'

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import type { Proposal } from "@/lib/types"

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
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { File, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"


export default function ContractsByClientPage() {
  const firestore = useFirestore()
  const router = useRouter()

  const contractsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(
        collection(firestore, 'sales_proposals'), 
        where('status', '==', 'Finalizada'),
        orderBy('approvedAt', 'desc')
    )
  }, [firestore])

  const { data: contracts, isLoading } = useCollection<Proposal>(contractsQuery)

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
          <TableCell><Skeleton className="h-5 w-40" /></TableCell>
          <TableCell><Skeleton className="h-5 w-28" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
           <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
        </TableRow>
      ))
    }

    if (!contracts || contracts.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-24 text-center">
            Nenhum contrato finalizado encontrado.
          </TableCell>
        </TableRow>
      )
    }

    return contracts.map(contract => (
      <TableRow key={contract.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/clients/${contract.clientId}`)}>
        <TableCell className="font-medium">{contract.clientName}</TableCell>
        <TableCell>
            <div>{contract.productName}</div>
            <div className="text-xs text-muted-foreground">{contract.bankName}</div>
        </TableCell>
        <TableCell>R$ {contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
        <TableCell>{contract.approvedAt ? new Date(contract.approvedAt).toLocaleDateString('pt-BR') : '—'}</TableCell>
        <TableCell>{contract.salesRepName}</TableCell>
        <TableCell className="text-right">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => router.push(`/dashboard/clients/${contract.clientId}`)}>Ver Cliente</DropdownMenuItem>
                    {/* The page below does not exist yet */}
                    {/* <DropdownMenuItem onSelect={() => router.push(`/dashboard/proposals/${contract.id}`)}>Ver Proposta</DropdownMenuItem> */}
                </DropdownMenuContent>
            </DropdownMenu>
        </TableCell>
      </TableRow>
    ))
  }

  return (
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
                <TableHead>Atendente</TableHead>
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
  )
}
