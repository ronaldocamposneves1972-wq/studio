'use client'

import Link from "next/link"
import {
  KeyRound,
  Bell,
  Palette,
  Users,
  Webhook,
  FileQuestion,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function IntegrationsPage() {
    return (
        <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
              <CardDescription>
                Conecte a ConsorciaTech com suas ferramentas favoritas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Chave de API do WhatsApp</label>
                <Input defaultValue="***************" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">API de Análise de Crédito</label>
                <Input placeholder="Cole sua chave de API aqui" />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button>Salvar</Button>
            </CardFooter>
          </Card>
    )
}
