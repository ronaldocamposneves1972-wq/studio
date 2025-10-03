'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home, Users, Package, Landmark, FileText, DollarSign, Settings, ChevronRight,
    FilePlus, FileX, LineChart, BookUser, Briefcase, Download, Mail, GanttChart, Scale,
    ClipboardCheck, ClipboardList
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
    label: 'Cadastro', icon: FilePlus, children: [
      { href: '/dashboard/proposals/new', label: 'Nova Proposta', icon: FilePlus },
      { href: '/dashboard/restrictions', label: 'Restrição', icon: FileX },
    ],
  },
  {
    label: 'Consulta', icon: BookUser, children: [
      { href: '/dashboard/analytics/production', label: 'Analítico de Produção', icon: LineChart },
      { href: '/dashboard/contracts/by-client', label: 'Contratos por Cliente', icon: Users },
      { href: '/dashboard/promoter/debt', label: 'Dívida do Promotor', icon: DollarSign },
      { href: '/dashboard/promoter/statement', label: 'Extrato Pgto Promotor', icon: FileText },
      { href: '/dashboard/debts-discounts', label: 'Dívidas e Descontos', icon: DollarSign },
      { href: '/dashboard/differences-returns', label: 'Diferenças e Devoluções', icon: DollarSign },
      { href: '/dashboard/deferred-commission', label: 'Pgto Comissão Diferido', icon: DollarSign },
      {
        label: 'Comissão', icon: DollarSign, children: [
          { href: '/dashboard/commission/current-table', label: 'Tabela Atual', icon: Scale },
          { href: '/dashboard/commission/best-commission', label: 'Melhor Comissão', icon: DollarSign },
        ]
      },
      { href: '/dashboard/pending-payments', label: 'Pendentes de Pagamento', icon: FileText },
      { href: '/dashboard/opportunity-panel', label: 'Painel de oportunidade', icon: Package },
    ]
  },
  {
    label: 'Acompanhamento', icon: LineChart, children: [
      { href: '/dashboard/proposals', label: 'Propostas', icon: FileText },
    ]
  },
  {
    label: 'Formalização', icon: ClipboardCheck, children: [
      { href: '/dashboard/formalization/protocol', label: 'Protocolo', icon: ClipboardList },
      { href: '/dashboard/formalization/pending-contracts', label: 'Contratos Pendentes', icon: FileText },
    ]
  },
  {
    label: 'Utilitários', icon: Briefcase, children: [
      { href: '/dashboard/utils/internal-mail', label: 'Correio Interno', icon: Mail },
      { href: '/dashboard/utils/docs-download', label: 'Download de Documentos', icon: Download },
      { href: '/dashboard/utils/bank-login-requests', label: 'Solicitações de Login de Banco', icon: Landmark },
    ]
  },
  { href: '/dashboard/charts', icon: GanttChart, label: 'Gráficos' },
  { href: '/dashboard/legal', icon: Scale, label: 'Jurídico' },
];


const NavLink = ({ item, isCollapsed }: { item: any, isCollapsed: boolean }) => {
    const pathname = usePathname();
    const isActive = item.href ? pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) : false;
    const ItemIcon = item.icon;

    if (!ItemIcon) return null;

    if (isCollapsed) {
        return (
             <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Link
                            href={item.href}
                            className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                                isActive ? "text-foreground" : "text-foreground/70 hover:text-foreground",
                            )}
                        >
                            <ItemIcon className="h-5 w-5" />
                            <span className="sr-only">{item.label}</span>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return (
        <Link
            href={item.href}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                isActive ? "text-foreground" : "text-foreground/70 hover:text-foreground",
            )}
        >
            <ItemIcon className="h-5 w-5" />
            {item.label}
        </Link>
    )
}

const CollapsibleNavLink = ({ item, isCollapsed }: { item: any, isCollapsed: boolean }) => {
    const pathname = usePathname();
    const isParentActive = item.children.some((child: any) => child.href && (pathname === child.href || pathname.startsWith(child.href)));
    const [isOpen, setIsOpen] = useState(isParentActive);
    const ItemIcon = item.icon;

    if (!ItemIcon) return null;

    if (isCollapsed) {
        return (
             <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                         <div className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/70">
                             <ItemIcon className="h-5 w-5" />
                             <span className="sr-only">{item.label}</span>
                         </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <div className="flex flex-col gap-2">
                         {item.children.map((child: any) => (
                             <Link href={child.href} key={child.label}>{child.label}</Link>
                         ))}
                         </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                 <div className={cn(
                        "group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-foreground/70 transition-all hover:text-foreground",
                        isParentActive && "text-foreground",
                    )}>
                    <div className="flex items-center gap-3">
                         <ItemIcon className="h-5 w-5" />
                        <span>{item.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-8 space-y-1 py-1">
                {item.children.map((child: any) => (
                    child.children ? <CollapsibleNavLink key={child.label} item={child} isCollapsed={false} /> : <NavLink key={child.label} item={child} isCollapsed={false} />
                ))}
            </CollapsibleContent>
        </Collapsible>
    )
}


export default function DashboardSidebar({ isCollapsed }: { isCollapsed: boolean }) {
    return (
        <aside className={cn(
            "hidden sm:flex flex-col fixed inset-y-0 left-0 z-20 border-r bg-sidebar-custom transition-all text-foreground",
            isCollapsed ? "w-14" : "w-52"
        )}>
             <div className={cn("flex h-14 items-center border-b px-4", isCollapsed ? "justify-center" : "justify-start")}>
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    <AppLogo className={cn("h-8 w-8", isCollapsed && "h-6 w-6")} />
                    {!isCollapsed && <span>Consorcia</span>}
                </Link>
            </div>
            <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
                {navItems.map((item) => (
                    item.children ? <CollapsibleNavLink key={item.label} item={item} isCollapsed={isCollapsed} /> : <NavLink key={item.label} item={item} isCollapsed={isCollapsed} />
                ))}
            </nav>
            <div className="mt-auto p-2 border-t border-t-zinc-700">
                <NavLink isCollapsed={isCollapsed} item={{ href: '/dashboard/settings', icon: Settings, label: 'Configurações' }} />
            </div>
        </aside>
    );
}