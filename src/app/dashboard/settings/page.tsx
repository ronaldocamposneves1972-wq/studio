'use client'

import Link from "next/link"
import {
  KeyRound,
  Bell,
  Palette,
  Users,
  Webhook,
  FileQuestion,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useCollection, useMemoFirebase, deleteDocumentNonBlocking, useUser } from "@/firebase"
import { useFirestore } from "@/firebase"
import { collection, query, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
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
import type { Quiz } from "@/lib/types"

export default function SettingsPage() {
  const firestore = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  // Note: Firestore security rules should ensure this only returns quizzes if the user is authenticated.
  // We're allowing public reads on quizzes for the landing page, so this fetch is okay for any state.
  const quizzesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'quizzes'));
  }, [firestore]);

  const { data: quizzes, isLoading } = useCollection<Quiz>(quizzesQuery)
  
  const handleDeleteQuiz = (quizId: string, quizName: string) => {
    if (!firestore) return;
    const quizDocRef = doc(firestore, 'quizzes', quizId);
    
    // This function handles its own errors and is non-blocking
    deleteDocumentNonBlocking(quizDocRef);

    toast({
      title: "Quiz excluído",
      description: `O quiz "${quizName}" foi excluído com sucesso.`
    })
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-2">
      <h1 className="text-3xl font-semibold">Configurações</h1>
      <p className="text-muted-foreground">
        Gerencie as configurações da sua conta e da plataforma.
      </p>

      <Tabs defaultValue="quizzes" className="mt-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="users"><Users className="w-4 h-4 mr-2" />Usuários</TabsTrigger>
          <TabsTrigger value="quizzes"><FileQuestion className="w-4 h-4 mr-2" />Quizzes</TabsTrigger>
          <TabsTrigger value="integrations"><KeyRound className="w-4 h-4 mr-2" />Integrações</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2" />Notificações</TabsTrigger>
          <TabsTrigger value="branding"><Palette className="w-4 h-4 mr-2" />Marca</TabsTrigger>
          <TabsTrigger value="webhooks"><Webhook className="w-4 h-4 mr-2" />Webhooks</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Usuários e Permissões</CardTitle>
              <CardDescription>
                Gerencie os membros da equipe e suas funções.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <p className="text-sm text-muted-foreground">Funcionalidade de gerenciamento de usuários em desenvolvimento.</p>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button>Convidar Usuário</Button>
            </CardFooter>
          </Card>
        </TabsContent>
         <TabsContent value="quizzes">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Quizzes</CardTitle>
              <CardDescription>
                Crie e edite os formulários de qualificação para seus clientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading && <p>Carregando quizzes...</p>}
              {quizzes?.map((quiz) => (
                <Card key={quiz.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{quiz.name}</CardTitle>
                     <CardDescription>{quiz.placement === 'landing_page' ? 'Local: Página Inicial' : 'Local: Link para Cliente'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm pt-4">
                    <p>{quiz.questions?.length || 0} perguntas</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="secondary" asChild>
                      <Link href={`/dashboard/settings/quizzes/${quiz.id}`}>Editar</Link>
                    </Button>
                    {/* Only show delete button if the logged-in user is the owner */}
                    {user && quiz.ownerId === user.uid && (
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="sm">
                              <Trash2 className="w-4 h-4 mr-2"/>
                              Excluir
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Essa ação não pode ser desfeita. Isso irá deletar permanentemente o quiz "{quiz.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteQuiz(quiz.id, quiz.name)}>Continuar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </CardFooter>
                </Card>
              ))}
               {!isLoading && quizzes?.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <p>Nenhum quiz encontrado.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
               <Button asChild>
                <Link href="/dashboard/settings/quizzes/new">Criar Novo Quiz</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
              <CardDescription>
                Conecte a ConsorciaTech com suas ferramentas favoritas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key do WhatsApp</label>
                <Input defaultValue="***************" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">API de Análise de Crédito</label>
                <Input placeholder="Cole sua API key aqui" />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button>Salvar</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>
                Configure URLs para receber eventos da plataforma em tempo real.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">URL para Validação de Documentos</label>
                <Input placeholder="https://seu-sistema.com/webhook/doc-validation" />
                 <p className="text-xs text-muted-foreground">
                    Este endpoint será chamado quando o botão "Enviar para Validação" for clicado no perfil do cliente.
                  </p>
              </div>
               <div className="space-y-2">
                <label className="text-sm font-medium">URL para Novas Propostas</label>
                <Input placeholder="https://seu-sistema.com/webhook/new-proposal" />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button>Salvar Webhooks</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
