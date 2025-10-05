
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
import { useFirestore, useDoc, updateDocumentNonBlocking, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"

type IntegrationSettings = {
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string; // This will not be fetched back, only written
  whatsappApiKey?: string;
}

export default function IntegrationsPage() {
    const { toast } = useToast()
    const firestore = useFirestore()

    const [settings, setSettings] = useState<IntegrationSettings>({
        cloudinaryCloudName: '',
        cloudinaryApiKey: '',
        cloudinaryApiSecret: '',
        whatsappApiKey: '',
    });
    const [isSaving, setIsSaving] = useState(false)

    const settingsDocRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'settings', 'integrations');
    }, [firestore]);

    const { data: savedSettings, isLoading: isLoadingSettings } = useDoc<IntegrationSettings>(settingsDocRef);
    
    useEffect(() => {
        if (savedSettings) {
            setSettings(prev => ({
                ...prev,
                cloudinaryCloudName: savedSettings.cloudinaryCloudName || '',
                cloudinaryApiKey: savedSettings.cloudinaryApiKey || '',
                whatsappApiKey: savedSettings.whatsappApiKey || '',
                // Important: Do not set the secret here for security reasons
                cloudinaryApiSecret: '', 
            }));
        }
    }, [savedSettings]);


    const handleSave = () => {
        if (!settingsDocRef) {
            toast({ variant: "destructive", title: "Erro", description: "O serviço do Firestore não está disponível." });
            return;
        }
        setIsSaving(true);
        
        // Prepare data to save. Don't save empty secret.
        const dataToSave: Partial<IntegrationSettings> = {
            cloudinaryCloudName: settings.cloudinaryCloudName,
            cloudinaryApiKey: settings.cloudinaryApiKey,
            whatsappApiKey: settings.whatsappApiKey,
        };

        if (settings.cloudinaryApiSecret) {
            dataToSave.cloudinaryApiSecret = settings.cloudinaryApiSecret;
        }

        updateDocumentNonBlocking(settingsDocRef, dataToSave);
        
        toast({
            title: "Configurações Salvas!",
            description: "Suas chaves de API foram salvas com sucesso.",
        });

        // Clear the secret field after saving
        setSettings(prev => ({ ...prev, cloudinaryApiSecret: '' }));

        setIsSaving(false);
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
                <Input id="cloudinaryCloudName" placeholder="Seu cloud name do Cloudinary" value={settings.cloudinaryCloudName} onChange={handleInputChange} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="cloudinaryApiKey">Cloudinary API Key</Label>
                <Input id="cloudinaryApiKey" placeholder="Sua API key do Cloudinary" value={settings.cloudinaryApiKey} onChange={handleInputChange} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="cloudinaryApiSecret">Cloudinary API Secret</Label>
                <Input id="cloudinaryApiSecret" type="password" placeholder="Preencha para alterar o segredo" value={settings.cloudinaryApiSecret} onChange={handleInputChange}/>
                 <p className="text-xs text-muted-foreground">Seu API secret é confidencial e não será exibido. Deixe em branco para não alterar.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappApiKey">Chave de API do WhatsApp</Label>
                <Input id="whatsappApiKey" type="password" placeholder="Preencha para alterar a chave" value={settings.whatsappApiKey} onChange={handleInputChange} />
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
