
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import DashboardHeader from '@/components/dashboard/header';
import DashboardSidebar from '@/components/dashboard/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { AppLogo } from '@/components/logo';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { doc } from 'firebase/firestore';
import Image from 'next/image';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const brandingDocRef = useMemoFirebase(() => 
    firestore ? doc(firestore, 'settings', 'branding') : null
  , [firestore]);
  const { data: brandingSettings } = useDoc(brandingDocRef);

  const appName = brandingSettings?.appName || 'ConsorciaTech';
  const logoUrl = brandingSettings?.logoUrl;


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'O serviço de autenticação não está disponível.',
        });
        setIsLoading(false);
        return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The user state change will be detected by DashboardLayout, which will handle the UI update.
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro de Login',
        description:
          error.code === 'auth/invalid-credential'
            ? 'Credenciais inválidas. Verifique seu e-mail e senha.'
            : 'Ocorreu um erro ao fazer login.',
      });
      setIsLoading(false);
    }
  };
  
    const handleAnonymousLogin = async () => {
    setIsLoading(true);
    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'O serviço de autenticação não está disponível.',
        });
        setIsLoading(false);
        return;
    }
    try {
      await signInAnonymously(auth);
      // The user state change will be detected by DashboardLayout.
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Ocorreu um erro ao tentar o login anônimo.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-card">
      <div className="mb-8 flex items-center gap-2 text-primary">
         {logoUrl ? (
            <Image src={logoUrl} alt={appName} width={40} height={40} />
          ) : (
            <AppLogo className="h-10 w-auto" />
          )}
        <span className="text-2xl font-semibold">{appName}</span>
      </div>
      <Card className="w-full max-w-sm border-0 md:border shadow-none md:shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Entre com seu e-mail e senha para acessar o painel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
             <Button
              variant="outline"
              className="w-full"
              onClick={handleAnonymousLogin}
              disabled={isLoading}
              type="button"
            >
              Entrar como Convidado
            </Button>
          </form>
            <div className="mt-4 text-center text-sm">
            Não tem uma conta?{' '}
            <Link href="/register" className="underline">
              Cadastre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const firestore = useFirestore();

  const brandingDocRef = useMemoFirebase(() =>
    firestore ? doc(firestore, 'settings', 'branding') : null
  , [firestore]);
  
  const { data: brandingSettings } = useDoc(brandingDocRef);

  useEffect(() => {
    if (brandingSettings) {
      const root = document.documentElement;
      root.style.setProperty('--primary', brandingSettings.primaryColor);
      root.style.setProperty('--secondary', brandingSettings.secondaryColor);
    }
  }, [brandingSettings]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <DashboardSidebar isCollapsed={isSidebarCollapsed} />
      <div className={cn("flex flex-col transition-all duration-300 ease-in-out", isSidebarCollapsed ? "sm:pl-14" : "sm:pl-52")}>
        <DashboardHeader 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-4 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
         <div className="flex flex-col items-center gap-4">
            <AppLogo className="h-12 w-auto animate-pulse" />
            <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
