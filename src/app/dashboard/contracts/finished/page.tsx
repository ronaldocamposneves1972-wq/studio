
'use client'

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import type { Client, ClientStatus } from "@/lib/types"

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

const getStatusVariant = (status: ClientStatus) => {
  switch (status) {
    case 'Finalizado':
      return 'default';
    default:
      return 'outline';
  }
}

export default function FinishedContractsPage() {
  const firestore = useFirestore()
  const router = useRouter()

  const finishedClientsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, 'clients'), where('status', '==', 'Finalizado'))
  }, [firestore])

  const { data: clients, isLoading } = useCollection<Client>(finishedClientsQuery);

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
          <TableCell><Skeleton className="h-5 w-40" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-6 w-28" /></TableCell>
        </TableRow>
      ))
    }

    if (!clients || clients.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-24 text-center">
            Nenhum cliente finalizado no momento.
          </TableCell>
        </TableRow>
      )
    }

    return clients.map(client => (
      <TableRow key={client.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
        <TableCell className="font-medium">{client.name}</TableCell>
        <TableCell>{client.phone}</TableCell>
        <TableCell>{client.email}</TableCell>
        <TableCell>
          <Badge variant={getStatusVariant(client.status)}>{client.status}</Badge>
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <div className="flex flex-col gap-4">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes Finalizados</h1>
          <p className="text-muted-foreground">
            Clientes cujo ciclo de venda foi concluído com sucesso.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Clientes Finalizados</CardTitle>
          <CardDescription>
            A lista abaixo contém todos os clientes com o status "Finalizado".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
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
