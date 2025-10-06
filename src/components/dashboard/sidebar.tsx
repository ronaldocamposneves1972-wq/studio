
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Home, Users, Package, Landmark, FileText, DollarSign, Settings, ChevronRight,
  FilePlus, FileX, LineChart, BookUser, Briefcase, Download, Mail, GanttChart, Scale,
  ClipboardCheck, ClipboardList, TrendingUp, Check, Receipt, CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLogo } from '../logo';
import { CircuitBoard } from 'lucide-react';

export const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  {
    label: 'Esteira', icon: CircuitBoard, children: [
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
      { href: '/dashboard/financials/accounts', label: 'Contas Bancária', icon: CreditCard },
      { href: '/dashboard/settings/users', label: 'Vendedores', icon: Users },
      { href: '/dashboard/settings/users', label: 'Usúarios', icon: Users },
    ],
  },
  {
    label: 'Consulta', icon: BookUser, children: [
      { href: '/dashboard/clients', label: 'Clientes', icon: Users },
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
            "flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm cursor-pointer transition-colors",
            isActive ? "font-bold text-gray-600" : "text-gray-500 hover:text-gray-700",
            isCollapsed && "w-12 justify-center p-0",
            "border-b border-gray-200" // separação entre itens
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
            "flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm transition-colors",
            isActive ? "font-bold text-gray-600" : "text-gray-500 hover:text-gray-700",
            isCollapsed && "justify-center p-0",
            "border-b border-gray-200" // separação entre itens
          )}
        >
          <ItemIcon className="h-5 w-5" />
          {!isCollapsed && <span>{item.label}</span>}
        </Link>
      )}

      {hasChildren && isOpen && (
        <div className="absolute left-full top-0 ml-1 w-48 bg-white shadow-lg z-50 rounded-md border border-gray-200">
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
      "hidden sm:flex flex-col fixed inset-y-0 left-0 z-10 border-r bg-white transition-all",
      isCollapsed ? "w-14" : "w-52"
    )}>
      {/* Logo com separação */}
      <div className={cn("flex h-16 items-center border-b border-gray-200 px-4", isCollapsed ? "justify-center" : "justify-start")}>
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-gray-700">
          <AppLogo className="h-8 w-8" />
          {!isCollapsed && <span>Consorcia</span>}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <SidebarItem key={item.label} item={item} isCollapsed={isCollapsed} />
        ))}
      </nav>

      {/* Configurações */}
      <div className="mt-auto p-2 border-t border-gray-200">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex h-9 w-full items-center justify-center gap-2 px-3 text-sm transition-colors",
            pathname === '/dashboard/settings' ? "font-bold text-gray-600" : "text-gray-500 hover:text-gray-700",
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
