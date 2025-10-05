
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
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function IntegrationsPage() {
    const { toast } = useToast()

    const handleSave = () => {
        // In a real application, you would save these values securely.
        // For this demo, we'll just show a toast notification.
        toast({
            title: "Configurações Salvas!",
            description: "Suas chaves de API foram salvas com sucesso.",
        })
    }

    return (
        <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
              <CardDescription>
                Gerencie as chaves de API para serviços de terceiros como Cloudinary, WhatsApp, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="cloudinary-cloud-name">Cloudinary Cloud Name</Label>
                <Input id="cloudinary-cloud-name" placeholder="Seu cloud name do Cloudinary" defaultValue={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="cloudinary-api-key">Cloudinary API Key</Label>
                <Input id="cloudinary-api-key" placeholder="Sua API key do Cloudinary" defaultValue={process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="cloudinary-api-secret">Cloudinary API Secret</Label>
                <Input id="cloudinary-api-secret" type="password" placeholder="Seu API secret do Cloudinary" />
                 <p className="text-xs text-muted-foreground">Seu API secret é confidencial e não será exibido aqui.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp-api-key">Chave de API do WhatsApp</Label>
                <Input id="whatsapp-api-key" type="password" placeholder="Cole sua chave de API aqui" />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSave}>Salvar Alterações</Button>
            </CardFooter>
          </Card>
    )
}
