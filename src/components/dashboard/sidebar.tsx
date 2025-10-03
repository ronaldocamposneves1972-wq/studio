'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Home,
  Users,
  Package,
  Landmark,
  FileText,
  DollarSign,
  Settings,
} from 'lucide-react';
import { AppLogo } from '../logo';
import { cn } from '@/lib/utils';


const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/dashboard/clients', icon: Users, label: 'Clientes' },
  { href: '/dashboard/proposals', icon: FileText, label: 'Propostas' },
  { href: '/dashboard/products', icon: Package, label: 'Produtos' },
  { href: '/dashboard/banks', icon: Landmark, label: 'Bancos' },
  { href: '/dashboard/financials', icon: DollarSign, label: 'Financeiro' },
];

export default function DashboardSidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();

  return (
    <aside className={cn(
        "fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-sidebar-custom sm:flex transition-[width]",
        isCollapsed ? "w-14" : "w-52"
    )}>
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="/dashboard"
          className={cn("group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base", isCollapsed && "h-9 w-9")}
        >
          <AppLogo className={cn("h-5 w-5 transition-all group-hover:scale-110", isCollapsed && "h-6 w-6")} />
          <span className="sr-only">ConsorciaTech</span>
        </Link>
        <TooltipProvider delayDuration={0}>
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-9 w-9 items-center justify-start gap-4 rounded-lg px-2 transition-colors hover:text-foreground',
                    (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))
                      ? 'text-foreground' 
                      : 'text-foreground/70',
                    isCollapsed ? "w-9 justify-center" : "w-full"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className={cn("sr-only", !isCollapsed && "not-sr-only")}>{item.label}</span>
                </Link>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/dashboard/settings"
                className={cn(
                  'flex h-9 w-9 items-center justify-start gap-4 rounded-lg px-2 transition-colors hover:text-foreground',
                  pathname.startsWith('/dashboard/settings') 
                    ? 'text-foreground' 
                    : 'text-foreground/70',
                  isCollapsed ? "w-9 justify-center" : "w-full"
                )}
              >
                <Settings className="h-5 w-5" />
                <span className={cn("sr-only", !isCollapsed && "not-sr-only")}>Configurações</span>
              </Link>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">Configurações</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  );
}
