
'use client'

import {
  Activity,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Users,
} from "lucide-react"
import Link from "next/link"
import type { Proposal, Client, User } from "@/lib/types"

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
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { useMemo } from "react"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, limit, orderBy, where } from "firebase/firestore"


function KPICard({ title, icon: Icon, value, subtext, isLoading }: { title: string, icon: React.ElementType, value: string, subtext: string, isLoading: boolean }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2 mt-1" />
                    </>
                ) : (
                    <>
                        <div className="text-2xl font-bold">{value}</div>
                        <p className="text-xs text-muted-foreground">{subtext}</p>
                    </>
                )}
            </CardContent>
        </Card>
    )
}


export default function Dashboard() {
    const firestore = useFirestore();

    // Specific queries for approved and open proposals to avoid broad "list" calls
    const approvedProposalsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'sales_proposals'), where('status', '==', 'Finalizada')) : null, [firestore]);
    const openProposalsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'sales_proposals'), where('status', 'in', ['Aberta', 'Em negociação'])) : null, [firestore]);
    const recentProposalsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'sales_proposals'), orderBy('createdAt', 'desc'), limit(5)) : null, [firestore]);
    const clientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'clients')) : null, [firestore]);
    const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);

    const { data: approvedProposals, isLoading: isLoadingApproved } = useCollection<Proposal>(approvedProposalsQuery);
    const { data: openProposals, isLoading: isLoadingOpen } = useCollection<Proposal>(openProposalsQuery);
    const { data: recentProposals, isLoading: isLoadingRecentProposals } = useCollection<Proposal>(recentProposalsQuery);
    const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
    const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);


    const { totalApproved, commissionValue } = useMemo(() => {
        if (!approvedProposals) return { totalApproved: 0, commissionValue: 0 };
        const total = approvedProposals.reduce((sum, p) => sum + p.value, 0);
        const commission = total * 0.025; // Assuming 2.5% commission
        return {
            totalApproved: total,
            commissionValue: commission,
        };
    }, [approvedProposals]);
    
    const { pendingProposalsCount, inNegotiationCount } = useMemo(() => {
        if (!openProposals) return { pendingProposalsCount: 0, inNegotiationCount: 0 };
        return {
             pendingProposalsCount: openProposals.filter(p => p.status === 'Aberta').length,
             inNegotiationCount: openProposals.filter(p => p.status === 'Em negociação').length,
        }
    }, [openProposals]);


    const clientsRegisteredToday = useMemo(() => {
        if (!clients) return 0;
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];

        return clients.filter(c => {
            if (!c.createdAt) return false;
            try {
                const clientDate = new Date(c.createdAt).toISOString().split('T')[0];
                return clientDate === todayString;
            } catch (e) {
                return false;
            }
        }).length;
    }, [clients]);
    
    const salesData = useMemo(() => {
        if (!approvedProposals || !users) return [];
        
        const salesByRep: Record<string, number> = {};

        approvedProposals.forEach(proposal => {
            if (proposal.salesRepName) {
                if (!salesByRep[proposal.salesRepName]) {
                    salesByRep[proposal.salesRepName] = 0;
                }
                salesByRep[proposal.salesRepName] += proposal.value;
            }
        });

        return Object.entries(salesByRep)
            .map(([name, total]) => ({ name: name.split(' ')[0], total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

    }, [approvedProposals, users]);

  const isLoading = isLoadingApproved || isLoadingOpen || isLoadingClients || isLoadingRecentProposals || isLoadingUsers;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <KPICard
            title="Volume Aprovado"
            icon={DollarSign}
            value={`R$ ${totalApproved.toLocaleString('pt-BR')}`}
            subtext="Total de propostas finalizadas"
            isLoading={isLoading}
        />
        <KPICard
            title="Clientes Registrados Hoje"
            icon={Users}
            value={`+${clientsRegisteredToday}`}
            subtext="Novos clientes no dia de hoje"
            isLoading={isLoading}
        />
        <KPICard
            title="Propostas Abertas"
            icon={CreditCard}
            value={`${pendingProposalsCount + inNegotiationCount}`}
            subtext={`${inNegotiationCount} em negociação`}
            isLoading={isLoading}
        />
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
                {isLoadingRecentProposals ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-32"/></TableCell>
                            <TableCell className="hidden xl:table-column"><Skeleton className="h-5 w-24"/></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-20 rounded-full"/></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto"/></TableCell>
                        </TableRow>
                    ))
                ) : recentProposals?.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">Nenhuma proposta recente.</TableCell>
                    </TableRow>
                ) : (
                    recentProposals?.map(proposal => (
                        <TableRow key={proposal.id}>
                        <TableCell>
                            <div className="font-medium">{proposal.clientName}</div>
                            <div className="hidden text-sm text-muted-foreground md:inline">
                                {clients?.find(c => c.name === proposal.clientName)?.email}
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
                    ))
                )}
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
            {isLoading ? (
                <div className="h-[350px] w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full"/>
                </div>
            ) : salesData.length > 0 ? (
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
            ) : (
                <div className="h-[350px] flex flex-col items-center justify-center text-center text-muted-foreground">
                    <p>Nenhuma venda finalizada ainda.</p>
                    <p className="text-xs">O ranking aparecerá aqui quando as vendas forem concluídas.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

    