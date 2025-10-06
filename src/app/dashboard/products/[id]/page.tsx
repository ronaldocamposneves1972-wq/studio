
'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { products } from '@/lib/placeholder-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Edit, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  
  const product = products.find(p => p.id === productId)

  if (!product) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-[80vh]">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">Produto não encontrado</h3>
          <p className="text-sm text-muted-foreground">O produto que você está procurando não existe.</p>
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
          <Button variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2"/>
            Excluir
          </Button>
          <Button size="sm">
            <Edit className="h-4 w-4 mr-2"/>
            Editar Produto
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
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
                    <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                    <p>
                        <Badge variant={product.type === 'Consórcio' ? 'secondary' : 'outline'}>
                            {product.type}
                        </Badge>
                    </p>
                  </div>
                </div>
                 <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <p className="text-sm font-medium text-muted-foreground">Valor Mínimo</p>
                    <p className="font-mono text-foreground">R$ {product.minAmount.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="grid gap-2">
                    <p className="text-sm font-medium text-muted-foreground">Valor Máximo</p>
                    <p className="font-mono text-foreground">R$ {product.maxAmount.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                 <Separator />
                 <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <p className="text-sm font-medium text-muted-foreground">Taxa de Juros / Admin.</p>
                    <p className="text-foreground">{product.interestRate}% {product.type === 'Crédito' ? 'a.m.' : 'a.p.'}</p>
                  </div>
                  <div className="grid gap-2">
                    <p className="text-sm font-medium text-muted-foreground">Prazos (meses)</p>
                    <p className="text-foreground">{product.terms.join(', ')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Imagem do Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <Image
                alt={product.name}
                className="aspect-square w-full rounded-md object-cover"
                height="300"
                src={product.imageUrl}
                width="300"
                data-ai-hint={product.type === 'Consórcio' ? 'house' : 'money'}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
