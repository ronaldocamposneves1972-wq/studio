
'use client'

import { useState } from "react"
import {
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  WalletCards,
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
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import type { CostCenter } from "@/lib/types"

const costCenterSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
})

type CostCenterFormValues = z.infer<typeof costCenterSchema>

function CostCenterDialog({
  open,
  onOpenChange,
  onSave,
  isSubmitting,
  costCenter,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: CostCenterFormValues, id?: string) => void
  isSubmitting: boolean
  costCenter?: CostCenter | null
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CostCenterFormValues>({
    resolver: zodResolver(costCenterSchema),
    defaultValues: costCenter || { name: '' },
  })

  useState(() => {
    reset(costCenter || { name: '' })
  })

  const handleFormSubmit = (values: CostCenterFormValues) => {
    onSave(values, costCenter?.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{costCenter ? 'Editar' : 'Adicionar'} Centro de Custo</DialogTitle>
          <DialogDescription>
            {costCenter ? 'Atualize o nome' : 'Crie um novo'} centro de custo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Centro de Custo</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ex: Marketing, Vendas, Administrativo"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
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


export default function CostCentersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null)
  const { toast } = useToast()
  const firestore = useFirestore()

  const costCentersQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, 'cost_centers'))
  }, [firestore])

  const { data: costCenters, isLoading } = useCollection<CostCenter>(costCentersQuery)
  
  const handleOpenDialog = (costCenter?: CostCenter) => {
    setSelectedCostCenter(costCenter || null)
    setIsDialogOpen(true)
  }

  const handleSave = async (values: CostCenterFormValues, id?: string) => {
    if (!firestore) return
    setIsSubmitting(true)
    try {
      if (id) {
        const docRef = doc(firestore, 'cost_centers', id)
        await updateDoc(docRef, values)
        toast({ title: 'Centro de custo atualizado com sucesso!' })
      } else {
        await addDoc(collection(firestore, 'cost_centers'), values)
        toast({ title: 'Centro de custo criado com sucesso!' })
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving cost center:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o centro de custo.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!firestore) return
    try {
      await deleteDoc(doc(firestore, 'cost_centers', id))
      toast({ title: 'Centro de custo excluído com sucesso!' })
    } catch (error) {
      console.error('Error deleting cost center:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o centro de custo.',
      })
    }
  }


  return (
    <>
    <div className="flex flex-col gap-4">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centros de Custo</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias para suas despesas.
          </p>
        </div>
        <Button size="sm" className="h-8 gap-1" onClick={() => handleOpenDialog()}>
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Adicionar Centro de Custo
          </span>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Centros de Custo</CardTitle>
          <CardDescription>
            Adicione, edite ou remova seus centros de custo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
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
              {!isLoading && costCenters?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">Nenhum centro de custo encontrado.</TableCell>
                </TableRow>
              )}
              {costCenters?.map((costCenter) => (
                <TableRow key={costCenter.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                        <WalletCards className="h-5 w-5 text-muted-foreground"/>
                        {costCenter.name}
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
                        <DropdownMenuItem onSelect={() => handleOpenDialog(costCenter)}>
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
                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o centro de custo <strong>{costCenter.name}</strong>.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => handleDelete(costCenter.id)}
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
                Mostrando <strong>{costCenters?.length || 0}</strong> centros de custo.
            </div>
        </CardFooter>
      </Card>
    </div>
     <CostCenterDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        costCenter={selectedCostCenter}
      />
    </>
  )
}
