
'use client'

import { useState, useMemo, useEffect } from "react"
import {
  File,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
  Loader2,
  CalendarIcon,
  Search,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import type { Transaction, Supplier, CostCenter, ExpenseCategory } from "@/lib/types"
import { collection, query, where, addDoc, doc } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import Link from "next/link"
import { Combobox } from "@/components/ui/combobox"


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

const expenseSchema = z.object({
  description: z.string().min(3, "A descrição é obrigatória."),
  amount: z.preprocess(
    (a) => parseFloat(String(a).replace(/\./g, '').replace(',', '.')),
    z.number().positive("O valor deve ser positivo.")
  ),
  dueDate: z.date({ required_error: "A data de vencimento é obrigatória." }),
  supplierId: z.string().optional(),
  costCenterId: z.string().optional(),
  categoryId: z.string({ required_error: "A categoria é obrigatória." }),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

function ExpenseDialog({
  isOpen,
  onOpenChange,
  onSave,
  suppliers,
  costCenters,
  categories,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: ExpenseFormData) => Promise<void>;
  suppliers: Supplier[] | null;
  costCenters: CostCenter[] | null;
  categories: ExpenseCategory[] | null;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { control, register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
  });
  
  const selectedCategoryId = watch('categoryId');
  const [costCenterName, setCostCenterName] = useState('');


  useEffect(() => {
    if (selectedCategoryId && categories) {
      const category = categories.find(c => c.id === selectedCategoryId);
      if (category?.costCenterId && category?.costCenterName) {
        setValue('costCenterId', category.costCenterId);
        setCostCenterName(category.costCenterName);
      } else {
        setValue('costCenterId', '');
        setCostCenterName('');
      }
    } else {
        setCostCenterName('');
    }
  }, [selectedCategoryId, categories, setValue]);


  const onSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true);
    await onSave(data);
    setIsSubmitting(false);
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const digitsOnly = value.replace(/[^\d]/g, '');
    if (!digitsOnly) {
      // @ts-ignore
      control.fieldsRef.current.amount.value = '';
      return;
    }
    const numberValue = parseInt(digitsOnly, 10);
    const formatted = (numberValue / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    e.target.value = formatted;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Nova Despesa</DialogTitle>
          <DialogDescription>
            Preencha os detalhes para registrar uma nova conta a pagar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Input id="description" {...register('description')} placeholder="Ex: Aluguel do escritório" />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Input id="amount" {...register('amount')} placeholder="1.500,00" onChange={handleAmountChange} />
                    {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="dueDate">Data de Vencimento</Label>
                    <Controller
                        control={control}
                        name="dueDate"
                        render={({ field }) => (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "PPP") : <span>Selecione uma data</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                </PopoverContent>
                            </Popover>
                        )}
                    />
                    {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate.message}</p>}
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="supplierId">Fornecedor (Opcional)</Label>
                <Controller
                    control={control}
                    name="supplierId"
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Selecione um fornecedor" /></SelectTrigger>
                        <SelectContent>
                        {suppliers?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    )}
                />
               </div>
            
             <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="categoryId">Tipo de Despesa</Label>
                    <Controller
                        control={control}
                        name="categoryId"
                        render={({ field }) => (
                            <Combobox
                                items={categories?.map(c => ({ value: c.id, label: c.name })) || []}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Pesquisar tipo..."
                                searchPlaceholder="Buscar tipo de despesa..."
                                notFoundMessage={
                                    <span>Nenhum tipo encontrado. <Link href="/dashboard/expense-categories" className='text-primary underline'>Cadastrar</Link></span>
                                }
                            />
                        )}
                    />
                    {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="costCenterName">Centro de Custo</Label>
                    <Input
                        id="costCenterName"
                        value={costCenterName}
                        readOnly
                        disabled
                        placeholder="Automático"
                        className="bg-muted"
                    />
               </div>
            </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Despesa
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

export default function AccountsPayablePage() {
  const firestore = useFirestore()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "transactions"), where("type", "==", "expense"))
  }, [firestore])
  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery)
  
  const suppliersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "suppliers")) : null, [firestore]);
  const { data: suppliers } = useCollection<Supplier>(suppliersQuery);

  const costCentersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "cost_centers")) : null, [firestore]);
  const { data: costCenters } = useCollection<CostCenter>(costCentersQuery);
  
  const categoriesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "expense_categories")) : null, [firestore]);
  const { data: categories } = useCollection<ExpenseCategory>(categoriesQuery);
  
  const filteredTransactions = useMemo(() => {
    if (!transactions) return null;
    if (!searchTerm) return transactions;
    return transactions.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  const handleSaveExpense = async (data: ExpenseFormData) => {
    if (!firestore) return;

    const supplier = suppliers?.find(s => s.id === data.supplierId);
    const category = categories?.find(c => c.id === data.categoryId);
    // The cost center is now derived from the category, not directly from the form
    const costCenter = costCenters?.find(c => c.id === category?.costCenterId);
    
    const newTransaction: Omit<Transaction, 'id'> = {
        description: data.description,
        amount: data.amount,
        dueDate: format(data.dueDate, "yyyy-MM-dd"),
        type: 'expense',
        status: 'pending',
        supplierId: data.supplierId,
        supplierName: supplier?.name,
        costCenterId: costCenter?.id,
        costCenterName: costCenter?.name,
        categoryId: data.categoryId,
        category: category?.name,
        accountId: '', // This would be set upon payment
    }

    try {
        await addDoc(collection(firestore, 'transactions'), newTransaction);
        toast({ title: "Despesa criada com sucesso!" });
        setIsDialogOpen(false);
    } catch (error) {
        console.error("Error creating expense:", error);
        toast({ variant: 'destructive', title: "Erro ao criar despesa" });
    }
  }

  const renderTableContent = (transactionList: Transaction[] | null) => {
     if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => <TransactionRowSkeleton key={i} />)
    }

    if (!transactionList || transactionList.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-24 text-center">
            Nenhuma conta a pagar encontrada.
          </TableCell>
        </TableRow>
      )
    }
    
    return transactionList.map(transaction => (
      <TableRow key={transaction.id}>
        <TableCell>
            <div className="font-medium">{transaction.description}</div>
            <div className="text-xs text-muted-foreground">{transaction.supplierName}</div>
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
        <TableCell className="hidden md:table-cell">{transaction.category || 'N/A'}</TableCell>
        <TableCell className="hidden md:table-cell">{transaction.costCenterName || 'N/A'}</TableCell>
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
              <DropdownMenuItem>Marcar como Paga</DropdownMenuItem>
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
            <h1 className="text-2xl font-bold tracking-tight">Contas a Pagar</h1>
            <p className="text-muted-foreground">
                Gerencie suas despesas e pagamentos.
            </p>
            </div>
             <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8 gap-1">
                    <File className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Exportar
                    </span>
                </Button>
                <Button size="sm" className="h-8 gap-1" onClick={() => setIsDialogOpen(true)}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Nova Despesa
                    </span>
                </Button>
            </div>
        </div>
        <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="paid">Pagas</TabsTrigger>
          <TabsTrigger value="overdue">Atrasadas</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardHeader>
               <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>Despesas</CardTitle>
                    <CardDescription>
                      Visualize e gerencie todas as suas contas a pagar.
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
                    <TableHead className="hidden md:table-cell">Centro de Custo</TableHead>
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
    <ExpenseDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveExpense}
        suppliers={suppliers}
        costCenters={costCenters}
        categories={categories}
    />
    </>
  )
}

    