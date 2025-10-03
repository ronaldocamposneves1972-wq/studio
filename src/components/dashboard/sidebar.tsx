'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Package,
  Landmark,
  FileText,
  DollarSign,
  Settings,
  ChevronRight,
  Menu,
  X,
  FilePlus,
  FileX,
  LineChart,
  BookUser,
  Shield,
  Briefcase,
  Download,
  Mail,
  GanttChart,
  Scale,
  ClipboardCheck,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { AppLogo } from '../logo';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';


const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    {
        label: 'Cadastro',
        icon: FilePlus,
        children: [
            { href: '/dashboard/proposals/new', label: 'Nova Proposta', icon: FilePlus },
            { href: '/dashboard/restrictions', label: 'Restrição', icon: FileX },
        ],
    },
    {
        label: 'Consulta',
        icon: BookUser,
        children: [
            { href: '/dashboard/analytics/production', label: 'Analítico de Produção', icon: LineChart },
            { href: '/dashboard/contracts/by-client', label: 'Contratos por Cliente', icon: Users },
            { href: '/dashboard/promoter/debt', label: 'Dívida do Promotor', icon: DollarSign },
            { href: '/dashboard/promoter/statement', label: 'Extrato Pgto Promotor', icon: FileText },
            { href: '/dashboard/debts-discounts', label: 'Dívidas e Descontos', icon: DollarSign },
            { href: '/dashboard/differences-returns', label: 'Diferenças e Devoluções', icon: DollarSign },
            { href: '/dashboard/deferred-commission', label: 'Pgto Comissão Diferido', icon: DollarSign },
            { 
                label: 'Comissão',
                icon: DollarSign,
                children: [
                    { href: '/dashboard/commission/current-table', label: 'Tabela Atual', icon: Scale },
                    { href: '/dashboard/commission/best-commission', label: 'Melhor Comissão', icon: DollarSign },
                ]
            },
            { href: '/dashboard/pending-payments', label: 'Pendentes de Pagamento', icon: FileText },
            { href: '/dashboard/opportunity-panel', label: 'Painel de oportunidade', icon: Package },
        ],
    },
    {
        label: 'Acompanhamento',
        icon: LineChart,
        children: [
            { href: '/dashboard/proposals', label: 'Propostas', icon: FileText },
        ],
    },
    {
        label: 'Formalização',
        icon: ClipboardCheck,
        children: [
            { href: '/dashboard/formalization/protocol', label: 'Protocolo', icon: ClipboardList },
            { href: '/dashboard/formalization/pending-contracts', label: 'Contratos Pendentes', icon: FileText },
        ],
    },
    {
        label: 'Utilitários',
        icon: Briefcase,
        children: [
            { href: '/dashboard/utils/internal-mail', label: 'Correio Interno', icon: Mail },
            { href: '/dashboard/utils/docs-download', label: 'Download de Documentos', icon: Download },
            { href: '/dashboard/utils/bank-login-requests', label: 'Solicitações de Login de Banco', icon: Landmark },
        ],
    },
    { href: '/dashboard/charts', icon: GanttChart, label: 'Gráficos' },
    { href: '/dashboard/legal', icon: Scale, label: 'Jurídico' },
];

const NavLink = ({ item, isCollapsed }: { item: any, isCollapsed: boolean }) => {
    const pathname = usePathname();
    const isActive = item.href && (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)));
    const ItemIcon = item.icon;

    const linkContent = (
         <div className={cn(
            "flex h-9 w-full items-center justify-start gap-2 rounded-md px-3 text-sm font-medium transition-colors",
            isActive ? "text-foreground bg-accent/50" : "text-foreground hover:bg-accent/50",
            isCollapsed && "h-9 w-9 justify-center p-0"
        )}>
            {ItemIcon && <ItemIcon className="h-5 w-5" />}
            <span className={cn("truncate", isCollapsed && "sr-only")}>{item.label}</span>
        </div>
    );

    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                     <Link href={item.href || '#'}>
                        {linkContent}
                    </Link>
                </TooltipTrigger>
                {isCollapsed && (
                    <TooltipContent side="right" className="bg-popover text-popover-foreground">
                        {item.label}
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );
};

const CollapsibleNavLink = ({ item, isCollapsed }: { item: any, isCollapsed: boolean }) => {
    const pathname = usePathname();
    const isParentActive = item.children?.some((child: any) => child.href && pathname.startsWith(child.href));
    const ItemIcon = item.icon;

    return (
        <Collapsible defaultOpen={isParentActive}>
            <TooltipProvider delayDuration={0}>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <CollapsibleTrigger asChild>
                             <div className={cn(
                                "flex h-9 w-full items-center justify-start gap-2 rounded-md px-3 text-sm font-medium transition-colors cursor-pointer group",
                                isParentActive ? "text-foreground" : "text-foreground hover:bg-accent/50",
                                isCollapsed && "h-9 w-9 justify-center p-0"
                            )}>
                                {ItemIcon && <ItemIcon className="h-5 w-5" />}
                                <span className={cn("flex-1 truncate text-left", isCollapsed && "sr-only")}>{item.label}</span>
                                {!isCollapsed && <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />}
                            </div>
                        </CollapsibleTrigger>
                    </TooltipTrigger>
                    {isCollapsed && (
                        <TooltipContent side="right" className="bg-popover text-popover.foreground">
                            {item.label}
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
           
            {!isCollapsed && (
                 <CollapsibleContent className="space-y-1 py-1 pl-7">
                    {item.children?.map((child: any) => (
                        child.children ?
                        <CollapsibleNavLink key={child.label} item={child} isCollapsed={isCollapsed} /> :
                        <NavLink key={child.label} item={child} isCollapsed={isCollapsed} />
                    ))}
                </CollapsibleContent>
            )}
        </Collapsible>
    )
}

export default function DashboardSidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();

  return (
    <aside className={cn(
        "hidden sm:flex flex-col fixed inset-y-0 left-0 z-10 border-r transition-all bg-sidebar-custom",
        isCollapsed ? "w-14" : "w-52"
    )}>
         <div className={cn("flex h-16 items-center border-b px-4", isCollapsed ? "justify-center" : "justify-start")}>
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-foreground">
                <AppLogo className="h-8 w-8" />
                <span className={cn(isCollapsed && "sr-only")}>Consorcia</span>
            </Link>
        </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
             item.children ? 
                <CollapsibleNavLink key={item.label} item={item} isCollapsed={isCollapsed} /> : 
                <NavLink key={item.label} item={item} isCollapsed={isCollapsed} />
        ))}
      </nav>
      <div className="mt-auto p-2 border-t border-gray-700">
         <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link href="/dashboard/settings" className={cn(
                        "flex h-9 w-full items-center justify-start gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                        pathname.startsWith('/dashboard/settings') ? "text-foreground bg-accent/50" : "text-foreground hover:bg-accent/50",
                        isCollapsed && "h-9 w-9 justify-center p-0"
                    )}>
                        <Settings className="h-5 w-5" />
                         <span className={cn(isCollapsed && "sr-only")}>Configurações</span>
                    </Link>
                </TooltipTrigger>
                 {isCollapsed && (
                    <TooltipContent side="right" className="bg-popover text-popover-foreground">
                        Configurações
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
}
