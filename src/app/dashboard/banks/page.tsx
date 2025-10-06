
'use client'

import { useState } from "react"
import {
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react"
import { useForm } from 'react-hook-form'
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
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import type { FinancialInstitution as Bank } from "@/lib/types"

const bankSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  logoUrl: z.string().url({ message: "Por favor, insira uma URL de imagem válida." }).optional().or(z.literal('')),
})

type BankFormValues = z.infer<typeof bankSchema>

function BankDialog({
  open,
  onOpenChange,
  onSave,
  isSubmitting,
  bank,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: BankFormValues, id?: string) => void
  isSubmitting: boolean
  bank?: Bank | null
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BankFormValues>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      name: bank?.name || '',
      logoUrl: bank?.logoUrl || '',
    },
  })

  useState(() => {
    reset({
      name: bank?.name || '',
      logoUrl: bank?.logoUrl || '',
    })
  })

  const handleFormSubmit = (values: BankFormValues) => {
    onSave(values, bank?.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bank ? 'Editar' : 'Adicionar'} Banco/Parceiro</DialogTitle>
          <DialogDescription>
            Preencha as informações abaixo para {bank ? 'atualizar o' : 'criar um novo'} parceiro.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Instituição</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ex: Banco Parceiro S.A."
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="logoUrl">URL do Logo (opcional)</Label>
              <Input
                id="logoUrl"
                {...register('logoUrl')}
                placeholder="https://exemplo.com/logo.png"
                className={errors.logoUrl ? 'border-destructive' : ''}
              />
               {errors.logoUrl && (
                <p className="text-sm text-destructive">{errors.logoUrl.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
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


export default function BanksPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
  const { toast } = useToast()
  const firestore = useFirestore()

  const banksQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, 'financial_institutions'))
  }, [firestore])

  const { data: banks, isLoading } = useCollection<Bank>(banksQuery)
  
  const handleOpenDialog = (bank?: Bank) => {
    setSelectedBank(bank || null)
    setIsDialogOpen(true)
  }

  const handleSave = async (values: BankFormValues, id?: string) => {
    if (!firestore) return
    setIsSubmitting(true)
    try {
      if (id) {
        const docRef = doc(firestore, 'financial_institutions', id)
        await updateDoc(docRef, values)
        toast({ title: 'Parceiro atualizado com sucesso!' })
      } else {
        await addDoc(collection(firestore, 'financial_institutions'), values)
        toast({ title: 'Parceiro criado com sucesso!' })
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving bank:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o parceiro.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!firestore) return
    try {
      await deleteDoc(doc(firestore, 'financial_institutions', id))
      toast({ title: 'Parceiro excluído com sucesso!' })
    } catch (error) {
      console.error('Error deleting bank:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o parceiro.',
      })
    }
  }


  return (
    <>
    <div className="flex flex-col gap-4">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bancos e Parceiros</h1>
          <p className="text-muted-foreground">
            Gerencie as instituições financeiras parceiras.
          </p>
        </div>
        <Button size="sm" className="h-8 gap-1" onClick={() => handleOpenDialog()}>
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Adicionar Banco
          </span>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Instituições Financeiras</CardTitle>
          <CardDescription>
            Adicione, edite ou remova seus parceiros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banco</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && banks?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">Nenhum parceiro encontrado.</TableCell>
                </TableRow>
              )}
              {banks?.map((bank) => (
                <TableRow key={bank.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                        {bank.logoUrl ? (
                            <img src={bank.logoUrl} alt={bank.name} className="h-8 w-8 rounded-full object-contain border" data-ai-hint="logo"/>
                        ) : (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs">
                                {bank.name.charAt(0)}
                            </div>
                        )}
                        {bank.name}
                    </div>
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
                        <DropdownMenuItem onSelect={() => handleOpenDialog(bank)}>
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
                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o parceiro <strong>{bank.name}</strong>.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => handleDelete(bank.id)}
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
                Mostrando <strong>{banks?.length || 0}</strong> parceiros.
            </div>
        </CardFooter>
      </Card>
    </div>
     <BankDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        bank={selectedBank}
      />
    </>
  )
}
