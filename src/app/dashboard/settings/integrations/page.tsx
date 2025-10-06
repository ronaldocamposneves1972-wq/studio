
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
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
import { doc, setDoc } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"

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
        if (!firestore) return null;
        return doc(firestore, 'settings', 'integrations');
    }, [firestore]);

    const { data: initialSettings, isLoading } = useDoc<IntegrationSettings>(settingsRef);
    
    const [settings, setSettings] = useState<IntegrationSettings>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (initialSettings) {
            setSettings(initialSettings);
        }
    }, [initialSettings]);

    const handleSave = async () => {
        setIsSaving(true);
        if (!settingsRef) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "O serviço do Firestore não está disponível.",
            });
            setIsSaving(false);
            return;
        }

        try {
            await setDoc(settingsRef, {
                cloudinaryCloudName: settings.cloudinaryCloudName || "",
                cloudinaryApiKey: settings.cloudinaryApiKey || "",
                cloudinaryApiSecret: settings.cloudinaryApiSecret || "",
                whatsappApiKey: settings.whatsappApiKey || ""
            }, { merge: true });

            toast({
                title: "Configurações Salvas!",
                description: "Suas alterações de integração foram salvas com sucesso.",
            });
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Erro ao Salvar",
                description: "Não foi possível salvar as configurações. Verifique as permissões.",
            });
            console.error("Error saving settings:", error);
        } finally {
            // Limpa os campos de senha/segredo após o salvamento para segurança
            setSettings(prev => ({ ...prev, cloudinaryApiSecret: '', whatsappApiKey: '' }));
            setIsSaving(false);
        }
    }
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSettings(prev => ({ ...prev, [id]: value }));
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-10 w-full" /></div>
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-24" />
                </CardFooter>
            </Card>
        );
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
                 <p className="text-sm text-muted-foreground">Seu API secret é confidencial. Deixe em branco para não alterar.</p>
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
