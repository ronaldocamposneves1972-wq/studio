'use client'

import {
  Activity,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Users,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import Link from "next/link"

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"

import { clients, proposals, users } from "@/lib/placeholder-data"


const salesData = [
  { name: users[2].name.split(' ')[0], total: Math.floor(Math.random() * 500000) + 100000 },
  { name: 'Maria P.', total: Math.floor(Math.random() * 500000) + 100000 },
  { name: 'João V.', total: Math.floor(Math.random() * 500000) + 100000 },
  { name: 'Lucas F.', total: Math.floor(Math.random() * 500000) + 100000 },
  { name: 'Sofia L.', total: Math.floor(Math.random() * 500000) + 100000 },
]

export default function Dashboard() {
  const totalApproved = proposals.filter(p => p.status === 'Finalizada').reduce((sum, p) => sum + p.value, 0)
  const pendingProposals = proposals.filter(p => p.status === 'Aberta' || p.status === 'Em negociação')
  
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Volume Aprovado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalApproved.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Novos Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{clients.filter(c => c.status === 'Novo').length}</div>
            <p className="text-xs text-muted-foreground">
              +180.1% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propostas Abertas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingProposals.length}</div>
            <p className="text-xs text-muted-foreground">
              {proposals.filter(p => p.status === 'Em negociação').length} em negociação
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões (Mês)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {(totalApproved * 0.025).toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              +19% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Propostas Recentes</CardTitle>
              <CardDescription>
                As propostas mais recentes que necessitam de atenção.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard/proposals">
                Ver Todas
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden xl:table-column">
                    Produto
                  </TableHead>
                  
                  <TableHead className="hidden md:table-cell">
                    Status
                  </TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.slice(0,5).map(proposal => (
                <TableRow key={proposal.id}>
                  <TableCell>
                    <div className="font-medium">{proposal.clientName}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      {clients.find(c => c.name === proposal.clientName)?.email}
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-column">
                    {proposal.productName}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge className="text-xs" variant={proposal.status === 'Finalizada' ? 'default' : 'secondary'}>
                      {proposal.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">R$ {proposal.value.toLocaleString('pt-BR')}</TableCell>
                </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ranking de Vendedores</CardTitle>
            <CardDescription>
              Volume de vendas finalizadas no mês.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={salesData}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${Number(value) / 1000}k`}
                />
                <Tooltip
                  cursor={{fill: 'hsl(var(--accent))', opacity: 0.1}}
                  formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                 />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
