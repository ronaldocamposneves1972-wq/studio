
'use client'

import {
  KeyRound,
  Bell,
  Palette,
  Users,
  Webhook,
  FileQuestion,
} from "lucide-react"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';


const navLinks = [
  { href: "/dashboard/settings/users", label: "Usuários", icon: Users },
  { href: "/dashboard/settings/quizzes", label: "Quizzes", icon: FileQuestion },
  { href: "/dashboard/settings/integrations", label: "Integrações", icon: KeyRound },
  { href: "/dashboard/settings/notifications", label: "Notificações", icon: Bell },
  { href: "/dashboard/settings/branding", label: "Marca", icon: Palette },
  { href: "/dashboard/settings/webhooks", label: "Webhooks", icon: Webhook },
]


export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="mx-auto w-full max-w-6xl">
       <div className="mb-4">
            <h1 className="text-3xl font-semibold">Configurações</h1>
            <p className="text-muted-foreground">
                Gerencie as configurações da sua conta e da plataforma.
            </p>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6">
        <nav className="flex flex-col gap-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith(link.href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
        <main>{children}</main>
      </div>
    </div>
  )
}
