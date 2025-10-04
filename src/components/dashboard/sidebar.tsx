'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Home, Users, Package, Landmark, FileText, DollarSign, Settings, ChevronRight,
  FilePlus, FileX, LineChart, BookUser, Briefcase, Download, Mail, GanttChart, Scale,
  ClipboardCheck, ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLogo } from '../logo';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"


export const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  {
    label: 'Cadastro', icon: FilePlus, children: [
      { href: '/dashboard/clients', label: 'Clientes', icon: Users },
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
    label: 'Financeiro', icon: DollarSign,
    children: [
         { href: '/dashboard/financials', label: 'Visão Geral', icon: LineChart },
         { href: '/dashboard/financials/transactions', label: 'Transações', icon: FileText },
         { href: '/dashboard/financials/accounts', label: 'Contas Bancárias', icon: Landmark },
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

const SidebarItem = ({ item, isCollapsed, closeSheet }: { item: any, isCollapsed: boolean, closeSheet?: () => void }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const ItemIcon = item.icon;

  const hasChildren = !!item.children;
  const isActive = item.href ? pathname.startsWith(item.href) : false;

  const handleLinkClick = () => {
    if (closeSheet) {
      closeSheet();
    }
  };

  if (isCollapsed) {
     return (
      <div
        className="relative group"
      >
        <Link
          href={item.href || '#'}
          onClick={item.href ? handleLinkClick : (e) => e.preventDefault()}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700",
            isActive && "bg-gray-100 text-gray-700 font-bold",
          )}
        >
          <ItemIcon className="h-5 w-5" />
        </Link>

        {hasChildren && (
          <div className="absolute left-full top-0 ml-2 w-56 bg-white shadow-lg z-50 rounded-md border border-gray-200 hidden group-hover:block">
            <div className="p-2 font-semibold text-sm">{item.label}</div>
            {item.children.map((child: any) => (
              <SidebarItem key={child.label} item={child} isCollapsed={false} closeSheet={closeSheet}/>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (hasChildren) {
    return (
       <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
           <button className={cn(
              "flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-700",
            )}>
              <ItemIcon className="h-5 w-5" />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronRight className={cn("h-4 w-4 ml-auto transition-transform", isOpen && "rotate-90")} />
           </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-6 mt-1 space-y-1">
          {item.children.map((child: any) => (
            <SidebarItem key={child.label} item={child} isCollapsed={false} closeSheet={closeSheet}/>
          ))}
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={handleLinkClick}
      className={cn(
        "flex h-10 items-center gap-2 rounded-md px-3 text-sm transition-colors",
        isActive ? "bg-gray-100 text-gray-700 font-bold" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
      )}
    >
      <ItemIcon className="h-5 w-5" />
      <span>{item.label}</span>
    </Link>
  );
};

export default function DashboardSidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "hidden sm:flex flex-col fixed inset-y-0 left-0 z-10 border-r bg-white transition-all",
      isCollapsed ? "w-14" : "w-52"
    )}>
      <div className={cn("flex h-14 items-center border-b px-4", isCollapsed ? "justify-center" : "justify-start")}>
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-gray-700">
          <AppLogo className="h-8 w-8" />
          {!isCollapsed && <span className="font-bold text-primary">Consorcia</span>}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarItem key={item.label} item={item} isCollapsed={isCollapsed} />
        ))}
      </nav>

      <div className="mt-auto p-2 border-t">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex h-9 items-center gap-2 rounded-md px-3 text-sm transition-colors",
            pathname.startsWith('/dashboard/settings') ? "bg-gray-100 font-bold text-gray-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
            isCollapsed && "justify-center"
          )}
        >
          <Settings className="h-5 w-5" />
          {!isCollapsed && <span>Configurações</span>}
        </Link>
      </div>
    </aside>
  );
}
