
'use client'

import { useState } from "react"
import {
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Shapes,
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
import type { ExpenseCategory, CostCenter } from "@/lib/types"
import Link from "next/link"

const expenseCategorySchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  costCenterId: z.string().optional(),
})

type ExpenseCategoryFormValues = z.infer<typeof expenseCategorySchema>

function ExpenseCategoryDialog({
  open,
  onOpenChange,
  onSave,
  isSubmitting,
  category,
  costCenters,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: ExpenseCategoryFormValues, id?: string) => void
  isSubmitting: boolean
  category?: ExpenseCategory | null
  costCenters: CostCenter[] | null
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ExpenseCategoryFormValues>({
    resolver: zodResolver(expenseCategorySchema),
    defaultValues: category || { name: '', costCenterId: '' },
  })

  useState(() => {
    reset(category || { name: '', costCenterId: '' })
  })

  const handleFormSubmit = (values: ExpenseCategoryFormValues) => {
    onSave(values, category?.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{category ? 'Editar' : 'Adicionar'} Categoria de Despesa</DialogTitle>
          <DialogDescription>
            {category ? 'Atualize as informações' : 'Crie uma nova'} categoria.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Categoria</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ex: Marketing, Salários, Impostos"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
                <Label htmlFor="costCenterId">Centro de Custo Padrão (Opcional)</Label>
                 <Controller
                    control={control}
                    name="costCenterId"
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Selecione um centro de custo" /></SelectTrigger>
                        <SelectContent>
                         <SelectItem value="none">Nenhum</SelectItem>
                         {costCenters?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          {costCenters?.length === 0 && (
                            <div className="p-4 text-sm text-center text-muted-foreground">
                                Nenhum centro de custo. <Link href="/dashboard/cost-centers" className="text-primary underline">Cadastre um.</Link>
                            </div>
                         )}
                        </SelectContent>
                    </Select>
                    )}
                />
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


export default function ExpenseCategoriesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null)
  const { toast } = useToast()
  const firestore = useFirestore()

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, 'expense_categories'))
  }, [firestore])
  const { data: categories, isLoading } = useCollection<ExpenseCategory>(categoriesQuery)

  const costCentersQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, 'cost_centers'))
  }, [firestore]);
  const { data: costCenters } = useCollection<CostCenter>(costCentersQuery);
  
  const handleOpenDialog = (category?: ExpenseCategory) => {
    setSelectedCategory(category || null)
    setIsDialogOpen(true)
  }

  const handleSave = async (values: ExpenseCategoryFormValues, id?: string) => {
    if (!firestore) return
    setIsSubmitting(true)
    try {
        const costCenter = costCenters?.find(c => c.id === values.costCenterId);
        const dataToSave: Partial<ExpenseCategory> = {
            ...values,
            costCenterName: values.costCenterId && values.costCenterId !== 'none' ? costCenter?.name : undefined
        };

        if (values.costCenterId === 'none' || !values.costCenterId) {
            dataToSave.costCenterId = undefined;
            dataToSave.costCenterName = undefined;
        }


      if (id) {
        const docRef = doc(firestore, 'expense_categories', id)
        await updateDoc(docRef, dataToSave)
        toast({ title: 'Categoria atualizada com sucesso!' })
      } else {
        await addDoc(collection(firestore, 'expense_categories'), dataToSave)
        toast({ title: 'Categoria criada com sucesso!' })
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving category:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a categoria.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!firestore) return
    try {
      await deleteDoc(doc(firestore, 'expense_categories', id))
      toast({ title: 'Categoria excluída com sucesso!' })
    } catch (error) {
      console.error('Error deleting category:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a categoria.',
      })
    }
  }


  return (
    <>
    <div className="flex flex-col gap-4">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tipos de Despesa</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias para suas contas a pagar.
          </p>
        </div>
        <Button size="sm" className="h-8 gap-1" onClick={() => handleOpenDialog()}>
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Adicionar Categoria
          </span>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorias</CardTitle>
          <CardDescription>
            Adicione, edite ou remova suas categorias de despesa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Centro de Custo Padrão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && categories?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">Nenhuma categoria encontrada.</TableCell>
                </TableRow>
              )}
              {categories?.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                        <Shapes className="h-5 w-5 text-muted-foreground"/>
                        {category.name}
                    </div>
                  </TableCell>
                  <TableCell>{category.costCenterName || '—'}</TableCell>
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
                        <DropdownMenuItem onSelect={() => handleOpenDialog(category)}>
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
                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente a categoria <strong>{category.name}</strong>.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => handleDelete(category.id)}
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
                Mostrando <strong>{categories?.length || 0}</strong> categorias.
            </div>
        </CardFooter>
      </Card>
    </div>
     <ExpenseCategoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        category={selectedCategory}
        costCenters={costCenters}
      />
    </>
  )
}
