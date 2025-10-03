'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home, Users, Package, Landmark, FileText, DollarSign, Settings, ChevronRight,
    FilePlus, FileX, LineChart, BookUser, Briefcase, Download, Mail, GanttChart, Scale,
    ClipboardCheck, ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useState } from 'react';

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


function NavLink({ item, isCollapsed }: { item: any, isCollapsed: boolean }) {
    const pathname = usePathname();
    const isActive = item.href && (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)));
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
                                isActive ? "text-foreground bg-accent/50" : "text-foreground/70 hover:text-foreground hover:bg-accent/20"
                            )}
                        >
                            <ItemIcon className="h-5 w-5" />
                            <span className="sr-only">{item.label}</span>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <Link
            href={item.href}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                isActive ? "text-foreground" : "text-foreground/70 hover:text-foreground"
            )}
        >
            <ItemIcon className="h-5 w-5" />
            {item.label}
        </Link>
    );
}

function CollapsibleNavLink({ item, isCollapsed }: { item: any, isCollapsed: boolean }) {
    const pathname = usePathname();
    const ItemIcon = item.icon;
    const [isOpen, setIsOpen] = useState(item.children?.some((child: any) => child.href && pathname.startsWith(child.href)));

    if (!ItemIcon) return null;

    if (isCollapsed) {
        return (
             <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:text-foreground">
                            <ItemIcon className="h-5 w-5" />
                            <span className="sr-only">{item.label}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-sidebar-custom text-foreground border-border">
                        <div className="flex flex-col gap-1 p-1">
                         {item.children.map((child: any) => (
                                <NavLink key={child.href} item={child} isCollapsed={false} />
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
                    "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition-all",
                    "text-foreground/70 hover:text-foreground"
                )}>
                    <ItemIcon className="h-5 w-5" />
                    <span className="flex-1 truncate">{item.label}</span>
                    <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-90")} />
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-7 space-y-1 mt-1">
                {item.children.map((child: any) => (
                     child.children ? <CollapsibleNavLink key={child.label} item={child} isCollapsed={isCollapsed} /> : <NavLink key={child.href || child.label} item={child} isCollapsed={isCollapsed} />
                ))}
            </CollapsibleContent>
        </Collapsible>
    )
}

export default function DashboardSidebar({ isCollapsed }: { isCollapsed: boolean }) {

    return (
        <aside className={cn(
            "hidden sm:flex flex-col bg-sidebar-custom text-foreground border-r border-border transition-all",
            isCollapsed ? "w-14" : "w-52"
        )}>
            <nav className="flex-1 space-y-1 p-2">
                {navItems.map((item) => (
                    item.children
                        ? <CollapsibleNavLink key={item.label} item={item} isCollapsed={isCollapsed} />
                        : <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />
                ))}
            </nav>
            <div className="mt-auto p-2">
                 <NavLink 
                    item={{href: '/dashboard/settings', icon: Settings, label: 'Configurações' }} 
                    isCollapsed={isCollapsed}
                />
            </div>
        </aside>
    );
}
