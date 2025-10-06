
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  MoreHorizontal,
  PlusCircle,
  Trash2,
  Pencil,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
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
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase'
import { collection, query, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import type { ProductType } from '@/lib/types'

const productTypeSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  description: z.string().optional(),
})

type ProductTypeFormValues = z.infer<typeof productTypeSchema>

function ProductTypeDialog({
  open,
  onOpenChange,
  onSave,
  isSubmitting,
  productType,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: ProductTypeFormValues, id?: string) => void
  isSubmitting: boolean
  productType?: ProductType | null
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductTypeFormValues>({
    resolver: zodResolver(productTypeSchema),
    defaultValues: {
      name: productType?.name || '',
      description: productType?.description || '',
    },
  })

  useState(() => {
    reset({
      name: productType?.name || '',
      description: productType?.description || '',
    })
  })

  const handleFormSubmit = (values: ProductTypeFormValues) => {
    onSave(values, productType?.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{productType ? 'Editar' : 'Adicionar'} Tipo de Produto</DialogTitle>
          <DialogDescription>
            Preencha as informações abaixo para {productType ? 'atualizar o' : 'criar um novo'} tipo de produto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ex: Consórcio Imobiliário"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Uma breve descrição sobre este tipo de produto."
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

export default function ProductTypesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null)
  const { toast } = useToast()
  const firestore = useFirestore()

  const productTypesQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, 'product_types'))
  }, [firestore])

  const { data: productTypes, isLoading } = useCollection<ProductType>(productTypesQuery)

  const handleOpenDialog = (productType?: ProductType) => {
    setSelectedProductType(productType || null)
    setIsDialogOpen(true)
  }

  const handleSave = async (values: ProductTypeFormValues, id?: string) => {
    if (!firestore) return
    setIsSubmitting(true)
    try {
      if (id) {
        // Update
        const docRef = doc(firestore, 'product_types', id)
        await updateDoc(docRef, values)
        toast({ title: 'Tipo de produto atualizado com sucesso!' })
      } else {
        // Create
        await addDoc(collection(firestore, 'product_types'), values)
        toast({ title: 'Tipo de produto criado com sucesso!' })
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving product type:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o tipo de produto.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!firestore) return
    try {
      await deleteDoc(doc(firestore, 'product_types', id))
      toast({ title: 'Tipo de produto excluído com sucesso!' })
    } catch (error) {
      console.error('Error deleting product type:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o tipo de produto.',
      })
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tipos de Produto</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias dos seus produtos.
          </p>
        </div>
        <Button size="sm" className="h-8 gap-1" onClick={() => handleOpenDialog()}>
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Adicionar Tipo
          </span>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tipos Cadastrados</CardTitle>
          <CardDescription>
            Adicione, edite ou remova tipos de produtos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-64" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && productTypes?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Nenhum tipo de produto encontrado.
                  </TableCell>
                </TableRow>
              )}
              {productTypes?.map(pt => (
                <TableRow key={pt.id}>
                  <TableCell className="font-medium">{pt.name}</TableCell>
                  <TableCell className="text-muted-foreground">{pt.description}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(pt)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o tipo de produto <strong>{pt.name}</strong>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(pt.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Sim, excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
              Mostrando <strong>{productTypes?.length || 0}</strong> tipos de produto.
            </div>
        </CardFooter>
      </Card>
      <ProductTypeDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        productType={selectedProductType}
      />
    </>
  )
}
