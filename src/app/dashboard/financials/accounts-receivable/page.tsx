
'use client'

import {
  File,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
  Search,
  CheckCircle2,
  CalendarIcon,
  Loader2,
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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import type { Transaction, Account } from "@/lib/types"
import { collection, query, where, doc, updateDoc, writeBatch, getDoc, increment } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


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

const markAsPaidSchema = z.object({
  paymentDate: z.date({
    required_error: "A data de pagamento é obrigatória.",
  }),
  accountId: z.string({
    required_error: "Selecione a conta creditada.",
  }),
});

type MarkAsPaidFormData = z.infer<typeof markAsPaidSchema>;

function MarkAsPaidDialog({
  isOpen,
  onOpenChange,
  transaction,
  accounts,
  onConfirm,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  transaction: Transaction | null;
  accounts: Account[] | null;
  onConfirm: (transaction: Transaction, data: MarkAsPaidFormData) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<MarkAsPaidFormData>({
    resolver: zodResolver(markAsPaidSchema),
    defaultValues: {
      paymentDate: new Date(),
    }
  });

  const onSubmit = async (data: MarkAsPaidFormData) => {
    if (!transaction) return;
    setIsSubmitting(true);
    await onConfirm(transaction, data);
    setIsSubmitting(false);
  }

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar como Recebida</DialogTitle>
          <DialogDescription>
            Confirme os detalhes do recebimento para a transação "{transaction.description}".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4 space-y-1 text-sm">
            <p><strong>Descrição:</strong> {transaction.description}</p>
            <p><strong>Valor:</strong> R$ {transaction.amount.toLocaleString('pt-br', { minimumFractionDigits: 2 })}</p>
            <p><strong>Vencimento:</strong> {new Date(transaction.dueDate).toLocaleDateString('pt-BR')}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="paymentDate" className={errors.paymentDate ? "text-destructive" : ""}>Data de Compensação</Label>
              <Controller
                  control={control}
                  name="paymentDate"
                  render={({ field }) => (
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button
                                  variant={"outline"}
                                  className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground",
                                      errors.paymentDate && "border-destructive"
                                  )}
                              >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : <span>Selecione uma data</span>}
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                              <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                              />
                          </PopoverContent>
                      </Popover>
                  )}
              />
              {errors.paymentDate && <p className="text-sm text-destructive">{errors.paymentDate.message}</p>}
            </div>
             <div className="grid gap-2">
              <Label htmlFor="accountId" className={errors.accountId ? "text-destructive" : ""}>Conta Creditada</Label>
               <Controller
                control={control}
                name="accountId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.bankName})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
               {errors.accountId && <p className="text-sm text-destructive">{errors.accountId.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Recebimento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
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
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isMarkAsPaidDialogOpen, setIsMarkAsPaidDialogOpen] = useState(false);
  const [transactionToPay, setTransactionToPay] = useState<Transaction | null>(null);
  
  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "transactions"), where("type", "==", "income"))
  }, [firestore])

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery)
  
  const accountsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "accounts"))
  }, [firestore]);
  const { data: accounts } = useCollection<Account>(accountsQuery);

  const handleMarkAsPaid = async (transaction: Transaction, data: MarkAsPaidFormData) => {
    if (!firestore) return;

    const batch = writeBatch(firestore);
    
    // 1. Update Transaction
    const transactionRef = doc(firestore, 'transactions', transaction.id);
    const selectedAccount = accounts?.find(a => a.id === data.accountId);
    batch.update(transactionRef, {
        status: 'paid',
        paymentDate: data.paymentDate.toISOString().split('T')[0],
        accountId: data.accountId,
        accountName: selectedAccount?.name || '',
    });

    // 2. Update Account Balance
    const accountRef = doc(firestore, 'accounts', data.accountId);
    batch.update(accountRef, {
      balance: increment(transaction.amount)
    });

    try {
      await batch.commit();
      toast({
        title: "Transação atualizada!",
        description: "A conta foi marcada como recebida e o saldo atualizado.",
      });
      setIsMarkAsPaidDialogOpen(false);
      setTransactionToPay(null);
    } catch (error) {
      console.error("Error marking as paid: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Não foi possível marcar a transação como recebida.",
      });
    }
  }
  
  const openMarkAsPaidDialog = (transaction: Transaction) => {
    setTransactionToPay(transaction);
    setIsMarkAsPaidDialogOpen(true);
  }

  const filteredTransactions = useMemo(() => {
    if (!transactions) return null;
    if (!searchTerm) return transactions;
    return transactions.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <TableCell>
            <div className="font-medium">{transaction.description}</div>
            <div className="text-xs text-muted-foreground">{transaction.clientName}</div>
        </TableCell>
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
              <DropdownMenuItem onSelect={() => openMarkAsPaidDialog(transaction)} disabled={transaction.status === 'paid'}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Marcar como Recebida
              </DropdownMenuItem>
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem>Excluir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <>
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
                                placeholder="Pesquisar..."
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
         <MarkAsPaidDialog
            isOpen={isMarkAsPaidDialogOpen}
            onOpenChange={setIsMarkAsPaidDialogOpen}
            transaction={transactionToPay}
            accounts={accounts}
            onConfirm={handleMarkAsPaid}
        />
    </>
  )
}
