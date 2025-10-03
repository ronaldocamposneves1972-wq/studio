
'use client'

import { PlusCircle, MoreHorizontal } from "lucide-react"

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
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import type { Account } from "@/lib/types"
import { collection, query } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

function AccountRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
    </TableRow>
  )
}

export default function AccountsPage() {
  const firestore = useFirestore()
  const accountsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "accounts"))
  }, [firestore])
  const { data: accounts, isLoading } = useCollection<Account>(accountsQuery)

  const renderTableContent = () => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, i) => <AccountRowSkeleton key={i} />);
    }

    if (!accounts || accounts.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-24 text-center">
            Nenhuma conta encontrada.
          </TableCell>
        </TableRow>
      )
    }

    return accounts.map((account) => (
      <TableRow key={account.id}>
        <TableCell className="font-medium">{account.name}</TableCell>
        <TableCell>{account.bankName}</TableCell>
        <TableCell>
          <Badge variant="outline" className="capitalize">{account.type}</Badge>
        </TableCell>
        <TableCell className="text-right">
          R$ {account.balance.toLocaleString('pt-br', { minimumFractionDigits: 2 })}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-haspopup="true" size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem>Ver Extrato</DropdownMenuItem>
              <DropdownMenuItem>Editar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ));
  }

  return (
    <div className="flex flex-col gap-4">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas Bancárias</h1>
          <p className="text-muted-foreground">
            Gerencie suas contas bancárias e digitais.
          </p>
        </div>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Adicionar Conta
          </span>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Contas</CardTitle>
          <CardDescription>
            Visualize os saldos de todas as suas contas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Conta</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderTableContent()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
