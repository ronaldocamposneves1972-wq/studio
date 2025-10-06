
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
import { useFirestore, useCollection, addDocumentNonBlocking, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"

type IntegrationSettings = {
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  whatsappApiKey?: string;
}

export default function IntegrationsPage() {
    const { toast } = useToast()
    const firestore = useFirestore();
    
    const [settings, setSettings] = useState<IntegrationSettings>({
        cloudinaryCloudName: '',
        cloudinaryApiKey: '',
        cloudinaryApiSecret: '',
        whatsappApiKey: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const settingsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Query for the most recent settings document
        return query(collection(firestore, 'settings'), orderBy('savedAt', 'desc'), limit(1));
    }, [firestore]);

    const { data: latestSettings, isLoading: isLoadingSettings } = useCollection<IntegrationSettings & { savedAt: any }>(settingsQuery);

    useEffect(() => {
        if (latestSettings && latestSettings.length > 0) {
            // Load the most recent settings, but don't display the secret
            const { cloudinaryApiSecret, whatsappApiKey, ...displaySettings } = latestSettings[0];
            setSettings({
                ...displaySettings,
                cloudinaryApiSecret: '', // Always keep secret field blank in UI
                whatsappApiKey: '', // Always keep secret field blank in UI
            });
        }
    }, [latestSettings]);


    const handleSave = () => {
        setIsSaving(true);
        if (!firestore) {
            toast({ variant: 'destructive', title: "Erro", description: "O serviço do Firestore não está disponível." });
            setIsSaving(false);
            return;
        }

        const settingsCollection = collection(firestore, 'settings');
        const settingsToSave = {
            ...settings,
            savedAt: new Date().toISOString()
        };

        addDocumentNonBlocking(settingsCollection, settingsToSave)
            .then(() => {
                toast({
                    title: "Configurações Salvas!",
                    description: "Suas chaves de API foram salvas com sucesso.",
                });
                // Clear the secret field from state after saving
                setSettings(prev => ({ ...prev, cloudinaryApiSecret: '', whatsappApiKey: '' }));
            })
            .catch((error) => {
                // This catch block will likely not be hit due to the global error handler,
                // but it's good practice to have it.
                toast({
                    variant: "destructive",
                    title: "Erro ao Salvar",
                    description: "Não foi possível salvar as configurações. Verifique os logs.",
                });
            })
            .finally(() => {
                setIsSaving(false);
            });
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
