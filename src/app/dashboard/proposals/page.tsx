import {
  File,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import type { ProposalStatus } from "@/lib/types"

const getStatusVariant = (status: ProposalStatus) => {
  switch (status) {
    case 'Finalizada':
      return 'default';
    case 'Cancelada':
      return 'destructive';
    case 'Em negociação':
      return 'secondary';
    case 'Aberta':
      return 'outline';
    default:
      return 'secondary';
  }
}

export default function ProposalsPage() {
  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="aberta">Abertas</TabsTrigger>
          <TabsTrigger value="finalizada">Finalizadas</TabsTrigger>
          <TabsTrigger value="cancelada" className="hidden sm:flex">
            Canceladas
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Filtrar
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>Abertta</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Em negociação</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Finalizada</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Cancelada</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Exportar
            </span>
          </Button>
          <Button size="sm" className="h-8 gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Nova Proposta
            </span>
          </Button>
        </div>
      </div>
      <TabsContent value="all">
        <Card>
          <CardHeader>
            <CardTitle>Propostas</CardTitle>
            <CardDescription>
              Gerencie todas as propostas de vendas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Produto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Atendente</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map(proposal => (
                <TableRow key={proposal.id}>
                  <TableCell className="font-medium">{proposal.clientName}</TableCell>
                  <TableCell className="hidden md:table-cell">{proposal.productName}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(proposal.status)}>{proposal.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{proposal.salesRepName}</TableCell>
                  <TableCell className="text-right">R$ {proposal.value.toLocaleString('pt-br')}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Enviar por WhatsApp</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Mostrando <strong>1-10</strong> de <strong>{proposals.length}</strong> propostas
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
