'use client';

import {
  Home, Users, Package, Landmark, FileText, DollarSign, Settings, ChevronRight, Menu, X, FilePlus, FileX, LineChart, BookUser, Shield, Briefcase, Download, Mail, GanttChart, Scale, ClipboardCheck, ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
        label: 'Cadastro', icon: FilePlus,
        children: [
            { href: '/dashboard/proposals/new', label: 'Nova Proposta', icon: FilePlus },
            { href: '/dashboard/restrictions', label: 'Restrição', icon: FileX },
        ],
    },
    {
        label: 'Consulta', icon: BookUser,
        children: [
            { href: '/dashboard/analytics/production', label: 'Analítico de Produção', icon: LineChart },
            { href: '/dashboard/contracts/by-client', label: 'Contratos por Cliente', icon: Users },
            { href: '/dashboard/promoter/debt', label: 'Dívida do Promotor', icon: DollarSign },
            { href: '/dashboard/promoter/statement', label: 'Extrato Pgto Promotor', icon: FileText },
            { href: '/dashboard/debts-discounts', label: 'Dívidas e Descontos', icon: DollarSign },
            { href: '/dashboard/differences-returns', label: 'Diferenças e Devoluções', icon: DollarSign },
            { href: '/dashboard/deferred-commission', label: 'Pgto Comissão Diferido', icon: DollarSign },
            {
                label: 'Comissão', icon: DollarSign,
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
        label: 'Acompanhamento', icon: LineChart,
        children: [
            { href: '/dashboard/proposals', label: 'Propostas', icon: FileText },
        ],
    },
    {
        label: 'Financeiro', icon: DollarSign,
        children: [
             { href: '/dashboard/financials', label: 'Visão Geral', icon: LineChart },
             { href: '/dashboard/financials/transactions', label: 'Transações', icon: FileText },
             { href: '/dashboard/financials/accounts', label: 'Contas Bancárias', icon: Landmark },
        ]
    },
    {
        label: 'Formalização', icon: ClipboardCheck,
        children: [
            { href: '/dashboard/formalization/protocol', label: 'Protocolo', icon: ClipboardList },
            { href: '/dashboard/formalization/pending-contracts', label: 'Contratos Pendentes', icon: FileText },
        ],
    },
    {
        label: 'Utilitários', icon: Briefcase,
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
    const isActive = item.href ? pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) : false;

    if (isCollapsed) {
        return (
            <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Link
                            href={item.href}
                            className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                                isActive
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
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
                isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
        >
            <item.icon className="h-4 w-4" />
            {item.label}
        </Link>
    )
}

const CollapsibleNavLink = ({ item, isCollapsed }: { item: any, isCollapsed: boolean }) => {
    const pathname = usePathname();
    const isChildActive = (children: any[]): boolean => {
        return children.some(child =>
            child.href ? pathname === child.href || pathname.startsWith(child.href) : (child.children ? isChildActive(child.children) : false)
        );
    };

    const isActive = isChildActive(item.children);

    if (isCollapsed) {
        return (
            <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <div className="relative">
                            <div
                                className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-lg transition-colors cursor-pointer",
                                    isActive
                                        ? "bg-accent text-accent-foreground"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                            </div>

                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="p-0">
                        <div className="flex flex-col gap-1 p-1">
                            <p className="font-bold text-foreground px-2 py-1">{item.label}</p>
                            {item.children.map((child: any) => (
                                <NavLink key={child.label} item={child} isCollapsed={false} />
                            ))}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }


    return (
        <Collapsible defaultOpen={isActive}>
            <CollapsibleTrigger asChild>
                <div
                    className={cn("group flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground cursor-pointer",
                    isActive && "text-accent-foreground bg-accent/50"
                    )}
                >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4">
                <div className="flex flex-col gap-1 py-1">
                    {item.children.map((child: any) =>
                        child.children ? (
                            <CollapsibleNavLink key={child.label} item={child} isCollapsed={isCollapsed} />
                        ) : (
                            <NavLink key={child.label} item={child} isCollapsed={isCollapsed} />
                        )
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}

export default function DashboardSidebar({ isCollapsed }: { isCollapsed: boolean }) {

    return (
        <aside
            className={cn("hidden border-r bg-muted/40 md:block transition-all",
                isCollapsed ? 'w-14' : 'w-52'
            )}
        >
            <div className="flex h-full max-h-screen flex-col gap-2">
                <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
                    {navItems.map((item) =>
                        item.children ? (
                            <CollapsibleNavLink key={item.label} item={item} isCollapsed={isCollapsed} />
                        ) : (
                            <NavLink key={item.label} item={item} isCollapsed={isCollapsed} />
                        )
                    )}
                </nav>
                <div className="mt-auto p-2 border-t">
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Link href="/dashboard/settings"
                                    className={cn("flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                    isCollapsed && "justify-center"
                                    )}
                                >
                                     <Settings className={cn("h-4 w-4", isCollapsed && "h-5 w-5")} />
                                    {!isCollapsed && "Configurações"}
                                </Link>
                            </TooltipTrigger>
                             {isCollapsed && <TooltipContent side="right">Configurações</TooltipContent>}
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </aside>
    )
}
