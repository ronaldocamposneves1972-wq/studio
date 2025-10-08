
'use client'

import {
  File,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
  Search,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import { Input } from "@/components/ui/input"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import type { Transaction } from "@/lib/types"
import { collection, query, where } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const getStatusVariant = (status: 'pending' | 'paid' | 'overdue') => {
  switch (status) {
    case 'paid':
      return 'default';
    case 'overdue':
      return 'destructive';
    case 'pending':
    default:
      return 'secondary';
  }
}

function TransactionRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
    </TableRow>
  )
}

export default function AccountsReceivablePage() {
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  
  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "transactions"), where("type", "==", "income"))
  }, [firestore])

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery)

  const filteredTransactions = useMemo(() => {
    if (!transactions) return null;
    if (!searchTerm) return transactions;
    return transactions.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  const renderTableContent = (transactionList: Transaction[] | null) => {
     if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => <TransactionRowSkeleton key={i} />)
    }

    if (!transactionList || transactionList.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-24 text-center">
            Nenhuma conta a receber encontrada.
          </TableCell>
        </TableRow>
      )
    }
    
    return transactionList.map(transaction => (
      <TableRow key={transaction.id}>
        <TableCell className="font-medium">{transaction.description}</TableCell>
        <TableCell>
            <Badge variant={getStatusVariant(transaction.status)}>{transaction.status}</Badge>
        </TableCell>
        <TableCell>
            <span className={cn(
                "font-medium",
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
            )}>
              {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-br')}
            </span>
        </TableCell>
        <TableCell className="hidden md:table-cell">{transaction.category}</TableCell>
        <TableCell className="hidden md:table-cell">
          {new Date(transaction.dueDate).toLocaleDateString('pt-BR')}
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
              <DropdownMenuItem>Marcar como Recebida</DropdownMenuItem>
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem>Excluir</DropdownMenuItem>
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
            <h1 className="text-2xl font-bold tracking-tight">Contas a Receber</h1>
            <p className="text-muted-foreground">
                Gerencie suas receitas e recebimentos.
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
        <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="paid">Recebidas</TabsTrigger>
          <TabsTrigger value="overdue">Atrasadas</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle>Receitas</CardTitle>
                        <CardDescription>
                            Visualize e gerencie todas as suas contas a receber.
                        </CardDescription>
                    </div>
                     <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Pesquisar por título..."
                            className="pl-8 sm:w-[300px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead className="hidden md:table-cell">Vencimento</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderTableContent(filteredTransactions)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
    </div>
  )
}
