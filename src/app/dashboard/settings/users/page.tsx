'use client'

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"


export default function UsersPage() {
    return (
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
    )
}
