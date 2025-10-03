'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
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
  Home,
  Users,
  Package,
  Landmark,
  FileText,
  DollarSign,
  Settings,
  CircleUser,
  Building,
} from 'lucide-react';
import Image from 'next/image';
import { users } from '@/lib/placeholder-data';
import { AppLogo } from '../logo';
import React from 'react';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/dashboard/clients', icon: Users, label: 'Clientes' },
  { href: '/dashboard/proposals', icon: FileText, label: 'Propostas' },
  { href: '/dashboard/products', icon: Package, label: 'Produtos' },
  { href: '/dashboard/banks', icon: Landmark, label: 'Bancos' },
  { href: '/dashboard/financials', icon: DollarSign, label: 'Financeiro' },
  { href: '/dashboard/settings', icon: Settings, label: 'Configurações' },
];

const BreadcrumbMap: { [key: string]: string } = {
    'dashboard': 'Dashboard',
    'clients': 'Clientes',
    'proposals': 'Propostas',
    'products': 'Produtos',
    'banks': 'Bancos',
    'financials': 'Financeiro',
    'settings': 'Configurações',
};


export default function DashboardHeader() {
  const pathname = usePathname();
  const currentUser = users[0]; // Assuming the first user is the logged-in user

  const pathSegments = pathname.split('/').filter(Boolean);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <AppLogo className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">ConsorciaTech</span>
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          {pathSegments.map((segment, index) => {
            const href = '/' + pathSegments.slice(0, index + 1).join('/');
            const isLast = index === pathSegments.length - 1;
            const label = BreadcrumbMap[segment] || segment;

            return (
              <React.Fragment key={href}>
                 <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={href}>{label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Can add a search bar here if needed */}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <Image
              src={currentUser.avatarUrl}
              width={36}
              height={36}
              alt="Avatar"
              className="overflow-hidden rounded-full"
              data-ai-hint="person portrait"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Configurações</DropdownMenuItem>
          <DropdownMenuItem>Suporte</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
