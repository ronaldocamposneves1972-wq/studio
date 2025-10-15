
'use client'

import { useMemo, useState } from "react"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query } from "firebase/firestore"
import type { Proposal, SalesOrder } from "@/lib/types"
import { DateRange } from "react-day-picker"
import { addDays, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, DollarSign, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"

export default function SalesReportPage() {
  const firestore = useFirestore()
  
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  })

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, 'sales_proposals'))
  }, [firestore])
  
  const salesOrdersQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, 'sales_orders'))
  }, [firestore])

  const { data: proposals, isLoading: isLoadingProposals } = useCollection<Proposal>(proposalsQuery);
  const { data: salesOrders, isLoading: isLoadingSalesOrders } = useCollection<SalesOrder>(salesOrdersQuery);
  
  const isLoading = isLoadingProposals || isLoadingSalesOrders;

  const filteredData = useMemo(() => {
    if (!proposals || !salesOrders) {
      return { proposalVolume: 0, salesOrderVolume: 0 };
    }

    const fromDate = date?.from;
    const toDate = date?.to;

    const filterByDate = (items: any[]) => {
      if (!fromDate || !toDate) return items;
      return items.filter(item => {
        const itemDate = parseISO(item.createdAt);
        return itemDate >= fromDate && itemDate <= toDate;
      });
    };

    const filteredProposals = filterByDate(proposals);
    const filteredSalesOrders = filterByDate(salesOrders);
    
    const proposalVolume = filteredProposals.reduce((sum, p) => sum + p.value, 0);
    const salesOrderVolume = filteredSalesOrders.reduce((sum, so) => sum + so.totalValue, 0);

    return { proposalVolume, salesOrderVolume };

  }, [proposals, salesOrders, date]);


  return (
    <div className="flex flex-col gap-4">
       <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatório de Vendas</h1>
          <p className="text-muted-foreground">
            Acompanhe o volume de propostas e pedidos de venda por período.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                    date.to ? (
                        <>
                        {format(date.from, "LLL dd, y", { locale: ptBR })} -{" "}
                        {format(date.to, "LLL dd, y", { locale: ptBR })}
                        </>
                    ) : (
                        format(date.from, "LLL dd, y", { locale: ptBR })
                    )
                    ) : (
                    <span>Selecione um período</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                />
                </PopoverContent>
            </Popover>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Volume de Crédito (Propostas)</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <Skeleton className="h-8 w-3/4" />
                 ) : (
                    <div className="text-2xl font-bold">R$ {filteredData.proposalVolume.toLocaleString('pt-br', {minimumFractionDigits: 2})}</div>
                 )}
                <p className="text-xs text-muted-foreground">Soma do valor principal de todas as propostas no período.</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor de Pedidos de Venda</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <Skeleton className="h-8 w-3/4" />
                 ) : (
                    <div className="text-2xl font-bold">R$ {filteredData.salesOrderVolume.toLocaleString('pt-br', {minimumFractionDigits: 2})}</div>
                 )}
                <p className="text-xs text-muted-foreground">Soma do valor total de todos os pedidos de venda no período.</p>
            </CardContent>
        </Card>
      </div>
       {/* Placeholder for future tables or charts */}
       <Card>
          <CardHeader>
            <CardTitle>Detalhes</CardTitle>
             <CardDescription>
                Em breve: tabelas detalhadas das propostas e pedidos de venda no período selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
             (Visualização de dados detalhados)
          </CardContent>
       </Card>
    </div>
  )
}
