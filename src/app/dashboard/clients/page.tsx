

'use client'

import Image from "next/image"
import Link from "next/link"
import {
  File,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
  Users,
  Trash2,
  Pencil
} from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, doc } from "firebase/firestore"
import { useRouter } from "next/navigation"

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
import { Skeleton } from "@/components/ui/skeleton"
import type { Client, ClientStatus } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
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


const getStatusVariant = (status: ClientStatus) => {
  switch (status) {
    case 'Aprovado':
      return 'default';
    case 'Reprovado':
      return 'destructive';
    case 'Em análise':
      return 'secondary';
    case 'Pendente':
      return 'outline';
    default:
      return 'secondary';
  }
}

function ClientRowSkeleton() {
  return (
    <TableRow>
      <TableCell className="hidden sm:table-cell">
        <Skeleton className="aspect-square rounded-full h-16 w-16" />
      </TableCell>
      <TableCell className="font-medium">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-40 mt-1 md:hidden" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-20 rounded-full" />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-8" />
      </TableCell>
    </TableRow>
  )
}

export default function ClientsPage() {
  const firestore = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  
  const clientsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "clients"))
  }, [firestore])

  const { data: clients, isLoading } = useCollection<Client>(clientsQuery)

  const handleDeleteClient = (client: Client) => {
    if (!firestore) return;
    const clientRef = doc(firestore, 'clients', client.id);
    deleteDocumentNonBlocking(clientRef);
    toast({
      title: "Cliente excluído!",
      description: `O cliente "${client.name}" foi removido.`,
    });
  }
  
  const filteredClients = (status: ClientStatus | 'all') => {
    if (status === 'all' || !clients) return clients || [];
    return clients.filter(client => client.status.toLowerCase() === status.toLowerCase());
  }

  const renderTableContent = (clientList: Client[]) => {
     if (isLoading) {
      return (
        <>
          <ClientRowSkeleton />
          <ClientRowSkeleton />
          <ClientRowSkeleton />
        </>
      )
    }

    if (clientList.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-24 text-center">
            Nenhum cliente encontrado.
          </TableCell>
        </TableRow>
      )
    }
    
    return clientList.map(client => (
      <TableRow key={client.id} onClick={() => router.push(`/dashboard/clients/${client.id}`)} className="cursor-pointer">
        <TableCell className="hidden sm:table-cell">
          <Image
            alt="Avatar do cliente"
            className="aspect-square rounded-full object-cover"
            height="64"
            src={`https://picsum.photos/seed/${client.id}/100/100`}
            width="64"
            data-ai-hint="person portrait"
          />
        </TableCell>
        <TableCell className="font-medium">
            {client.name}
          <div className="text-sm text-muted-foreground md:hidden">{client.email}</div>
        </TableCell>
        <TableCell>
          <Badge variant={getStatusVariant(client.status)}>{client.status}</Badge>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {/* Placeholder for Sales Rep */}
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {client.createdAt ? new Date(client.createdAt).toLocaleDateString('pt-BR') : '-'}
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-haspopup="true"
                size="icon"
                variant="ghost"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => router.push(`/dashboard/clients/${client.id}`)}>
                <Users className="mr-2 h-4 w-4" /> Ver Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Pencil className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
               <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso irá deletar permanentemente o cliente <strong>{client.name}</strong>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteClient(client)}
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
    ))
  }

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="novo">Novos</TabsTrigger>
          <TabsTrigger value="aprovado">Aprovados</TabsTrigger>
          <TabsTrigger value="pendente" className="hidden sm:flex">
            Pendentes
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
              <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>
                Ativo
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Arquivado</DropdownMenuCheckboxItem>
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
              Adicionar Cliente
            </span>
          </Button>
        </div>
      </div>
       <Card className="mt-4">
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>
              Gerencie seus clientes e visualize seu progresso de vendas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[100px] sm:table-cell">
                    <span className="sr-only">Avatar</span>
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Atendente
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Criado em
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderTableContent(clients || [])}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Mostrando <strong>1-{clients?.length || 0}</strong> de <strong>{clients?.length || 0}</strong>{" "}
              clientes
            </div>
          </CardFooter>
        </Card>
    </Tabs>
  )
}
