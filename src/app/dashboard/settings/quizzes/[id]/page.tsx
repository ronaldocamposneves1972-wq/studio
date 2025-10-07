
'use client'

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ChevronLeft, PlusCircle, Trash2 } from "lucide-react"
import { doc } from "firebase/firestore"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useDoc, updateDocumentNonBlocking, useMemoFirebase } from "@/firebase"
import type { Quiz } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
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

const questionSchema = z.object({
  id: z.string().min(1, "ID da pergunta é obrigatório"),
  text: z.string().min(1, "O texto da pergunta é obrigatório"),
  type: z.enum(["text", "number", "email", "tel", "radio", "checkbox", "file"]),
  options: z.string().optional(), // Comma-separated options
})

const quizSchema = z.object({
  name: z.string().min(3, "O nome do quiz é obrigatório"),
  slug: z.enum(["landing_page", "credito-pessoal", "credito-clt", "antecipacao-fgts", "refinanciamento", "client_link"], {
      required_error: "A página do quiz é obrigatória."
  }),
  questions: z.array(questionSchema).min(1, "O quiz deve ter pelo menos uma pergunta"),
})

type QuizFormData = z.infer<typeof quizSchema>

export default function EditQuizPage() {
  const router = useRouter()
  const params = useParams();
  const quizId = params.id as string;
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user, isUserLoading } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const quizDocRef = useMemoFirebase(() => {
    if (!firestore || !quizId) return null
    return doc(firestore, 'quizzes', quizId)
  }, [firestore, quizId])

  const { data: quiz, isLoading: isLoadingQuiz } = useDoc<Quiz>(quizDocRef)

  const form = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      name: "",
      slug: "landing_page",
      questions: [],
    }
  })

  useEffect(() => {
    if (quiz) {
      form.reset({
        name: quiz.name,
        slug: quiz.slug,
        questions: quiz.questions.map(q => ({
          ...q,
          options: q.options?.join(", ") || "",
        })),
      })
    }
  }, [quiz, form])

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  })

  const onSubmit = (data: QuizFormData) => {
    if (!user) {
       toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Você precisa estar logado para editar um quiz.",
      })
      return;
    }
     if (!quizDocRef) return

    setIsSubmitting(true)

    const quizData = {
      ...data,
      questions: data.questions.map(q => ({
        ...q,
        options: q.options ? q.options.split(',').map(opt => opt.trim()) : [],
      })),
    }

    updateDocumentNonBlocking(quizDocRef, quizData);
    
    toast({
      title: "Quiz atualizado com sucesso!",
      description: `O quiz "${data.name}" foi salvo.`,
    })
    router.push("/dashboard/settings/quizzes")
    setIsSubmitting(false)
  }

  if (isUserLoading || isLoadingQuiz) {
    return (
        <div className="grid flex-1 auto-rows-max gap-4">
             <div className="flex items-center gap-4">
                <Skeleton className="h-7 w-7 rounded-md" />
                <Skeleton className="h-6 w-40" />
            </div>
            <Card className="animate-pulse">
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                       <Skeleton className="h-10 w-full" />
                       <Skeleton className="h-10 w-full" />
                    </div>
                     <Skeleton className="h-8 w-1/3 border-t pt-4" />
                     <div className="space-y-4">
                        <Skeleton className="h-32 w-full rounded-lg border" />
                        <Skeleton className="h-32 w-full rounded-lg border" />
                     </div>
                </CardContent>
                 <CardFooter className="flex justify-end gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                </CardFooter>
            </Card>
        </div>
    )
  }
  
  if (!user) {
     return (
      <div className="text-center py-10">
        <p>Você precisa estar logado para acessar esta página.</p>
         <Button asChild className="mt-4">
          <Link href="/dashboard">Ir para o Login</Link>
        </Button>
      </div>
    )
  }

    if (!quiz) {
     return (
      <div className="text-center py-10">
        <p>Quiz não encontrado.</p>
         <Button asChild className="mt-4">
          <Link href="/dashboard/settings/quizzes">Voltar</Link>
        </Button>
      </div>
    )
  }


  return (
    <div className="grid flex-1 auto-rows-max gap-4">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard/settings/quizzes">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Editar Quiz
        </h1>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Quiz</CardTitle>
              <CardDescription>
                Modifique o nome, localização e as perguntas do seu quiz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Quiz</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do seu quiz" {...field} disabled={isSubmitting}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Página do Quiz</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isSubmitting}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione onde o quiz será usado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="landing_page">Página Principal (Genérica)</SelectItem>
                            <SelectItem value="credito-pessoal">Página - Crédito Pessoal</SelectItem>
                            <SelectItem value="credito-clt">Página - Crédito CLT</SelectItem>
                            <SelectItem value="antecipacao-fgts">Página - Antecipação FGTS</SelectItem>
                            <SelectItem value="refinanciamento">Página - Refinanciamento</SelectItem>
                            <SelectItem value="client_link">Link para Cliente (Documentos)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>


                <h3 className="text-lg font-medium border-t pt-4">Perguntas</h3>
                {fields.map((field, index) => (
                  <div key={field.id} className="grid gap-4 border p-4 rounded-lg relative">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7"
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir pergunta?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A pergunta "{form.getValues(`questions.${index}.text`) || `Pergunta ${index + 1}`}" será removida.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => remove(index)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Sim, excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                       <FormField
                          control={form.control}
                          name={`questions.${index}.id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ID da Pergunta</FormLabel>
                              <FormControl>
                                <Input placeholder="ex: q-email" {...field} disabled={isSubmitting}/>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name={`questions.${index}.text`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Texto da Pergunta</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Qual o seu e-mail?" {...field} disabled={isSubmitting}/>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`questions.${index}.type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo da Pergunta</FormLabel>
                               <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isSubmitting}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="text">Texto</SelectItem>
                                    <SelectItem value="number">Número</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="tel">Telefone</SelectItem>
                                    <SelectItem value="radio">Múltipla Escolha (Radio)</SelectItem>
                                    <SelectItem value="checkbox">Seleção (Checkbox)</SelectItem>
                                    <SelectItem value="file">Arquivo</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name={`questions.${index}.options`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Opções (separadas por vírgula)</FormLabel>
                            <FormControl>
                              <Input placeholder="Opção 1, Opção 2, Opção 3" {...field} disabled={isSubmitting} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
                ))}
                {form.formState.errors.questions && typeof form.formState.errors.questions.message === 'string' && <p className="text-sm text-destructive mt-1">{form.formState.errors.questions.message}</p>}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => append({ id: "", text: "", type: "text", options: "" })}
                  disabled={isSubmitting}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Pergunta
                </Button>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4 flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => router.push('/dashboard/settings/quizzes')} disabled={isSubmitting}>Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                  </Button>
              </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
}
