'use client'

import Link from "next/link"
import { PlusCircle, MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import type { Product } from "@/lib/types"
import { collection, query } from "firebase/firestore"

export default function ProductsPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "products"));
  }, [firestore]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const renderProductRows = () => {
    if (isLoading) {
      return Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-48" /></TableCell>
          <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
        </TableRow>
      ));
    }

    if (!products || products.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-24 text-center">
            Nenhum produto encontrado.
          </TableCell>
        </TableRow>
      );
    }

    return products.map((product) => (
      <TableRow key={product.id} onClick={() => router.push(`/dashboard/products/${product.id}`)} className="cursor-pointer">
        <TableCell className="font-medium">{product.name}</TableCell>
        <TableCell>
          <Badge variant={product.type === 'Consórcio' ? 'secondary' : 'outline'}>
            {product.type}
          </Badge>
        </TableCell>
        <TableCell>
            {`R$ ${product.minAmount.toLocaleString('pt-BR')} - R$ ${product.maxAmount.toLocaleString('pt-BR')}`}
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
              <DropdownMenuItem onSelect={(e) => {e.stopPropagation(); router.push(`/dashboard/products/${product.id}`)}}>Ver Detalhes</DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => e.stopPropagation()}>Editar</DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => e.stopPropagation()} className="text-destructive">Excluir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie os produtos de consórcio e crédito disponíveis.
          </p>
        </div>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Adicionar Produto
          </span>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os produtos cadastrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Faixa de Valor</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderProductRows()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
