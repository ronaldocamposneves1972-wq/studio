

'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ChevronLeft, PlusCircle, Trash2 } from "lucide-react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

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
import { useFirestore, useUser } from "@/firebase"
import type { Quiz } from "@/lib/types"

const questionSchema = z.object({
  id: z.string().min(1, "ID da pergunta é obrigatório"),
  text: z.string().min(1, "O texto da pergunta é obrigatório"),
  type: z.enum(["text", "number", "email", "tel", "radio", "checkbox", "file", "cep", "address", "address_number", "address_complement", "cpf"]),
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

const initialDataCadastro = {
  name: "Cadastro Inicial de Cliente",
  slug: "landing_page" as Quiz['slug'],
  questions: [
    { id: "q-name", text: "Nome Completo*", type: "text" as const, options: "" },
    { id: "q-cpf", text: "CPF*", type: "cpf" as const, options: "" },
    { id: "q-birthdate", text: "Data de Nascimento*", type: "text" as const, options: "" },
    { id: "q-phone", text: "Telefone Celular*", type: "tel" as const, options: "" },
    { id: "q-email", text: "Email*", type: "email" as const, options: "" },
    { id: "q-mothername", text: "Nome da Mãe*", type: "text" as const, options: "" },
    { id: "q-cep", text: "CEP*", type: "cep" as const, options: "" },
    { id: "q-address", text: "Endereço*", type: "address" as const, options: "" },
    { id: "q-address-number", text: "Número*", type: "address_number" as const, options: "" },
    { id: "q-address-complement", text: "Complemento", type: "address_complement" as const, options: "" },
    { id: "q-neighborhood", text: "Bairro*", type: "text" as const, options: "" },
    { id: "q-city", text: "Cidade*", type: "text" as const, options: "" },
    { id: "q-state", text: "Estado*", type: "text" as const, options: "" },
  ],
}

const initialDataDocs = {
  name: "Envio de Documentos",
  slug: "client_link" as Quiz['slug'],
  questions: [
    { id: "q-income", text: "Renda Mensal Comprovada", type: "number" as const, options: "" },
    { id: "q-bank-name", text: "Banco", type: "text" as const, options: "" },
    { id: "q-bank-agency", text: "Agência", type: "text" as const, options: "" },
    { id: "q-bank-account", text: "Número da Conta", type: "text" as const, options: "" },
    { id: "q-bank-digit", text: "Dígito da Conta", type: "text" as const, options: "" },
    { id: "q-account-type", text: "Tipo de Conta", type: "radio" as const, options: "Conta Corrente, Conta Poupança" },
    { id: "q-doc-id", text: "RG ou CNH (Frente e Verso)", type: "file" as const, options: "" },
    { id: "q-doc-address", text: "Comprovante de Endereço", type: "file" as const, options: "" },
    { id: "q-doc-payslip", text: "Último Holerite/Comprovante de Renda", type: "file" as const, options: "" },
  ],
}

export default function NewQuizPage() {
  const router = useRouter()
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user, isUserLoading } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: initialDataCadastro,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  })

  const handleTemplateChange = (template: 'cadastro' | 'docs') => {
    if (template === 'cadastro') {
      reset(initialDataCadastro);
    } else {
      reset(initialDataDocs);
    }
  }

  const onSubmit = async (data: QuizFormData) => {
    if (!user) {
       toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar um quiz.",
      })
      return;
    }

    setIsSubmitting(true)

    const quizData = {
      ...data,
      ownerId: user.uid, // Add ownerId
      questions: data.questions.map(q => ({
        ...q,
        options: q.options ? q.options.split(',').map(opt => opt.trim()) : [],
      })),
      createdAt: serverTimestamp(),
    }

    try {
      if (!firestore) throw new Error("Firestore not available");
      const quizzesCollection = collection(firestore, 'quizzes');
      
      await addDoc(quizzesCollection, quizData);
      
      toast({
        title: "Quiz criado com sucesso!",
        description: `O quiz "${data.name}" foi salvo.`,
      })
      router.push("/dashboard/settings/quizzes")
    } catch (error) {
      console.error("Error creating quiz: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar quiz",
        description: "Não foi possível salvar o quiz. Verifique as permissões do Firestore.",
      })
    } finally {
        setIsSubmitting(false)
    }
  }

  if (isUserLoading) {
    return <p>Carregando...</p>
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
          Novo Quiz
        </h1>
        <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleTemplateChange('cadastro')}>Usar Modelo de Cadastro</Button>
            <Button variant="outline" size="sm" onClick={() => handleTemplateChange('docs')}>Usar Modelo de Documentos</Button>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Quiz</CardTitle>
            <CardDescription>
              Dê um nome ao seu quiz, escolha um modelo ou crie suas próprias perguntas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
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
                    <Label>Página do Quiz</Label>
                     <Select onValueChange={(value) => setValue("slug", value as Quiz['slug'])} defaultValue="landing_page" disabled={isSubmitting}>
                        <SelectTrigger className={errors.slug ? "border-destructive" : ""}>
                            <SelectValue placeholder="Selecione onde o quiz será usado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="landing_page">Página Principal (Genérica)</SelectItem>
                            <SelectItem value="credito-pessoal">Página - Crédito Pessoal</SelectItem>
                            <SelectItem value="credito-clt">Página - Crédito CLT</SelectItem>
                            <SelectItem value="antecipacao-fgts">Página - Antecipação FGTS</SelectItem>
                            <SelectItem value="refinanciamento">Página - Refinanciamento</SelectItem>
                            <SelectItem value="client_link">Link para Cliente (Documentos)</SelectItem>
                        </SelectContent>
                    </Select>
                     {errors.slug && <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>}
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
                        <Select onValueChange={(value) => setValue(`questions.${index}.type`, value as any)} defaultValue={field.type} disabled={isSubmitting}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="text">Texto</SelectItem>
                                <SelectItem value="number">Número</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="tel">Telefone</SelectItem>
                                <SelectItem value="cpf">CPF</SelectItem>
                                <SelectItem value="radio">Múltipla Escolha (Radio)</SelectItem>
                                <SelectItem value="checkbox">Seleção (Checkbox)</SelectItem>
                                <SelectItem value="file">Arquivo</SelectItem>
                                <SelectItem value="cep">CEP</SelectItem>
                                <SelectItem value="address">Endereço (autocomplete)</SelectItem>
                                <SelectItem value="address_number">Número do Endereço</SelectItem>
                                <SelectItem value="address_complement">Complemento</SelectItem>
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
            <div className="mt-6 flex justify-end gap-2">
                 <Button variant="outline" type="button" onClick={() => router.back()} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : "Salvar Quiz"}
                </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
