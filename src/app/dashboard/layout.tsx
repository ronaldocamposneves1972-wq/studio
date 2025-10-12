
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import DashboardHeader from '@/components/dashboard/header';
import DashboardSidebar from '@/components/dashboard/sidebar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { initiateEmailSignIn } from '@/firebase';
import { useAuth } from '@/firebase';
import { AppLogo } from '@/components/logo';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const appName = 'Safecred';
const logoUrl = 'https://ik.imagekit.io/bpsmw0nyu/logo.png';


function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

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
      initiateEmailSignIn(auth, email, password);
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

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
             <div className="flex items-center justify-center gap-2 mb-4">
                 {logoUrl ? (
                    <Image src={logoUrl} alt={appName} width={40} height={40} />
                  ) : (
                    <AppLogo className="h-10 w-auto" />
                  )}
                <span className="text-2xl font-bold text-primary">{appName}</span>
              </div>
            <h1 className="text-3xl font-bold">Acessar Painel</h1>
            <p className="text-balance text-muted-foreground">
              Entre com seu e-mail e senha para continuar
            </p>
          </div>
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
          </form>
        </div>
      </div>
      <div className="hidden bg-muted lg:block h-screen overflow-hidden">
        <Image
          src="https://ik.imagekit.io/bpsmw0nyu/1200.jpg"
          alt="Image"
          width={1800}
          height={1200}
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          data-ai-hint="office background"
        />
      </div>
    </div>
  )
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
