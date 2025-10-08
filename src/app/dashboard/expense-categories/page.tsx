
'use client'

import { useState, useEffect } from "react"
import {
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Shapes,
} from "lucide-react"
import { useForm, Controller, useFieldArray, useFormContext } from 'react-hook-form'
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
import { collection, query, doc, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore'
import type { ExpenseCategory, CostCenter } from "@/lib/types"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"

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

  useEffect(() => {
    reset(category || { name: '', costCenterId: '' })
  }, [category, reset])

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

const batchExpenseCategorySchema = z.object({
  categories: z.array(z.object({
    name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
    costCenterId: z.string().optional(),
  })).min(1, "Adicione pelo menos uma categoria.")
});

type BatchExpenseCategoryFormData = z.infer<typeof batchExpenseCategorySchema>;

function BatchExpenseCategoryDialog({
  open,
  onOpenChange,
  onSave,
  costCenters,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: BatchExpenseCategoryFormData) => Promise<void>;
  costCenters: CostCenter[] | null;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [bulkCostCenterId, setBulkCostCenterId] = useState<string>('');

  const form = useForm<BatchExpenseCategoryFormData>({
    resolver: zodResolver(batchExpenseCategorySchema),
    defaultValues: {
      categories: [{ name: '', costCenterId: '' }],
    },
  });

  const { control, handleSubmit, formState: { errors }, getValues, reset, setValue } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "categories",
  });

  const handleFormSubmit = async (data: BatchExpenseCategoryFormData) => {
    setIsSubmitting(true);
    await onSave(data);
    reset({ categories: [{ name: '', costCenterId: '' }] }); 
    setSelectedRows([]);
    setIsSubmitting(false);
  };
  
  const handleAddRow = () => {
    const categories = getValues('categories');
    const lastCategory = categories[categories.length - 1];
    append({
      name: '',
      costCenterId: lastCategory?.costCenterId || '',
    });
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(fields.map((_, index) => index));
    } else {
      setSelectedRows([]);
    }
  }

  const handleSelectRow = (index: number, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, index]);
    } else {
      setSelectedRows(prev => prev.filter(i => i !== index));
    }
  }

  const handleBulkUpdate = () => {
    if (!bulkCostCenterId || selectedRows.length === 0) return;
    selectedRows.forEach(index => {
      setValue(`categories.${index}.costCenterId`, bulkCostCenterId, { shouldValidate: true });
    });
    setSelectedRows([]);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Adicionar Despesas em Lote</DialogTitle>
          <DialogDescription>
            Adicione múltiplas despesas de uma vez.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
           {selectedRows.length > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg mb-4 flex items-center gap-4">
              <span className="text-sm font-medium">{selectedRows.length} linha(s) selecionada(s)</span>
              <Select onValueChange={setBulkCostCenterId}>
                  <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Selecione um Centro de Custo"/>
                  </SelectTrigger>
                  <SelectContent>
                      {costCenters?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
              </Select>
              <Button type="button" size="sm" onClick={handleBulkUpdate}>Alterar Selecionados</Button>
            </div>
           )}
          <div className="max-h-[60vh] overflow-y-auto p-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                        checked={selectedRows.length === fields.length && fields.length > 0}
                        onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Nome da Despesa</TableHead>
                  <TableHead>Centro de Custo</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id} className="align-top">
                     <TableCell className="p-2">
                        <Checkbox
                            checked={selectedRows.includes(index)}
                            onCheckedChange={(checked) => handleSelectRow(index, !!checked)}
                        />
                     </TableCell>
                    <TableCell className="p-2">
                       <Controller
                        control={control}
                        name={`categories.${index}.name`}
                        render={({ field }) => <Input {...field} placeholder="Ex: Passagem Aérea" />}
                      />
                      {errors.categories?.[index]?.name && <p className="text-sm text-destructive mt-1">{errors.categories[index]?.name?.message}</p>}
                    </TableCell>
                    <TableCell className="p-2">
                       <Controller
                        control={control}
                        name={`categories.${index}.costCenterId`}
                        render={({ field }) => (
                           <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione"/>
                            </SelectTrigger>
                            <SelectContent>
                                {costCenters?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                           </Select>
                        )}
                      />
                    </TableCell>
                    <TableCell className="p-2 text-right">
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
           <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleAddRow}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Linha
            </Button>
            {errors.categories && typeof errors.categories.message === 'string' && (
                <p className="text-sm text-destructive mt-2">{errors.categories.message}</p>
            )}

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Salvando...' : 'Salvar Lote'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default function ExpenseCategoriesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null)
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [bulkCostCenterId, setBulkCostCenterId] = useState<string>('');
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

  const handleSaveBatch = async (data: BatchExpenseCategoryFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Serviço de banco de dados indisponível.' });
      return;
    }

    const batch = writeBatch(firestore);
    const categoriesCollection = collection(firestore, 'expense_categories');
    
    data.categories.forEach(category => {
      const docRef = doc(categoriesCollection);
      const costCenter = costCenters?.find(c => c.id === category.costCenterId);
      batch.set(docRef, {
        name: category.name,
        costCenterId: category.costCenterId || null,
        costCenterName: costCenter?.name || null,
      });
    });

    try {
      await batch.commit();
      toast({
        title: 'Sucesso!',
        description: `${data.categories.length} categorias foram adicionadas.`,
      });
      // Do not close the dialog automatically, user might want to add more
      // setIsBatchDialogOpen(false); 
    } catch (error) {
      console.error('Error saving batch categories:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar em lote',
        description: 'Não foi possível salvar as categorias.',
      });
    }
  };


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

  const handleDeleteSelected = async () => {
    if (!firestore || selectedRows.length === 0) return;

    const batch = writeBatch(firestore);
    selectedRows.forEach(categoryId => {
        const categoryRef = doc(firestore, 'expense_categories', categoryId);
        batch.delete(categoryRef);
    });

    try {
        await batch.commit();
        toast({
            title: `${selectedRows.length} categoria(s) excluída(s)!`,
            description: "As categorias selecionadas foram removidas.",
        });
        setSelectedRows([]);
    } catch (error) {
        console.error("Error deleting multiple categories:", error);
        toast({
            variant: "destructive",
            title: "Erro ao excluir",
            description: "Não foi possível excluir as categorias selecionadas.",
        });
    }
  }
  
  const handleBulkCostCenterUpdate = async () => {
    if (!firestore || selectedRows.length === 0 || !bulkCostCenterId) {
      toast({ variant: 'destructive', title: 'Seleção inválida', description: 'Selecione as linhas e um centro de custo para alterar.'});
      return;
    }

    const batch = writeBatch(firestore);
    const selectedCostCenter = costCenters?.find(c => c.id === bulkCostCenterId);
    
    selectedRows.forEach(categoryId => {
      const categoryRef = doc(firestore, 'expense_categories', categoryId);
      batch.update(categoryRef, { 
        costCenterId: bulkCostCenterId,
        costCenterName: selectedCostCenter?.name || null
      });
    });

    try {
      await batch.commit();
      toast({ title: 'Categorias atualizadas!', description: `${selectedRows.length} categorias foram movidas para ${selectedCostCenter?.name}.`});
      setSelectedRows([]);
      setBulkCostCenterId('');
    } catch (error) {
      console.error("Error on bulk update:", error);
      toast({ variant: 'destructive', title: 'Erro na atualização', description: 'Não foi possível alterar o centro de custo em massa.'});
    }
  }

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedRows(categories?.map(c => c.id) || []);
    } else {
      setSelectedRows([]);
    }
  }

  const handleSelectRow = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, categoryId]);
    } else {
      setSelectedRows(prev => prev.filter(id => id !== categoryId));
    }
  }

  const numSelected = selectedRows.length;
  const allSelected = numSelected > 0 && categories ? numSelected === categories.length : false;
  const someSelected = numSelected > 0 && !allSelected;


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
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => setIsBatchDialogOpen(true)}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Adicionar em Lote
              </span>
            </Button>
            <Button size="sm" className="h-8 gap-1" onClick={() => handleOpenDialog()}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Adicionar Categoria
              </span>
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorias</CardTitle>
          <CardDescription>
            Adicione, edite ou remova suas categorias de despesa.
             {numSelected > 0 && (
                <div className="mt-4 flex items-center gap-4 bg-muted/50 p-2 rounded-md border">
                    <span className="text-sm font-medium pl-2">{numSelected} selecionado(s)</span>
                    <Select onValueChange={setBulkCostCenterId} value={bulkCostCenterId}>
                        <SelectTrigger className="w-[250px] h-8">
                            <SelectValue placeholder="Selecione um Centro de Custo"/>
                        </SelectTrigger>
                        <SelectContent>
                            {costCenters?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button size="sm" className="h-8 gap-1" onClick={handleBulkCostCenterUpdate} disabled={!bulkCostCenterId}>
                        Alterar em Massa
                    </Button>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="h-8 gap-1">
                                <Trash2 className="h-3.5 w-3.5" />
                                Excluir
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Excluir categorias selecionadas?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. {numSelected} categoria(s) serão permanentemente excluídas.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive hover:bg-destructive/90">
                                    Sim, excluir
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={handleSelectAll}
                    aria-label="Selecionar todas as linhas"
                  />
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Centro de Custo Padrão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-5"/></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && categories?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">Nenhuma categoria encontrada.</TableCell>
                </TableRow>
              )}
              {categories?.map((category) => (
                <TableRow key={category.id} data-state={selectedRows.includes(category.id) && "selected"}>
                  <TableCell>
                      <Checkbox
                          checked={selectedRows.includes(category.id)}
                          onCheckedChange={(checked) => handleSelectRow(category.id, !!checked)}
                          aria-label={`Selecionar categoria ${category.name}`}
                      />
                  </TableCell>
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
      <BatchExpenseCategoryDialog
        open={isBatchDialogOpen}
        onOpenChange={setIsBatchDialogOpen}
        onSave={handleSaveBatch}
        costCenters={costCenters}
      />
    </>
  )
}
