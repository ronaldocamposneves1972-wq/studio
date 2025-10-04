'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  PanelLeft,
  Settings,
  PanelLeftClose,
  PanelRightClose,
  Search,
  User,
} from 'lucide-react';
import Image from 'next/image';
import { AppLogo } from '../logo';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection } from 'firebase/firestore';
import type { Client } from '@/lib/types';
import { navItems as allNavItems } from './sidebar'; 
import { cn } from '@/lib/utils';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"


const flattenNavItems = (items: any[]): any[] => {
  let flatList: any[] = [];
  items.forEach(item => {
    if (item.href) {
      flatList.push(item);
    }
    if (item.children) {
      flatList = flatList.concat(flattenNavItems(item.children));
    }
  });
  return flatList;
};


export default function DashboardHeader({ isSidebarCollapsed, setIsSidebarCollapsed }: { isSidebarCollapsed: boolean, setIsSidebarCollapsed: (value: boolean) => void }) {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const [openCommand, setOpenCommand] = useState(false);

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'clients');
  }, [firestore]);
  
  const { data: clients } = useCollection<Client>(clientsQuery);
  const searchablePages = useMemo(() => flattenNavItems(allNavItems), []);
  
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpenCommand((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])


  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const runCommand = (command: () => void) => {
    setOpenCommand(false)
    command()
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="h-8 w-8 hidden sm:inline-flex"
      >
          {isSidebarCollapsed ? <PanelRightClose /> : <PanelLeftClose />}
          <span className="sr-only">Toggle Menu</span>
      </Button>
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs bg-sidebar-custom text-foreground">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <AppLogo className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">ConsorciaTech</span>
            </Link>
            {allNavItems.map((item) => (
               item.href ? (
                 <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-4 px-2.5 text-foreground/70 hover:text-foreground"
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
               ) : null
            ))}
             <Link
                href="/dashboard/settings"
                className="flex items-center gap-4 px-2.5 text-foreground/70 hover:text-foreground"
              >
                <Settings className="h-5 w-5" />
                Configurações
              </Link>
          </nav>
        </SheetContent>
      </Sheet>
      
      <div className="relative ml-auto flex-1 md:grow-0">
         <Button
            variant="outline"
            className={cn(
            "relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
            )}
            onClick={() => setOpenCommand(true)}
        >
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <span className="hidden lg:inline-flex pl-6">Pesquisar...</span>
            <span className="inline-flex lg:hidden pl-6">Pesquisar...</span>
            <kbd className="pointer-events-none absolute right-1.5 top-1/2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
            </kbd>
        </Button>
      </div>

       <CommandDialog open={openCommand} onOpenChange={setOpenCommand}>
        <CommandInput placeholder="Digite um comando ou pesquise..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Clientes">
             {clients?.map((client) => (
              <CommandItem
                key={client.id}
                value={`${client.name} ${client.cpf}`}
                onSelect={() => runCommand(() => router.push(`/dashboard/clients/${client.id}`))}
              >
                <User className="mr-2 h-4 w-4" />
                <span>{client.name}</span>
                {client.cpf && <span className="ml-2 text-xs text-muted-foreground">{client.cpf}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Páginas">
            {searchablePages.map((page) => (
               <CommandItem
                key={page.href}
                value={page.label}
                onSelect={() => runCommand(() => router.push(page.href))}
              >
                <page.icon className="mr-2 h-4 w-4" />
                <span>{page.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Configurações">
            <CommandItem onSelect={() => runCommand(() => router.push(`/dashboard/settings`))}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            {user?.photoURL ? (
                <Image
                    src={user.photoURL}
                    width={36}
                    height={36}
                    alt="Avatar"
                    className="overflow-hidden rounded-full"
                    data-ai-hint="person portrait"
                />
            ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    {user?.email?.charAt(0).toUpperCase()}
                </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user?.displayName || user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => router.push('/dashboard/settings')}>Configurações</DropdownMenuItem>
          <DropdownMenuItem>Suporte</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
