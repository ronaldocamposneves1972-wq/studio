
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
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase"
import { collection, doc, query, where } from "firebase/firestore"

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

export default function ValorPage() {
  const router = useRouter()
  const { toast } = useToast()
  const firestore = useFirestore()

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, 'clients'), where('status', '==', 'Pendente'))
  }, [firestore])
  
  const { data: clients, isLoading } = useCollection<Client>(clientsQuery)
  
  const handleDeleteClient = (client: Client) => {
    if(!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'clients', client.id));
    toast({
      title: "Cliente excluído!",
      description: `O cliente "${client.name}" foi removido com sucesso.`,
    });
  }
  
  const clientList = clients || []

  const renderTableContent = (clientList: Client[]) => {
    if (isLoading) {
       return Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-32"/></TableCell>
          <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-40"/></TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-28"/></TableCell>
          <TableCell><Skeleton className="h-6 w-20 rounded-full"/></TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24"/></TableCell>
          <TableCell><Skeleton className="h-8 w-8"/></TableCell>
        </TableRow>
      ))
    }

    if (clientList.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-24 text-center">
            Nenhum cliente aguardando análise de propostas.
          </TableCell>
        </TableRow>
      )
    }
    
    return clientList.map(client => (
      <TableRow key={client.id} onClick={() => router.push(`/dashboard/clients/${client.id}`)} className="cursor-pointer">
        <TableCell className="font-medium">
          <div className="flex items-center gap-3">
             {client.avatarUrl ? <Image src={client.avatarUrl} alt={client.name} width={24} height={24} className="rounded-full" data-ai-hint="person portrait" /> : <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">{client.name.charAt(0)}</div>}
             {client.name}
          </div>
        </TableCell>
        <TableCell className="hidden sm:table-cell">{client.email}</TableCell>
        <TableCell className="hidden md:table-cell">{client.phone}</TableCell>
        <TableCell>
          <Badge variant={getStatusVariant(client.status)}>{client.status}</Badge>
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
                <Pencil className="mr-2 h-4 w-4" /> Gerar Proposta
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
    <>
       <Card className="mt-4">
          <CardHeader>
            <CardTitle>Etapa de Valor</CardTitle>
            <CardDescription>
             Clientes com documentação validada aguardando análise para geração de propostas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Criado em
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderTableContent(clientList)}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Mostrando <strong>{clientList?.length || 0}</strong> clientes na etapa de Valor.
            </div>
          </CardFooter>
        </Card>
    </>
  )
}
