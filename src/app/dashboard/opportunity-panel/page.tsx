
'use client'

import { useMemo } from "react"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import type { Client } from "@/lib/types"
import { useRouter } from "next/navigation"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"

export default function OpportunityPanelPage() {
  const firestore = useFirestore()
  const router = useRouter()

  const opportunityQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, 'clients'), where('status', '==', 'Reprovado'))
  }, [firestore])

  const { data: clients, isLoading } = useCollection<Client>(opportunityQuery)

  const clientsWithCountdown = useMemo(() => {
    if (!clients) return []
    return clients.map(client => {
      let daysRemaining = null;
      if (client.reprovalDate) {
        const reprovalDate = new Date(client.reprovalDate)
        const targetDate = new Date(reprovalDate.setDate(reprovalDate.getDate() + 30))
        const now = new Date()
        const diffTime = targetDate.getTime() - now.getTime()
        daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
      }
      return { ...client, daysRemaining }
    })
  }, [clients])

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
          <TableCell><Skeleton className="h-5 w-40" /></TableCell>
          <TableCell><Skeleton className="h-5 w-28" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-36" /></TableCell>
        </TableRow>
      ))
    }

    if (!clientsWithCountdown || clientsWithCountdown.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-24 text-center">
            Nenhuma oportunidade de recrédito encontrada.
          </TableCell>
        </TableRow>
      )
    }

    return clientsWithCountdown.map(client => (
      <TableRow key={client.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
        <TableCell className="font-medium">{client.name}</TableCell>
        <TableCell>{client.reprovalDate ? new Date(client.reprovalDate).toLocaleDateString('pt-BR') : '—'}</TableCell>
        <TableCell>
          {client.daysRemaining !== null ? (
            <Badge variant={client.daysRemaining === 0 ? "default" : "secondary"}>
              {client.daysRemaining === 0 ? 'Pronto para Reanálise' : `${client.daysRemaining} dias restantes`}
            </Badge>
          ) : '—'}
        </TableCell>
        <TableCell>{client.phone}</TableCell>
        <TableCell>{client.email}</TableCell>
      </TableRow>
    ))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel de Oportunidades</h1>
          <p className="text-muted-foreground">
            Clientes reprovados que podem ser reavaliados para novas propostas de crédito.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Clientes em Stand-by</CardTitle>
          <CardDescription>
            Esses clientes foram reprovados, mas podem ser elegíveis para uma nova proposta após 30 dias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Data da Reprovação</TableHead>
                <TableHead>Status da Reanálise</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderContent()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
