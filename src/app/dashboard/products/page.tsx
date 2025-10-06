import Image from "next/image"
import Link from "next/link"
import { PlusCircle } from "lucide-react"

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
import { products } from "@/lib/placeholder-data"

export default function ProductsPage() {
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
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <Link href={`/dashboard/products/${product.id}`} key={product.id} className="group">
            <Card className="h-full transition-all group-hover:shadow-md group-hover:-translate-y-1">
              <CardHeader className="p-0 relative">
                <Image
                  alt={product.name}
                  className="aspect-video w-full rounded-t-lg object-cover"
                  height="300"
                  src={product.imageUrl}
                  width="400"
                  data-ai-hint={product.type === 'Consórcio' ? 'house' : 'money'}
                />
              </CardHeader>
              <CardContent className="p-4">
                <Badge variant={product.type === 'Consórcio' ? "secondary" : "outline"} className="mb-2">{product.type}</Badge>
                <CardTitle className="text-lg group-hover:text-primary">{product.name}</CardTitle>
                <CardDescription className="text-sm">
                  A partir de R$ {product.minAmount.toLocaleString('pt-br')}
                </CardDescription>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                 <div className="text-xs text-muted-foreground">
                  Prazos: {product.terms.join(', ')} meses
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
