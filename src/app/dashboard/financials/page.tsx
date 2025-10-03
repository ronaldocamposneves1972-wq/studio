import { DollarSign, File, ListFilter } from "lucide-react"

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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { proposals } from "@/lib/placeholder-data"

const commissions = proposals
  .filter(p => p.status === 'Finalizada')
  .map(p => ({
    ...p,
    commission: p.value * 0.025, // Assume 2.5% commission
    paymentStatus: Math.random() > 0.5 ? 'Paga' : 'A Pagar',
  }))

const totalPaid = commissions.filter(c => c.paymentStatus === 'Paga').reduce((sum, c) => sum + c.commission, 0);
const totalPayable = commissions.filter(c => c.paymentStatus === 'A Pagar').reduce((sum, c) => sum + c.commission, 0);


export default function FinancialsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Acompanhe as comissões e o desempenho financeiro.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido (Mês)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalPaid.toLocaleString('pt-br')}</div>
            <p className="text-xs text-muted-foreground">+5.2% vs. mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões a Pagar</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalPayable.toLocaleString('pt-br')}</div>
            <p className="text-xs text-muted-foreground">Vencimento próximo: R$ {(totalPayable*0.3).toLocaleString('pt-br')}</p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="paid">Pagas</TabsTrigger>
            <TabsTrigger value="payable">A Pagar</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Exportar</span>
            </Button>
          </div>
        </div>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Extrato de Comissões</CardTitle>
              <CardDescription>
                Detalhes de todas as comissões geradas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venda (ID)</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Atendente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.id.toUpperCase()}</TableCell>
                      <TableCell>{c.clientName}</TableCell>
                      <TableCell className="hidden md:table-cell">{c.salesRepName}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.paymentStatus === 'Paga' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                          {c.paymentStatus}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">R$ {c.commission.toLocaleString('pt-br')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
