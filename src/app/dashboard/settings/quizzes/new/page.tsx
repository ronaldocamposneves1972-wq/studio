'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ChevronLeft, PlusCircle, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { useFirestore, addDocumentNonBlocking } from "@/firebase"
import { collection } from "firebase/firestore"
import { QuizPlacement } from "@/lib/types"

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

export default function NewQuizPage() {
  const router = useRouter()
  const { toast } = useToast()
  const firestore = useFirestore()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      name: "",
      placement: "landing_page",
      questions: [{ id: "q-name", text: "Qual o seu nome completo?", type: "text", options: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  })

  const onSubmit = async (data: QuizFormData) => {
    setIsLoading(true)

    const quizData = {
      ...data,
      questions: data.questions.map(q => ({
        ...q,
        options: q.options ? q.options.split(',').map(opt => opt.trim()) : [],
      })),
      createdAt: new Date().toISOString(),
    }

    try {
      const quizzesCollection = collection(firestore, 'quizzes');
      await addDocumentNonBlocking(quizzesCollection, quizData);
      
      toast({
        title: "Quiz criado com sucesso!",
        description: `O quiz "${data.name}" foi salvo.`,
      })
      router.push("/dashboard/settings?tab=quizzes")
    } catch (error) {
      console.error("Error creating quiz: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar quiz",
        description: "Não foi possível salvar o quiz. Tente novamente.",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="grid flex-1 auto-rows-max gap-4">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard/settings?tab=quizzes">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Novo Quiz
        </h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Quiz</CardTitle>
            <CardDescription>
              Dê um nome ao seu quiz e adicione as perguntas.
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
                  />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                </div>
                 <div>
                    <Label>Localização</Label>
                     <Select onValueChange={(value) => setValue("placement", value as QuizPlacement)} defaultValue="landing_page">
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
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <Label>ID da Pergunta</Label>
                        <Input
                        {...register(`questions.${index}.id`)}
                        placeholder="ex: q-email"
                        />
                        {errors.questions?.[index]?.id && <p className="text-sm text-destructive mt-1">{errors.questions?.[index]?.id?.message}</p>}
                    </div>
                     <div>
                        <Label>Texto da Pergunta</Label>
                        <Input
                        {...register(`questions.${index}.text`)}
                        placeholder="Ex: Qual o seu e-mail?"
                        />
                         {errors.questions?.[index]?.text && <p className="text-sm text-destructive mt-1">{errors.questions?.[index]?.text?.message}</p>}
                    </div>
                     <div>
                        <Label>Tipo da Pergunta</Label>
                        <Select onValueChange={(value) => setValue(`questions.${index}.type`, value as any)} defaultValue={field.type}>
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
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Pergunta
              </Button>
            </div>
            <div className="mt-6 flex justify-end gap-2">
                 <Button variant="outline" type="button" onClick={() => router.back()}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Salvando..." : "Salvar Quiz"}
                </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
