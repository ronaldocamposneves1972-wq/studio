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

const SidebarItem = ({ item, isCollapsed }: { item: any, isCollapsed: boolean }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const ItemIcon = item.icon;

  const hasChildren = !!item.children;

  // Ativo apenas se a rota atual for exatamente a do item
  const isActive = item.href ? pathname === item.href : false;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {hasChildren ? (
        <div
          className={cn(
            "flex h-9 w-full items-center gap-2 px-3 text-sm cursor-pointer transition-colors",
            isActive ? "font-bold text-gray-900" : "text-gray-500 hover:text-gray-900",
            isCollapsed && "w-12 justify-center p-0"
          )}
        >
          <ItemIcon className="h-5 w-5" />
          {!isCollapsed && <span className="flex-1">{item.label}</span>}
          {!isCollapsed && <ChevronRight className="h-4 w-4 ml-auto" />}
        </div>
      ) : (
        <Link
          href={item.href || '#'}
          className={cn(
            "flex h-9 w-full items-center gap-2 px-3 text-sm transition-colors",
            isActive ? "font-bold text-gray-900" : "text-gray-500 hover:text-gray-900",
            isCollapsed && "justify-center p-0"
          )}
        >
          <ItemIcon className="h-5 w-5" />
          {!isCollapsed && <span>{item.label}</span>}
        </Link>
      )}

      {hasChildren && isOpen && (
        <div className="absolute left-full top-0 ml-1 w-48 bg-white shadow-lg z-50 rounded-md">
          {item.children.map((child: any, index: number) => (
            <div key={child.label}>
              <SidebarItem item={child} isCollapsed={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function DashboardSidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "hidden sm:flex flex-col fixed inset-y-0 left-0 z-10 bg-[#ffffff] transition-all",
      isCollapsed ? "w-14" : "w-52"
    )}>
      <div className={cn("flex h-16 items-center px-4", isCollapsed ? "justify-center" : "justify-start")}>
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-gray-800">
          <AppLogo className="h-8 w-8" />
          {!isCollapsed && <span>Consorcia</span>}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <SidebarItem key={item.label} item={item} isCollapsed={isCollapsed} />
        ))}
      </nav>

      <div className="mt-auto p-2">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex h-9 w-full items-center justify-center gap-2 px-3 text-sm transition-colors",
            pathname === '/dashboard/settings' ? "font-bold text-gray-900" : "text-gray-500 hover:text-gray-900",
            isCollapsed && "justify-center p-0"
          )}
        >
          <Settings className="h-5 w-5" />
          {!isCollapsed && <span>Configurações</span>}
        </Link>
      </div>
    </aside>
  );
}
