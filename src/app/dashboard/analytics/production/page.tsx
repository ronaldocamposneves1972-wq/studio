
'use client'

import { useMemo } from "react"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import type { Proposal } from "@/lib/types"
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

export default function AnalyticsProductionPage() {
    const firestore = useFirestore()

    const finalizedProposalsQuery = useMemoFirebase(() => {
        if (!firestore) return null
        return query(
            collection(firestore, 'sales_proposals'), 
            where('status', '==', 'Finalizada'),
            orderBy('approvedAt', 'asc')
        )
    }, [firestore])

    const { data: proposals, isLoading } = useCollection<Proposal>(finalizedProposalsQuery)

    const chartData = useMemo(() => {
        if (!proposals) return [];
        
        const proposalsByDate = proposals.reduce((acc, proposal) => {
            if (proposal.approvedAt) {
                const date = format(parseISO(proposal.approvedAt), 'dd/MM/yyyy');
                if (!acc[date]) {
                    acc[date] = { date, count: 0 };
                }
                acc[date].count++;
            }
            return acc;
        }, {} as Record<string, { date: string, count: number }>);

        return Object.values(proposalsByDate);
    }, [proposals]);

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Analítico de Produção</h1>
            <p className="text-muted-foreground">Visualize a produção de contratos finalizados por data.</p>
            
            <Card>
                <CardHeader>
                    <CardTitle>Propostas Finalizadas por Dia</CardTitle>
                    <CardDescription>
                        Este gráfico mostra o número de contratos que foram finalizados a cada dia.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Skeleton className="h-[350px] w-full" />
                    ) : chartData.length > 0 ? (
                        <ChartContainer config={{
                            proposals: {
                                label: "Propostas",
                                color: "hsl(var(--primary))",
                            },
                        }} className="h-[350px] w-full">
                            <ResponsiveContainer>
                                <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        fontSize={12}
                                    />
                                    <YAxis 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tickMargin={8} 
                                        fontSize={12}
                                        allowDecimals={false}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent 
                                            labelFormatter={(value) => format(parseISO(value), "PPP", { locale: ptBR })}
                                            indicator="dot" 
                                        />}
                                    />
                                    <Bar dataKey="count" fill="var(--color-proposals)" radius={4} name="Propostas Finalizadas" />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    ) : (
                         <div className="h-[350px] flex flex-col items-center justify-center text-center text-muted-foreground">
                            <p>Nenhuma proposta finalizada encontrada para exibir no gráfico.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
