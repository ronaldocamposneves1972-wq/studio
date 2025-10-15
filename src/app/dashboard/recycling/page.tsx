
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

export default function RecyclingPage() {
  const firestore = useFirestore()
  const router = useRouter()

  const recyclingQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, 'clients'), where('status', '==', 'Reciclagem'))
  }, [firestore])

  const { data: clients, isLoading } = useCollection<Client>(recyclingQuery)

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
          <TableCell><Skeleton className="h-5 w-40" /></TableCell>
          <TableCell><Skeleton className="h-5 w-28" /></TableCell>
        </TableRow>
      ))
    }

    if (!clients || clients.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={3} className="h-24 text-center">
            Nenhum cliente na reciclagem.
          </TableCell>
        </TableRow>
      )
    }

    return clients.map(client => (
      <TableRow key={client.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
        <TableCell className="font-medium">{client.name}</TableCell>
        <TableCell>{client.phone}</TableCell>
        <TableCell>{client.email}</TableCell>
      </TableRow>
    ))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reciclagem de Leads</h1>
          <p className="text-muted-foreground">
            Clientes que foram movidos para a reciclagem para contato futuro.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Clientes em Reciclagem</CardTitle>
          <CardDescription>
            Esses clientes podem ser reativados em campanhas futuras.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
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
