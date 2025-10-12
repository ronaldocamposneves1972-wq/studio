'use client'

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase"
import { doc, setDoc } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { AppLogo } from "@/components/logo"

const brandingSchema = z.object({
  appName: z.string().min(3, "O nome do aplicativo é obrigatório."),
  logoUrl: z.string().url("URL do logo inválida").optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor primária deve ser um código HEX (ex: #1a9fbd)"),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor secundária deve ser um código HEX (ex: #eef2f6)"),
});

type BrandingFormData = z.infer<typeof brandingSchema>;

function hexToHsl(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '';
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    return `${h} ${s}% ${l}%`;
}


export default function BrandingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { toast } = useToast()
  const firestore = useFirestore()

  const brandingDocRef = useMemoFirebase(() => 
    firestore ? doc(firestore, 'settings', 'branding') : null
  , [firestore]);

  const { data: brandingSettings, isLoading: isLoadingSettings } = useDoc<BrandingFormData>(brandingDocRef);

  const form = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      appName: 'ConsorciaTech',
      logoUrl: '',
      primaryColor: '#1a9fbd',
      secondaryColor: '#eef2f6',
    }
  });

  useEffect(() => {
    if (brandingSettings) {
      form.reset(brandingSettings);
    }
  }, [brandingSettings, form]);

  const watchedLogoUrl = form.watch('logoUrl');
  const watchedPrimaryColor = form.watch('primaryColor');
  const watchedSecondaryColor = form.watch('secondaryColor');

  const onSubmit = async (data: BrandingFormData) => {
    if (!brandingDocRef) {
      toast({ variant: "destructive", title: "Erro de conexão" });
      return;
    }
    setIsSubmitting(true);
    try {
      // Save HEX colors in DB, but apply HSL to CSS variables
      await setDoc(brandingDocRef, data, { merge: true });

      const root = document.documentElement.style;
      root.setProperty('--primary-hsl', hexToHsl(data.primaryColor));
      root.setProperty('--secondary-hsl', hexToHsl(data.secondaryColor));

      toast({ title: "Configurações de marca salvas com sucesso!" });
      // Optionally force a reload to see changes globally
      // window.location.reload();
    } catch (error) {
      console.error("Error saving branding settings:", error);
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Não foi possível salvar as configurações." });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (isLoadingSettings) {
      return (
          <Card>
              <CardHeader>
                  <Skeleton className="h-8 w-1/3"/>
                  <Skeleton className="h-4 w-2/3 mt-1"/>
              </CardHeader>
              <CardContent className="space-y-6">
                 <Skeleton className="h-10 w-full"/>
                 <Skeleton className="h-24 w-full"/>
                 <Skeleton className="h-10 w-full"/>
                 <Skeleton className="h-10 w-full"/>
              </CardContent>
              <CardFooter className="border-t px-6 py-4 flex justify-end">
                <Skeleton className="h-10 w-28"/>
              </CardFooter>
          </Card>
      )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Marca e Aparência</CardTitle>
          <CardDescription>
            Personalize o nome, logo e cores da sua plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="appName">Nome da Aplicação</Label>
            <Input id="appName" {...form.register("appName")} placeholder="Ex: Minha Empresa" />
            {form.formState.errors.appName && <p className="text-sm text-destructive">{form.formState.errors.appName.message}</p>}
          </div>

           <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
               <div className="h-16 w-16 rounded-md border flex items-center justify-center bg-muted">
                    {watchedLogoUrl ? (
                        <Image src={watchedLogoUrl} alt="Preview do Logo" width={64} height={64} className="object-contain rounded-md" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    ) : (
                        <AppLogo className="h-10 w-10 text-muted-foreground"/>
                    )}
               </div>
                <div className="flex-1">
                    <Label htmlFor="logoUrl">URL do Logo</Label>
                    <Input id="logoUrl" {...form.register('logoUrl')} placeholder="https://exemplo.com/logo.png" />
                </div>
            </div>
             {form.formState.errors.logoUrl && <p className="text-sm text-destructive">{form.formState.errors.logoUrl.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Cor Primária</Label>
              <div className="flex items-center gap-2">
                <Input type="color" {...form.register("primaryColor")} className="p-1 h-10 w-12" />
                <Input id="primaryColor" {...form.register("primaryColor")} placeholder="#1a9fbd" />
              </div>
              {form.formState.errors.primaryColor && <p className="text-sm text-destructive">{form.formState.errors.primaryColor.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Cor Secundária</Label>
               <div className="flex items-center gap-2">
                 <Input type="color" {...form.register("secondaryColor")} className="p-1 h-10 w-12" />
                 <Input id="secondaryColor" {...form.register("secondaryColor")} placeholder="#eef2f6" />
               </div>
              {form.formState.errors.secondaryColor && <p className="text-sm text-destructive">{form.formState.errors.secondaryColor.message}</p>}
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
