
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
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase"
import { doc, setDoc } from "firebase/firestore"

type IntegrationSettings = {
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  whatsappApiKey?: string;
}

export default function IntegrationsPage() {
    const { toast } = useToast()
    const firestore = useFirestore()
    
    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null
        return doc(firestore, 'settings', 'integrations')
    }, [firestore])

    const { data: remoteSettings, isLoading: isLoadingSettings } = useDoc<IntegrationSettings>(settingsRef)

    const [settings, setSettings] = useState<IntegrationSettings>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
      if (remoteSettings) {
        setSettings({
            cloudinaryCloudName: remoteSettings.cloudinaryCloudName || '',
            cloudinaryApiKey: remoteSettings.cloudinaryApiKey || '',
            // Do not pre-fill the secret for security
            cloudinaryApiSecret: '',
            whatsappApiKey: '',
        });
      }
    }, [remoteSettings]);


    const handleSave = async () => {
        if (!settingsRef) {
            toast({ variant: "destructive", title: "Erro", description: "Serviço do Firestore não disponível."});
            return;
        }

        setIsSaving(true);
        
        try {
            // Prepare data, only include secret if it has been changed
            const dataToSave: Partial<IntegrationSettings> = {
                cloudinaryCloudName: settings.cloudinaryCloudName,
                cloudinaryApiKey: settings.cloudinaryApiKey,
            };

            if (settings.cloudinaryApiSecret) {
                dataToSave.cloudinaryApiSecret = settings.cloudinaryApiSecret;
            }
            if (settings.whatsappApiKey) {
                dataToSave.whatsappApiKey = settings.whatsappApiKey;
            }

            await setDoc(settingsRef, dataToSave, { merge: true });

            toast({
                title: "Configurações Salvas!",
                description: "Suas alterações de integração foram salvas no banco de dados.",
            });
            
            // Limpa os campos de segredo da UI por segurança
            setSettings(prev => ({ ...prev, cloudinaryApiSecret: '', whatsappApiKey: '' }));

        } catch (error: any) {
            console.error("Failed to save settings:", error);
            toast({
                variant: "destructive",
                title: "Erro ao Salvar",
                description: error.message || "Não foi possível salvar as configurações.",
            });
        } finally {
            setIsSaving(false);
        }
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
                 <p className="text-xs text-muted-foreground">Seu API secret é confidencial. Deixe em branco para não alterar.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappApiKey">Chave de API do WhatsApp</Label>
                <Input id="whatsappApiKey" type="password" placeholder="Preencha para alterar a chave" value={settings.whatsappApiKey || ''} onChange={handleInputChange} disabled={isSaving} />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSave} disabled={isSaving || isLoadingSettings}>
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardFooter>
          </Card>
    )
}
