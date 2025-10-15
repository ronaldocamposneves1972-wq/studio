
'use client'

import { useState } from "react"
import {
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Truck,
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
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, doc, addDoc, updateDoc } from 'firebase/firestore'
import type { Supplier } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

const supplierSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  type: z.enum(["Empresa", "Funcionário"], { required_error: "Selecione o tipo de fornecedor."}),
  cnpjCpf: z.string().optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }).optional().or(z.literal('')),
})

type SupplierFormValues = z.infer<typeof supplierSchema>

function SupplierDialog({
  open,
  onOpenChange,
  onSave,
  isSubmitting,
  supplier,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: SupplierFormValues, id?: string) => void
  isSubmitting: boolean
  supplier?: Supplier | null
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier || { name: '', type: 'Empresa', cnpjCpf: '', contactName: '', phone: '', email: ''},
  })

  useState(() => {
    reset(supplier || { name: '', type: 'Empresa', cnpjCpf: '', contactName: '', phone: '', email: ''})
  })

  const handleFormSubmit = (values: SupplierFormValues) => {
    onSave(values, supplier?.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{supplier ? 'Editar' : 'Adicionar'} Fornecedor</DialogTitle>
          <DialogDescription>
            Preencha as informações para {supplier ? 'atualizar o' : 'criar um novo'} fornecedor.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nome do Fornecedor</Label>
                    <Input
                        id="name"
                        {...register('name')}
                        placeholder="Ex: Companhia de Software Ltda"
                        className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="type">Tipo</Label>
                     <Controller
                        control={control}
                        name="type"
                        render={({ field }) => (
                           <Select onValueChange={field.onChange} value={field.value} defaultValue="Empresa">
                            <SelectTrigger className={errors.type ? 'border-destructive' : ''}>
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="Empresa">Empresa</SelectItem>
                               <SelectItem value="Funcionário">Funcionário</SelectItem>
                            </SelectContent>
                           </Select>
                        )}
                    />
                    {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
                </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cnpjCpf">CNPJ / CPF</Label>
              <Input
                id="cnpjCpf"
                {...register('cnpjCpf')}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="contactName">Nome do Contato</Label>
                    <Input id="contactName" {...register('contactName')} placeholder="Fulano de Tal" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" {...register('phone')} placeholder="(11) 99999-9999" />
                </div>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" {...register('email')} placeholder="contato@empresa.com" />
                 {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
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


export default function SuppliersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const { toast } = useToast()
  const firestore = useFirestore()

  const suppliersQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, 'suppliers'))
  }, [firestore])

  const { data: suppliers, isLoading } = useCollection<Supplier>(suppliersQuery)
  
  const handleOpenDialog = (supplier?: Supplier) => {
    setSelectedSupplier(supplier || null)
    setIsDialogOpen(true)
  }

  const handleSave = async (values: SupplierFormValues, id?: string) => {
    if (!firestore) return
    setIsSubmitting(true)
    try {
      if (id) {
        const docRef = doc(firestore, 'suppliers', id)
        await updateDoc(docRef, values)
        toast({ title: 'Fornecedor atualizado com sucesso!' })
      } else {
        await addDoc(collection(firestore, 'suppliers'), values)
        toast({ title: 'Fornecedor criado com sucesso!' })
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving supplier:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o fornecedor.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!firestore) return
    try {
      await deleteDocumentNonBlocking(doc(firestore, 'suppliers', id))
      toast({ title: 'Fornecedor excluído com sucesso!' })
    } catch (error) {
      console.error('Error deleting supplier:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o fornecedor.',
      })
    }
  }


  return (
    <>
    <div className="flex flex-col gap-4">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-muted-foreground">
            Gerencie seus fornecedores de produtos e serviços.
          </p>
        </div>
        <Button size="sm" className="h-8 gap-1" onClick={() => handleOpenDialog()}>
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Adicionar Fornecedor
          </span>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Fornecedores</CardTitle>
          <CardDescription>
            Adicione, edite ou remova seus fornecedores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>CNPJ/CPF</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && suppliers?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Nenhum fornecedor encontrado.</TableCell>
                </TableRow>
              )}
              {suppliers?.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-muted-foreground"/>
                        {supplier.name}
                    </div>
                  </TableCell>
                  <TableCell>
                      {supplier.type && <Badge variant={supplier.type === 'Empresa' ? 'secondary' : 'outline'}>{supplier.type}</Badge>}
                  </TableCell>
                  <TableCell>{supplier.cnpjCpf || '—'}</TableCell>
                  <TableCell>
                      <div>{supplier.contactName || '—'}</div>
                      <div className="text-xs text-muted-foreground">{supplier.email}</div>
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
                        <DropdownMenuItem onSelect={() => handleOpenDialog(supplier)}>
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
                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o fornecedor <strong>{supplier.name}</strong>.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => handleDelete(supplier.id)}
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
                Mostrando <strong>{suppliers?.length || 0}</strong> fornecedores.
            </div>
        </CardFooter>
      </Card>
    </div>
     <SupplierDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        supplier={selectedSupplier}
      />
    </>
  )
}

    