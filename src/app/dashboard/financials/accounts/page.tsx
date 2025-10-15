
'use client'

import { useState } from "react"
import {
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react"
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import type { Account } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

const accountSchema = z.object({
  name: z.string().min(2, { message: "O nome da conta é obrigatório." }),
  bankName: z.string().min(2, { message: "O nome do banco é obrigatório." }),
  agency: z.string().optional(),
  accountNumber: z.string().optional(),
  type: z.enum(["checking", "savings", "digital", "cash"], { required_error: "Selecione o tipo de conta."}),
  balance: z.preprocess(
    (a) => parseFloat(String(a).replace(/\./g, '').replace(',', '.')),
    z.number({ invalid_type_error: "Saldo deve ser um número." })
  ),
})

type AccountFormValues = z.infer<typeof accountSchema>

function AccountDialog({
  open,
  onOpenChange,
  onSave,
  isSubmitting,
  account,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: AccountFormValues, id?: string) => void
  isSubmitting: boolean
  account?: Account | null
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: account ? {
      ...account,
      balance: account.balance / 100, // Adjust for display if needed
    } : {
      name: '',
      bankName: '',
      agency: '',
      accountNumber: '',
      type: 'checking',
      balance: 0,
    },
  })

  useState(() => {
     if (account) {
      reset({ ...account, balance: account.balance });
    } else {
      reset({ name: '', bankName: '', agency: '', accountNumber: '', type: 'checking', balance: 0 });
    }
  })

  const handleFormSubmit = (values: AccountFormValues) => {
    onSave(values, account?.id)
  }

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const digitsOnly = value.replace(/[^\d]/g, '');
    if (!digitsOnly) {
      control.fieldsRef.current.balance.value = '';
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{account ? 'Editar' : 'Adicionar'} Conta</DialogTitle>
          <DialogDescription>
            Preencha as informações para {account ? 'atualizar a' : 'criar uma nova'} conta.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nome da Conta</Label>
                    <Input id="name" {...register('name')} placeholder="Ex: Conta Principal" />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="bankName">Nome do Banco</Label>
                    <Input id="bankName" {...register('bankName')} placeholder="Ex: Banco Digital S.A." />
                    {errors.bankName && <p className="text-sm text-destructive">{errors.bankName.message}</p>}
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="agency">Agência</Label>
                    <Input id="agency" {...register('agency')} placeholder="Ex: 0001" />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="accountNumber">Número da Conta</Label>
                    <Input id="accountNumber" {...register('accountNumber')} placeholder="Ex: 12345-6" />
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="type">Tipo</Label>
                     <Controller
                        control={control}
                        name="type"
                        render={({ field }) => (
                           <Select onValueChange={field.onChange} value={field.value} defaultValue="checking">
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="checking">Conta Corrente</SelectItem>
                               <SelectItem value="savings">Conta Poupança</SelectItem>
                               <SelectItem value="digital">Conta Digital</SelectItem>
                               <SelectItem value="cash">Caixa</SelectItem>
                            </SelectContent>
                           </Select>
                        )}
                    />
                    {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="balance">Saldo Inicial (R$)</Label>
                    <Input id="balance" {...register('balance')} placeholder="1.000,00" onChange={handleBalanceChange} />
                    {errors.balance && <p className="text-sm text-destructive">{errors.balance.message}</p>}
                </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline"> Cancelar </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AccountRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
    </TableRow>
  )
}

export default function AccountsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const { toast } = useToast()
  const firestore = useFirestore()

  const accountsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "accounts"))
  }, [firestore])
  const { data: accounts, isLoading } = useCollection<Account>(accountsQuery)

  const handleOpenDialog = (account?: Account) => {
    setSelectedAccount(account || null)
    setIsDialogOpen(true)
  }

  const handleSave = async (values: AccountFormValues, id?: string) => {
    if (!firestore) return
    setIsSubmitting(true)
    try {
      if (id) {
        const docRef = doc(firestore, 'accounts', id)
        await updateDoc(docRef, values)
        toast({ title: 'Conta atualizada com sucesso!' })
      } else {
        await addDoc(collection(firestore, 'accounts'), values)
        toast({ title: 'Conta criada com sucesso!' })
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving account:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a conta.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!firestore) return
    try {
      await deleteDoc(doc(firestore, 'accounts', id))
      toast({ title: 'Conta excluída com sucesso!' })
    } catch (error) {
      console.error('Error deleting account:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a conta.',
      })
    }
  }

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
        <TableCell>
            <div>{account.bankName}</div>
            <div className="text-xs text-muted-foreground">
                Ag: {account.agency || 'N/A'} / C: {account.accountNumber || 'N/A'}
            </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="capitalize">{account.type}</Badge>
        </TableCell>
        <TableCell className="text-right">
          R$ {account.balance.toLocaleString('pt-br', { minimumFractionDigits: 2 })}
        </TableCell>
        <TableCell className="text-right">
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
              <DropdownMenuItem onSelect={() => handleOpenDialog(account)}>
                <Pencil className="mr-2 h-4 w-4"/> Editar
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a conta <strong>{account.name}</strong>.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => handleDelete(account.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Sim, excluir
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ));
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contas Bancárias</h1>
            <p className="text-muted-foreground">
              Gerencie suas contas bancárias e digitais.
            </p>
          </div>
          <Button size="sm" className="h-8 gap-1" onClick={() => handleOpenDialog()}>
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
                  <TableHead>Banco/Ag./Conta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">
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
      <AccountDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        account={selectedAccount}
      />
    </>
  )
}
