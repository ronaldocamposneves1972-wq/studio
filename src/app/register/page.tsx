
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/logo';
import Image from 'next/image';

const appName = 'ConsorciaTech';
const logoUrl = 'https://ik.imagekit.io/bpsmw0nyu/logo.png';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Erro de Cadastro',
        description: 'A senha deve ter no mínimo 6 caracteres.',
      });
      return;
    }
    setIsLoading(true);
    if (!auth || !firestore) {
       toast({
        variant: 'destructive',
        title: 'Erro de Serviço',
        description: 'Serviços de autenticação ou banco de dados não disponíveis.',
      });
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Create user in Firebase Auth.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const displayName = `${firstName} ${lastName}`.trim();

      // Step 2: Update the user's profile display name in Firebase Auth
      await updateProfile(user, { displayName });

      // Step 3: Create the user document in Firestore.
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, {
        id: user.uid,
        email: user.email,
        name: displayName,
        role: 'Admin', // Assign 'Admin' role to all new users as requested
        createdAt: serverTimestamp(),
        permissions: { // Grant full permissions
          clients: { create: true, read: true, update: true, delete: true },
          products: { create: true, read: true, update: true, delete: true },
          sales_proposals: { create: true, read: true, update: true, delete: true },
          transactions: { create: true, read: true, update: true, delete: true },
          users: { create: true, read: true, update: true, delete: true },
          suppliers: { create: true, read: true, update: true, delete: true },
          cost_centers: { create: true, read: true, update: true, delete: true },
          expense_categories: { create: true, read: true, update: true, delete: true },
          quizzes: { create: true, read: true, update: true, delete: true },
          financial_institutions: { create: true, read: true, update: true, delete: true },
          commissions: { create: true, read: true, update: true, delete: true },
        }
      });


      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Você será redirecionado para o dashboard.',
      });
      router.push('/dashboard');

    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        variant: 'destructive',
        title: 'Erro de Cadastro',
        description:
          error.code === 'auth/email-already-in-use'
            ? 'Este e-mail já está em uso.'
            : 'Ocorreu um erro ao criar a conta.',
      });
    } finally {
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
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Criar uma conta</CardTitle>
          <CardDescription>
            Preencha os campos abaixo para se cadastrar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">Nome</Label>
                <Input
                  id="first-name"
                  placeholder="Seu nome"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Sobrenome</Label>
                <Input
                  id="last-name"
                  placeholder="Seu sobrenome"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
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
              {isLoading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Já tem uma conta?{' '}
            <Link href="/dashboard" className="underline">
              Faça login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
