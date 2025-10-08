

'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Edit, Trash2, Landmark, Percent } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useDoc, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase'
import type { Product } from '@/lib/types'
import { doc } from 'firebase/firestore'
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


function ProductDetailSkeleton() {
  return (
    <div className="grid flex-1 auto-rows-max gap-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-7 w-7" />
        <Skeleton className="h-6 w-48" />
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3 lg:gap-8">
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-3 lg:gap-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <Skeleton className="h-20 w-full" />
                <Separator />
                <Skeleton className="h-20 w-full" />
                <Separator />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const firestore = useFirestore()
  const productId = params.id as string
  const { toast } = useToast()
  
  const productRef = useMemoFirebase(() => {
    if (!firestore || !productId) return null
    return doc(firestore, 'products', productId)
  }, [firestore, productId]);

  const { data: product, isLoading, error } = useDoc<Product>(productRef);

  const handleDelete = () => {
    if (!productRef) return;
    deleteDocumentNonBlocking(productRef);
    toast({
      title: "Produto Excluído",
      description: `O produto "${product?.name}" foi removido.`
    })
    router.push('/dashboard/products');
  }

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-[80vh]">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">Produto não encontrado</h3>
          <p className="text-sm text-muted-foreground">
              O produto que você está procurando não existe ou foi excluído.
              {error && <span className="text-destructive block text-xs mt-2">{error.message}</span>}
          </p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/products">Voltar para Produtos</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid flex-1 auto-rows-max gap-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Voltar</span>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          {product.name}
        </h1>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2"/>
                Excluir
              </Button>
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
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Sim, excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button size="sm" asChild>
            <Link href={`/dashboard/products/edit/${product.id}`}>
              <Edit className="h-4 w-4 mr-2"/>
              Editar Produto
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Produto</CardTitle>
            <CardDescription>
              Informações completas sobre o produto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <p className="text-sm font-medium text-muted-foreground">Nome</p>
                  <p className="text-foreground">{product.name}</p>
                </div>
                <div className="grid gap-2">
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Comportamento</p>
                  <p>
                      <Badge variant={'secondary'}>
                          {product.behavior}
                      </Badge>
                  </p>
                </div>
              </div>
               <Separator />
               <div className="grid grid-cols-1 gap-4">
                <div className="grid gap-2">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Landmark className="h-4 w-4"/> Banco / Instituição</p>
                    <p className="text-foreground">{product.bankName || "Não especificado"}</p>
                </div>
               </div>
               <Separator />

              {product.behavior === 'Proposta' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <p className="text-sm font-medium text-muted-foreground">Valor Mínimo</p>
                      <p className="font-mono text-foreground">R$ {product.minAmount?.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="grid gap-2">
                      <p className="text-sm font-medium text-muted-foreground">Valor Máximo</p>
                      <p className="font-mono text-foreground">R$ {product.maxAmount?.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  <Separator />
                   <div className="grid gap-2">
                      <p className="text-sm font-medium text-muted-foreground">Prazos (meses)</p>
                      <p className="text-foreground">{product.terms?.join(', ')}</p>
                    </div>
                   <Separator />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                        <p className="text-sm font-medium text-muted-foreground">Taxa de Juros / Admin.</p>
                        <p className="text-foreground">{product.interestRate}%</p>
                        </div>
                        <div className="grid gap-2">
                        <p className="text-sm font-medium text-muted-foreground">Comissão</p>
                        <p className="text-foreground">{product.commissionRate}%</p>
                        </div>
                        <div className="grid gap-2">
                        <p className="text-sm font-medium text-muted-foreground">Base da Comissão</p>
                        <p className="text-foreground capitalize">{product.commissionBase || 'N/A'}</p>
                        </div>
                    </div>
                </>
              )}
               {(product.behavior === 'Fixo' || product.behavior === 'Variável') && (
                 <div className="grid gap-2">
                      <p className="text-sm font-medium text-muted-foreground">Valor do Produto</p>
                      <p className="font-mono text-foreground">R$ {product.value?.toLocaleString('pt-BR')}</p>
                 </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex items-center justify-start gap-2 md:hidden">
          <Button variant="destructive" size="sm">
            Excluir
          </Button>
          <Button size="sm" asChild>
            <Link href={`/dashboard/products/edit/${product.id}`}>
              Editar
            </Link>
          </Button>
        </div>
    </div>
  )
}
