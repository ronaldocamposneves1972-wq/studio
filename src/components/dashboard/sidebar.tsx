
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Users, Package, Landmark, FileText, DollarSign, Settings,
  FilePlus, BookUser, Briefcase, Download, Mail, GanttChart, Scale,
  ClipboardCheck, ClipboardList, TrendingUp, Check, Receipt, CreditCard, LineChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLogo } from '../logo';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';


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
    label: 'Acompanhamento', icon: TrendingUp, children: [
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

const NavItem = ({ item, isCollapsed }: { item: any, isCollapsed: boolean }) => {
  const pathname = usePathname();
  const isActive = item.href ? pathname === item.href : false;

  const renderLink = (item: any) => (
    <Link
        href={item.href}
        className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "text-primary bg-muted",
        isCollapsed && "justify-center"
        )}
    >
        <item.icon className="h-4 w-4" />
        {!isCollapsed && item.label}
    </Link>
  );

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {item.children ? (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value={item.label} className="border-b-0">
                <AccordionTrigger
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:no-underline",
                    isCollapsed && "justify-center",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {!isCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                </AccordionTrigger>
                <AccordionContent className="pl-8 space-y-1">
                  {item.children.map((child: any) => (
                    <NavItem key={child.label} item={child} isCollapsed={isCollapsed} />
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            isCollapsed ? renderLink(item) : renderLink(item)
          )}
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

export default function DashboardSidebar({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <aside className={cn(
      "hidden sm:flex flex-col fixed inset-y-0 left-0 z-10 border-r bg-background transition-all",
      isCollapsed ? "w-14" : "w-52"
    )}>
      <div className={cn("flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6", isCollapsed ? 'justify-center' : 'justify-start')}>
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <AppLogo className="h-6 w-6" />
          {!isCollapsed && <span>ConsorciaTech</span>}
        </Link>
      </div>
      <nav className="flex-1 overflow-auto py-2">
        <div className="grid items-start px-2 text-sm font-medium lg:px-4">
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
