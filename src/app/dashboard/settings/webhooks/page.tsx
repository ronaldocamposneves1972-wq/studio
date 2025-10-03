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
import { Input } from "@/components/ui/input"

export default function WebhooksPage() {
    return (
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
    )
}
