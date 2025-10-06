
'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldCheck } from "lucide-react"

export default function IntegrationsPage() {
    return (
        <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
              <CardDescription>
                Gerencie as chaves de API para serviços de terceiros como Cloudinary, WhatsApp, etc.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertTitle>Configuração Segura</AlertTitle>
                  <AlertDescription>
                    As credenciais de integração (como Cloudinary) são gerenciadas diretamente no ambiente do servidor para garantir a máxima segurança. As alterações devem ser feitas no código-fonte da aplicação.
                  </AlertDescription>
                </Alert>
            </CardContent>
          </Card>
    )
}
