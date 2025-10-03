
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
  FilePlus,
  FileX,
  LineChart,
  BookUser,
  Briefcase,
  Download,
  Mail,
  GanttChart,
  Scale,
  ClipboardCheck,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


export default function DashboardSidebar({ isCollapsed, setIsSidebarCollapsed }: { isCollapsed: boolean; setIsSidebarCollapsed: (isCollapsed: boolean) => void }) {
    const pathname = usePathname();

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


    const NavLink = ({ item }: { item: any }) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        const content = (
             <div className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-foreground transition-all",
                isActive ? "" : "text-foreground/70 hover:text-foreground",
                isCollapsed && "justify-center"
            )}>
                {Icon && <Icon className="h-4 w-4" />}
                <span className={cn("truncate", isCollapsed && "sr-only")}>{item.label}</span>
            </div>
        );

        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Link href={item.href}>
                           {content}
                         </Link>
                    </TooltipTrigger>
                    {isCollapsed && (
                        <TooltipContent side="right">
                            {item.label}
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
        )
    }

    const CollapsibleNavLink = ({ item }: { item: any }) => {
        const [isOpen, setIsOpen] = useState(false);
        const Icon = item.icon;
        const isActive = item.children?.some((child: any) => pathname.startsWith(child.href));

        return (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <CollapsibleTrigger asChild>
                                <div className={cn(
                                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-foreground transition-all cursor-pointer",
                                    isActive ? "" : "text-foreground/70 hover:text-foreground",
                                    isCollapsed && "justify-center"
                                )}>
                                    {Icon && <Icon className="h-4 w-4" />}
                                    <span className={cn("flex-1 truncate", isCollapsed && "sr-only")}>{item.label}</span>
                                    {!isCollapsed && (
                                        <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-90")} />
                                    )}
                                </div>
                            </CollapsibleTrigger>
                         </TooltipTrigger>
                         {isCollapsed && (
                            <TooltipContent side="right">
                                {item.label}
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
                {!isCollapsed && (
                    <CollapsibleContent className="mt-1 ml-4 flex flex-col space-y-1 border-l border-gray-700 pl-4">
                        {item.children.map((child: any) => (
                            child.children ? (
                                <CollapsibleNavLink key={child.label} item={child} />
                            ) : (
                                <NavLink key={child.href} item={child} />
                            )
                        ))}
                    </CollapsibleContent>
                )}
            </Collapsible>
        )
    }

    return (
        <aside className={cn("hidden sm:flex flex-col bg-sidebar-custom transition-[width] duration-300", isCollapsed ? "w-16" : "w-64")}>
             <div className={cn("flex h-16 items-center px-4 shrink-0", isCollapsed && "justify-center")}>
                <Link href="/" className="flex items-center gap-2 font-semibold text-white">
                    <Package className="h-6 w-6" />
                    <span className={cn(isCollapsed && "sr-only")}>ConsorciaTech</span>
                </Link>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
                {navItems.map((item) => (
                    item.children ? (
                        <CollapsibleNavLink key={item.label} item={item} />
                    ) : (
                        <NavLink key={item.href} item={item} />
                    )
                ))}
            </nav>
            <div className="mt-auto p-2">
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link href="/dashboard/settings" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-foreground/70 transition-all hover:text-foreground", isCollapsed && "justify-center")}>
                                <Settings className="h-4 w-4" />
                                <span className={cn(isCollapsed && "sr-only")}>Configurações</span>
                            </Link>
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
    