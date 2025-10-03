import Image from "next/image"
import { PlusCircle, MoreVertical } from "lucide-react"

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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
          <Card key={product.id}>
            <CardHeader className="p-0 relative">
              <Image
                alt={product.name}
                className="aspect-video w-full rounded-t-lg object-cover"
                height="300"
                src={product.imageUrl}
                width="400"
                data-ai-hint={product.type === 'Consórcio' ? 'house' : 'money'}
              />
              <div className="absolute top-2 right-2">
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Mais</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuItem>Desativar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <Badge variant={product.type === 'Consórcio' ? "secondary" : "outline"} className="mb-2">{product.type}</Badge>
              <CardTitle className="text-lg">{product.name}</CardTitle>
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
        ))}
      </div>
    </div>
  )
}
