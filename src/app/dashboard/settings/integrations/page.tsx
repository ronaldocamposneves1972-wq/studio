
'use client'

import { useState, useEffect } from "react"
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
import { Skeleton } from "@/components/ui/skeleton"

type IntegrationSettings = {
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  whatsappApiKey?: string;
}

export default function IntegrationsPage() {
    const { toast } = useToast()
    
    const [settings, setSettings] = useState<IntegrationSettings>({
        cloudinaryCloudName: '',
        cloudinaryApiKey: '',
        cloudinaryApiSecret: '',
        whatsappApiKey: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingSettings, setIsLoadingSettings] = useState(false);


    const handleSave = () => {
        setIsSaving(true);
        
        // Simulate saving
        setTimeout(() => {
          toast({
              title: "Configurações Salvas!",
              description: "Suas chaves de API foram salvas com sucesso (simulação).",
          });
          setIsSaving(false);
          // Clear secret fields from UI state after saving
          setSettings(prev => ({ ...prev, cloudinaryApiSecret: '', whatsappApiKey: '' }));
        }, 1000);
    }
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSettings(prev => ({ ...prev, [id]: value }));
    }

    if (isLoadingSettings) {
        return (
            <Card>
                <CardHeader>
                  <Skeleton className="h-7 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-10 w-full" /></div>
                </CardContent>
                 <CardFooter className="border-t px-6 py-4">
                    <Skeleton className="h-10 w-32" />
                </CardFooter>
            </Card>
        )
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
                <Label htmlFor="cloudinaryCloudName">Cloudinary Cloud Name</Label>
                <Input id="cloudinaryCloudName" placeholder="Seu cloud name do Cloudinary" value={settings.cloudinaryCloudName || ''} onChange={handleInputChange} disabled={isSaving} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="cloudinaryApiKey">Cloudinary API Key</Label>
                <Input id="cloudinaryApiKey" placeholder="Sua API key do Cloudinary" value={settings.cloudinaryApiKey || ''} onChange={handleInputChange} disabled={isSaving} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="cloudinaryApiSecret">Cloudinary API Secret</Label>
                <Input id="cloudinaryApiSecret" type="password" placeholder="Preencha para alterar o segredo" value={settings.cloudinaryApiSecret || ''} onChange={handleInputChange} disabled={isSaving}/>
                 <p className="text-xs text-muted-foreground">Seu API secret é confidencial e não será exibido. Deixe em branco para não alterar.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappApiKey">Chave de API do WhatsApp</Label>
                <Input id="whatsappApiKey" type="password" placeholder="Preencha para alterar a chave" value={settings.whatsappApiKey || ''} onChange={handleInputChange} disabled={isSaving} />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardFooter>
          </Card>
    )
}
