import Image from "next/image"
import { PlusCircle, MoreHorizontal } from "lucide-react"

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
import { banks } from "@/lib/placeholder-data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"

export default function BanksPage() {
  return (
    <div className="flex flex-col gap-4">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bancos e Parceiros</h1>
          <p className="text-muted-foreground">
            Gerencie as instituições financeiras parceiras.
          </p>
        </div>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Adicionar Banco
          </span>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Instituições Financeiras</CardTitle>
          <CardDescription>
            Visualize o desempenho e as comissões de cada parceiro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banco</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead className="hidden md:table-cell">Volume Enviado</TableHead>
                <TableHead className="hidden md:table-cell">Volume Aprovado</TableHead>
                <TableHead className="hidden md:table-cell w-[200px]">Taxa de Aprovação</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banks.map((bank) => (
                <TableRow key={bank.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                       <Image
                          alt={bank.name}
                          className="aspect-square rounded-full object-cover"
                          height="32"
                          src={bank.logoUrl}
                          width="32"
                          data-ai-hint="logo"
                        />
                        {bank.name}
                    </div>
                  </TableCell>
                  <TableCell>{bank.commissionRate.toFixed(1)}%</TableCell>
                  <TableCell className="hidden md:table-cell">R$ {bank.sentVolume.toLocaleString('pt-br')}</TableCell>
                  <TableCell className="hidden md:table-cell">R$ {bank.approvedVolume.toLocaleString('pt-br')}</TableCell>
                   <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                            <span>{((bank.approvedVolume / bank.sentVolume) * 100).toFixed(1)}%</span>
                            <Progress value={(bank.approvedVolume / bank.sentVolume) * 100} className="h-2" />
                        </div>
                   </TableCell>
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
                        <DropdownMenuItem>Ver Relatório</DropdownMenuItem>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
