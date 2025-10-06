
'use client'

import Link from "next/link"
import {
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

export default function QuizzesPage() {
  const firestore = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const quizzesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'quizzes'));
  }, [firestore]);

  const { data: quizzes, isLoading } = useCollection<Quiz>(quizzesQuery)
  
  const handleDeleteQuiz = (quizId: string, quizName: string) => {
    if (!firestore) return;
    const quizDocRef = doc(firestore, 'quizzes', quizId);
    
    deleteDocumentNonBlocking(quizDocRef);

    toast({
      title: "Quiz excluído",
      description: `O quiz "${quizName}" foi excluído com sucesso.`
    })
  }

  return (
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={!user}>
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
  )
}
