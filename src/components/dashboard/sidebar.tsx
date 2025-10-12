
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home, Users, Package, Landmark, FileText, DollarSign, Settings,
  FilePlus, BookUser, Briefcase, Download, Mail, GanttChart, Scale,
  ClipboardCheck, ClipboardList, TrendingUp, Check, Receipt, CreditCard, LineChart, ChevronRight, Truck, WalletCards, Shapes
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLogo } from '../logo';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';


export const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  {
    label: 'Esteira', icon: GanttChart, children: [
      { href: '/dashboard/pipeline/discovery', label: 'Discovery', icon: Users },
      { href: '/dashboard/pipeline/Documentacao', label: 'Documentação', icon: Users },
      { href: '/dashboard/pipeline/valor', label: 'Valor', icon: DollarSign },
      { href: '/dashboard/pipeline/clearance', label: 'Clearance', icon: Check },
      { href: '/dashboard/pipeline/ledger', label: 'Ledger', icon: Receipt },
    ],
  },
  {
    label: 'Cadastro', icon: FilePlus, children: [
      { href: '/dashboard/products', label: 'Produtos', icon: Package },
      { href: '/dashboard/banks', label: 'Bancos', icon: Landmark },
      { href: '/dashboard/suppliers', label: 'Fornecedores', icon: Truck },
      { href: '/dashboard/cost-centers', label: 'Centro de Custo', icon: WalletCards },
      { href: '/dashboard/expense-categories', label: 'Tipos de Despesa', icon: Shapes },
      { href: '/dashboard/financials/accounts', label: 'Contas Bancária', icon: CreditCard },
      { href: '/dashboard/settings/users', label: 'Usúarios', icon: Users },
    ],
  },
  {
    label: 'Consulta', icon: BookUser, children: [
      { href: '/dashboard/clients', label: 'Clientes', icon: Users },
      { href: '/dashboard/analytics/production', label: 'Analítico de Produção', icon: LineChart },
      { href: '/dashboard/contracts/by-client', label: 'Contratos por Cliente', icon: Users },
      { href: '/dashboard/opportunity-panel', label: 'Painel de oportunidade', icon: Package },
    ]
  },
  {
    label: 'Formalização', icon: ClipboardCheck, children: [
      { href: '/dashboard/formalization/protocol', label: 'Protocolo', icon: ClipboardList },
    ]
  },
  {
    label: 'Financeiro', icon: DollarSign, children: [
      { href: '/dashboard/financials/accounts-payable', label: 'Contas a Pagar', icon: ClipboardList },
      { href: '/dashboard/financials/accounts-receivable', label: 'Contas a Receber', icon: FileText },
      { href: '/dashboard/financials/cash-flow', label: 'Fluxo de Caixa', icon: FileText },
      { href: '/dashboard/financials/bank-reconciliation', label: 'Conciliação Bancária', icon: FileText },
      { href: '/dashboard/financials/financial-planning', label: 'Planejamento Financeiro', icon: FileText },
      { href: '/dashboard/financials/billing', label: 'Faturamento e Cobrança', icon: FileText },
    ]
  },
  {
    label: 'Utilitários', icon: Briefcase, children: [
      { href: '/dashboard/utils/internal-mail', label: 'Correio Interno', icon: Mail },
      { href: '/dashboard/utils/docs-download', label: 'Download de Documentos', icon: Download },
    ]
  },
  { href: '/dashboard/legal', icon: Scale, label: 'Jurídico' },
];


const NavItemContent = ({ item }: { item: any }) => (
    <>
        <item.icon className="h-4 w-4" />
        <span className="flex-1 text-left">{item.label}</span>
    </>
);

const renderSubMenu = (items: any[]) => {
    return items.map((item) => {
        if (item.children) {
            return (
                <DropdownMenuSub key={item.label}>
                    <DropdownMenuSubTrigger>
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.label}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            {renderSubMenu(item.children)}
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
            );
        }
        return (
            <DropdownMenuItem key={item.label} asChild>
                <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                </Link>
            </DropdownMenuItem>
        );
    });
};

const NavItem = ({ item, isCollapsed }: { item: any, isCollapsed: boolean }) => {
  const pathname = usePathname();
  const isActive = item.href ? pathname.startsWith(item.href) : false;

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              href={item.href || '#'}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary md:h-8 md:w-8",
                isActive && "bg-accent text-primary"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="sr-only">{item.label}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  if (item.children) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="flex items-center justify-start gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary w-full">
                    <NavItemContent item={item} />
                 </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start">
                {renderSubMenu(item.children)}
            </DropdownMenuContent>
        </DropdownMenu>
    );
  }
  
  return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
          isActive && "bg-accent text-primary"
        )}
      >
        <NavItemContent item={item} />
      </Link>
  );
};


export default function DashboardSidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const firestore = useFirestore();

  const brandingDocRef = useMemoFirebase(() => 
    firestore ? doc(firestore, 'settings', 'branding') : null
  , [firestore]);

  const { data: brandingSettings } = useDoc(brandingDocRef);

  return (
    <aside className={cn(
      "hidden sm:flex flex-col fixed inset-y-0 left-0 z-10 border-r bg-background transition-all",
      isCollapsed ? "w-14" : "w-52"
    )}>
      <div className={cn("flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6", isCollapsed ? 'justify-center' : 'justify-start')}>
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
           {brandingSettings?.logoUrl ? (
             <Image src={brandingSettings.logoUrl} alt="Logo" width={24} height={24} />
           ) : (
             <AppLogo className="h-6 w-6" />
           )}
          {!isCollapsed && <span>{brandingSettings?.appName || 'ConsorciaTech'}</span>}
        </Link>
      </div>
      <nav className="flex-1 overflow-auto py-2">
        <div className={cn("grid items-start text-sm font-medium", isCollapsed ? "px-2" : "px-4")}>
          {navItems.map((item) => (
            <NavItem key={item.label} item={item} isCollapsed={isCollapsed} />
          ))}
        </div>
      </nav>
       <div className="mt-auto border-t p-2">
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button variant="ghost" className={cn("w-full", isCollapsed ? 'justify-center' : 'justify-start')}>
                  <Link href="/dashboard/settings" className={cn("flex items-center gap-3 rounded-lg text-muted-foreground transition-all hover:text-primary", isCollapsed && "justify-center")}>
                      <Settings className="h-4 w-4" />
                      {!isCollapsed && "Configurações"}
                  </Link>
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
                <TooltipContent side="right">
                    Configurações
                </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
}
