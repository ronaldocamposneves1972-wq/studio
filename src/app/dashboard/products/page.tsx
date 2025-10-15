

'use client'

import Link from "next/link"
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react"
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
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import type { Product } from "@/lib/types"
import { collection, query, doc, deleteDoc } from "firebase/firestore"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"


export default function ProductsPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "products"));
  }, [firestore]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const handleDelete = async (product: Product) => {
    if(!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'products', product.id));
      toast({
        title: "Produto Excluído",
        description: `O produto "${product.name}" foi removido.`
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao Excluir",
        description: "Não foi possível remover o produto."
      });
    }
  }

  const renderProductRows = () => {
    if (isLoading) {
      return Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-48" /></TableCell>
          <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
        </TableRow>
      ));
    }

    if (!products || products.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-24 text-center">
            Nenhum produto encontrado.
          </TableCell>
        </TableRow>
      );
    }

    return products.map((product) => (
      <TableRow key={product.id}>
        <TableCell className="font-medium cursor-pointer" onClick={() => router.push(`/dashboard/products/${product.id}`)}>{product.name}</TableCell>
        <TableCell>
          <Badge variant="secondary">
            {product.behavior}
          </Badge>
        </TableCell>
        <TableCell className="cursor-pointer" onClick={() => router.push(`/dashboard/products/${product.id}`)}>
            {product.bankName || 'N/A'}
        </TableCell>
        <TableCell className="cursor-pointer" onClick={() => router.push(`/dashboard/products/${product.id}`)}>
            {product.behavior === 'Proposta'
              ? `R$ ${product.minAmount?.toLocaleString('pt-BR')} - R$ ${product.maxAmount?.toLocaleString('pt-BR')}`
              : `R$ ${product.value?.toLocaleString('pt-BR')}`
            }
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => router.push(`/dashboard/products/${product.id}`)}>Ver Detalhes</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push(`/dashboard/products/edit/${product.id}`)}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. O produto <strong>{product.name}</strong> será excluído permanentemente.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => handleDelete(product)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Sim, excluir
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
        <Button size="sm" className="h-8 gap-1" asChild>
          <Link href="/dashboard/products/new">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Adicionar Produto
            </span>
          </Link>
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
                <TableHead>Comportamento</TableHead>
                <TableHead>Banco</TableHead>
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

    