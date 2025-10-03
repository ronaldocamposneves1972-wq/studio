
'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
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
import type { Quiz, QuizPlacement } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

const questionSchema = z.object({
  id: z.string().min(1, "ID da pergunta é obrigatório"),
  text: z.string().min(1, "O texto da pergunta é obrigatório"),
  type: z.enum(["text", "number", "email", "tel", "radio", "checkbox", "file"]),
  options: z.string().optional(), // Comma-separated options
})

const quizSchema = z.object({
  name: z.string().min(3, "O nome do quiz é obrigatório"),
  placement: z.enum(["landing_page", "client_link"]),
  questions: z.array(questionSchema).min(1, "O quiz deve ter pelo menos uma pergunta"),
})

type QuizFormData = z.infer<typeof quizSchema>

export default function EditQuizPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const quizId = params.id
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user, isUserLoading } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const quizDocRef = useMemoFirebase(() => {
    if (!firestore || !quizId) return null
    return doc(firestore, 'quizzes', quizId)
  }, [firestore, quizId])

  const { data: quiz, isLoading: isLoadingQuiz } = useDoc<Quiz>(quizDocRef)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      name: "",
      placement: "landing_page",
      questions: [],
    }
  })

  const watchedPlacement = useWatch({ control, name: "placement" });


  useEffect(() => {
    if (quiz) {
      reset({
        name: quiz.name,
        placement: quiz.placement,
        questions: quiz.questions.map(q => ({
          ...q,
          options: q.options?.join(", ") || "",
        })),
      })
    }
  }, [quiz, reset])

  const { fields, append, remove } = useFieldArray({
    control,
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

    // Security rules should check if the user is the owner
    const quizData = {
      ...data,
      questions: data.questions.map(q => ({
        ...q,
        options: q.options ? q.options.split(',').map(opt => opt.trim()) : [],
      })),
    }

    // This is non-blocking and handles its own errors
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
        <p>Quiz não encontrado ou você não tem permissão para editá-lo.</p>
         <Button asChild className="mt-4">
          <Link href="/dashboard/settings/quizzes">Voltar</Link>
        </Button>
      </div>
    )
  }
  
    // Security check on client-side as a safeguard
  if (quiz.ownerId !== user.uid) {
     return (
      <div className="text-center py-10">
        <p>Você não tem permissão para editar este quiz.</p>
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Quiz</CardTitle>
            <CardDescription>
              Modifique o nome, localização e as perguntas do seu quiz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Quiz</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    className={errors.name ? "border-destructive" : ""}
                    disabled={isSubmitting}
                  />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                </div>
                 <div>
                    <Label>Localização</Label>
                     <Select onValueChange={(value) => setValue("placement", value as QuizPlacement)} value={watchedPlacement} disabled={isSubmitting}>
                        <SelectTrigger className={errors.placement ? "border-destructive" : ""}>
                            <SelectValue placeholder="Selecione onde o quiz será usado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="landing_page">Página Inicial</SelectItem>
                            <SelectItem value="client_link">Link para Cliente</SelectItem>
                        </SelectContent>
                    </Select>
                     {errors.placement && <p className="text-sm text-destructive mt-1">{errors.placement.message}</p>}
                </div>
              </div>


              <h3 className="text-lg font-medium border-t pt-4">Perguntas</h3>
              {fields.map((field, index) => (
                <div key={field.id} className="grid gap-4 border p-4 rounded-lg relative">
                   <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => remove(index)}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <Label>ID da Pergunta</Label>
                        <Input
                        {...register(`questions.${index}.id`)}
                        placeholder="ex: q-email"
                        disabled={isSubmitting}
                        />
                        {errors.questions?.[index]?.id && <p className="text-sm text-destructive mt-1">{errors.questions?.[index]?.id?.message}</p>}
                    </div>
                     <div>
                        <Label>Texto da Pergunta</Label>
                        <Input
                        {...register(`questions.${index}.text`)}
                        placeholder="Ex: Qual o seu e-mail?"
                        disabled={isSubmitting}
                        />
                         {errors.questions?.[index]?.text && <p className="text-sm text-destructive mt-1">{errors.questions?.[index]?.text?.message}</p>}
                    </div>
                     <div>
                        <Label>Tipo da Pergunta</Label>
                        <Select onValueChange={(value) => setValue(`questions.${index}.type`, value as any)} value={field.type} disabled={isSubmitting}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
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
                    </div>
                  </div>
                  <div>
                    <Label>Opções (separadas por vírgula)</Label>
                    <Input
                      {...register(`questions.${index}.options`)}
                      placeholder="Opção 1, Opção 2, Opção 3"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              ))}
              {errors.questions && typeof errors.questions.message === 'string' && <p className="text-sm text-destructive mt-1">{errors.questions.message}</p>}

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
    </div>
  )
}
