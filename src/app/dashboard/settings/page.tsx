import Link from "next/link"
import {
  CircleUser,
  KeyRound,
  Bell,
  Palette,
  Users,
  Webhook,
  FileQuestion,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

export default function SettingsPage() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-2">
      <h1 className="text-3xl font-semibold">Configurações</h1>
      <p className="text-muted-foreground">
        Gerencie as configurações da sua conta e da plataforma.
      </p>

      <Tabs defaultValue="users" className="mt-4">
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
              {/* User list would go here */}
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quiz de Qualificação Padrão</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>1. Qual seu objetivo com o crédito?</p>
                  <p>2. Possui restrição no nome?</p>
                  <p>3. Valor de entrada disponível.</p>
                  <p>4. Upload de Documentos (RG/CNH, Comp. Renda)</p>
                </CardContent>
                <CardFooter>
                  <Button variant="secondary">Editar</Button>
                </CardFooter>
              </Card>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button>Criar Novo Quiz</Button>
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
            </Header>
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
