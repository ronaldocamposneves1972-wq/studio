

'use client'

import { useState, useEffect } from "react"
import {
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  MessageCircle,
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
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import type { WhatsappMessageTemplate } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

const templateSchema = z.object({
  name: z.string().min(3, { message: "O nome interno é obrigatório." }),
  text: z.string().min(10, { message: "O texto da mensagem é obrigatório." }),
  apiUrl: z.string().url({ message: "A URL da API deve ser válida." }),
  sessionName: z.string().min(1, { message: "O nome da sessão é obrigatório." }),
  stage: z.enum(["Cadastro (Quiz)", "Documentação", "Valor", "Clearance", "Ledger", "Envio de Proposta", "Formalização", "Manual", "Painel de Oportunidades"], {
    required_error: "Selecione uma etapa."
  }),
})

type TemplateFormValues = z.infer<typeof templateSchema>

function TemplateDialog({
  open,
  onOpenChange,
  onSave,
  isSubmitting,
  template,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: TemplateFormValues, id?: string) => void
  isSubmitting: boolean
  template?: WhatsappMessageTemplate | null
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: template || { name: '', text: '', apiUrl: '', sessionName: 'default', stage: 'Manual' },
  })

  useEffect(() => {
    if (template) {
      reset(template);
    } else {
      reset({ name: '', text: '', apiUrl: '', sessionName: 'default', stage: 'Manual' });
    }
  }, [template, reset]);

  const handleFormSubmit = (values: TemplateFormValues) => {
      onSave(values, template?.id);
  }
  
  const availablePlaceholders = ['clientName', 'quizLink', 'proposalDetails', 'formalizationLink'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{template ? 'Editar' : 'Novo'} Modelo de Mensagem</DialogTitle>
          <DialogDescription>
            Crie ou edite modelos de mensagem para enviar via WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nome Interno</Label>
                    <Input id="name" {...register('name')} placeholder="Ex: Boas-vindas Cadastro" />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="stage">Etapa da Esteira</Label>
                    <Controller
                        control={control}
                        name="stage"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value} defaultValue="Manual">
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a etapa" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cadastro (Quiz)">Cadastro (Quiz)</SelectItem>
                                    <SelectItem value="Documentação">Documentação</SelectItem>
                                    <SelectItem value="Valor">Valor</SelectItem>
                                    <SelectItem value="Envio de Proposta">Envio de Proposta</SelectItem>
                                    <SelectItem value="Clearance">Clearance</SelectItem>
                                    <SelectItem value="Formalização">Formalização</SelectItem>
                                    <SelectItem value="Ledger">Ledger</SelectItem>
                                    <SelectItem value="Painel de Oportunidades">Painel de Oportunidades</SelectItem>
                                    <SelectItem value="Manual">Manual</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                     {errors.stage && <p className="text-sm text-destructive">{errors.stage.message}</p>}
                </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="text">Texto da Mensagem</Label>
              <Textarea id="text" {...register('text')} placeholder="Olá {clientName}, obrigado por se cadastrar!" rows={4} />
              <p className="text-xs text-muted-foreground">
                Placeholders disponíveis: {availablePlaceholders.map(p => `{${p}}`).join(', ')}
              </p>
              {errors.text && <p className="text-sm text-destructive">{errors.text.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="apiUrl">URL da API</Label>
                    <Input id="apiUrl" {...register('apiUrl')} placeholder="https://api.exemplo.com/send" />
                    {errors.apiUrl && <p className="text-sm text-destructive">{errors.apiUrl.message}</p>}
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="sessionName">Nome da Sessão</Label>
                    <Input id="sessionName" {...register('sessionName')} />
                    {errors.sessionName && <p className="text-sm text-destructive">{errors.sessionName.message}</p>}
                </div>
            </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function WhatsappSettingsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsappMessageTemplate | null>(null)
  const { toast } = useToast()
  const firestore = useFirestore()

  const templatesQuery = useMemoFirebase(() => {
    return firestore ? query(collection(firestore, 'whatsapp_templates')) : null
  }, [firestore])

  const { data: templates, isLoading } = useCollection<WhatsappMessageTemplate>(templatesQuery)
  
  const handleOpenDialog = (template?: WhatsappMessageTemplate) => {
    setSelectedTemplate(template || null)
    setIsDialogOpen(true)
  }

  const handleSave = async (values: TemplateFormValues, id?: string) => {
    if (!firestore) return
    setIsSubmitting(true)
    try {
      const dataToSave = { ...values };
      if (id) {
        await updateDoc(doc(firestore, 'whatsapp_templates', id), dataToSave)
        toast({ title: 'Modelo atualizado com sucesso!' })
      } else {
        await addDoc(collection(firestore, 'whatsapp_templates'), dataToSave)
        toast({ title: 'Modelo criado com sucesso!' })
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving template:', error)
      toast({ variant: 'destructive', title: 'Erro ao salvar' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!firestore) return
    try {
      await deleteDoc(doc(firestore, 'whatsapp_templates', id))
      toast({ title: 'Modelo excluído com sucesso!' })
    } catch (error) {
      console.error('Error deleting template:', error)
      toast({ variant: 'destructive', title: 'Erro ao excluir' })
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Modelos de Mensagem do WhatsApp</CardTitle>
                <CardDescription>
                    Gerencie os modelos de mensagens automáticas.
                </CardDescription>
            </div>
            <Button size="sm" className="h-8 gap-1" onClick={() => handleOpenDialog()}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Novo Modelo
                </span>
            </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Interno</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 2 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-52" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && templates?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">Nenhum modelo encontrado.</TableCell>
                </TableRow>
              )}
              {templates?.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                      <Badge variant={template.stage === 'Manual' ? 'outline' : 'secondary'}>{template.stage}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-md">{template.text}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => handleOpenDialog(template)}><Pencil className="mr-2 h-4 w-4"/> Editar</DropdownMenuItem>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>Esta ação excluirá permanentemente o modelo <strong>{template.name}</strong>.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(template.id)} className="bg-destructive hover:bg-destructive/90">Sim, excluir</AlertDialogAction>
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
      </Card>
      <TemplateDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        template={selectedTemplate}
      />
    </>
  )
}
