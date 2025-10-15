
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
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, doc, query, writeBatch, deleteDoc } from "firebase/firestore"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"


const getStatusVariant = (status: ClientStatus) => {
  switch (status) {
    case 'Aprovado':
    case 'Ledger':
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

export default function ClientsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const firestore = useFirestore()
  const [activeTab, setActiveTab] = useState('all')
  const [selectedRows, setSelectedRows] = useState<string[]>([])

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, 'clients'))
  }, [firestore])
  
  const { data: clients, isLoading } = useCollection<Client>(clientsQuery)
  
  const handleDeleteClient = async (client: Client) => {
    if(!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'clients', client.id));
      toast({
        title: "Cliente excluído!",
        description: `O cliente "${client.name}" foi removido com sucesso.`,
      });
      setSelectedRows(prev => prev.filter(id => id !== client.id));
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: `Não foi possível excluir o cliente "${client.name}".`,
      });
    }
  }

  const handleDeleteSelected = async () => {
    if (!firestore || selectedRows.length === 0) return;

    const batch = writeBatch(firestore);
    selectedRows.forEach(clientId => {
        const clientRef = doc(firestore, 'clients', clientId);
        batch.delete(clientRef);
    });

    try {
        await batch.commit();
        toast({
            title: `${selectedRows.length} cliente(s) excluído(s)!`,
            description: "Os clientes selecionados foram removidos com sucesso.",
        });
        setSelectedRows([]);
    } catch (error) {
        console.error("Error deleting multiple clients:", error);
        toast({
            variant: "destructive",
            title: "Erro ao excluir",
            description: "Não foi possível excluir os clientes selecionados.",
        });
    }
  }
  
  const filteredClients = (status: ClientStatus | 'all') => {
    if (status === 'all' || !clients) return clients || [];
    return clients.filter(client => client.status.toLowerCase() === status.toLowerCase());
  }
  
  const clientList = filteredClients(activeTab as any)

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedRows(clientList.map(client => client.id));
    } else {
      setSelectedRows([]);
    }
  }
  
  const handleSelectRow = (clientId: string, checked: boolean) => {
    if (checked) {
        setSelectedRows(prev => [...prev, clientId]);
    } else {
        setSelectedRows(prev => prev.filter(id => id !== clientId));
    }
  }


  const renderTableContent = (clientList: Client[]) => {
    if (isLoading) {
       return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-5"/></TableCell>
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
          <TableCell colSpan={7} className="h-24 text-center">
            Nenhum cliente encontrado.
          </TableCell>
        </TableRow>
      )
    }
    
    return clientList.map(client => (
      <TableRow 
        key={client.id} 
        data-state={selectedRows.includes(client.id) && "selected"}
      >
        <TableCell className="p-2">
            <Checkbox
                checked={selectedRows.includes(client.id)}
                onCheckedChange={(checked) => handleSelectRow(client.id, !!checked)}
                aria-label={`Selecionar cliente ${client.name}`}
            />
        </TableCell>
        <TableCell className="font-medium cursor-pointer" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
          <div className="flex items-center gap-3">
             {client.avatarUrl ? <Image src={client.avatarUrl} alt={client.name} width={24} height={24} className="rounded-full" data-ai-hint="person portrait" /> : <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">{client.name.charAt(0)}</div>}
             {client.name}
          </div>
        </TableCell>
        <TableCell className="hidden sm:table-cell cursor-pointer" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>{client.email}</TableCell>
        <TableCell className="hidden md:table-cell cursor-pointer" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>{client.phone}</TableCell>
        <TableCell className="cursor-pointer" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
          <Badge variant={getStatusVariant(client.status)}>{client.status}</Badge>
        </TableCell>
        <TableCell className="hidden md:table-cell cursor-pointer" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
          {client.createdAt ? new Date(client.createdAt).toLocaleDateString('pt-BR') : '-'}
        </TableCell>
        <TableCell>
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
  
    const numSelected = selectedRows.length;
    const allSelected = numSelected > 0 && numSelected === clientList.length;
    const someSelected = numSelected > 0 && !allSelected;

  return (
    <Tabs defaultValue="all" onValueChange={setActiveTab}>
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
           {numSelected > 0 && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        {numSelected} selecionado(s)
                    </span>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-1">
                                <Trash2 className="h-3.5 w-3.5" />
                                Excluir
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Excluir clientes selecionados?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. {numSelected} cliente(s) serão permanentemente excluídos.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                onClick={handleDeleteSelected}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                Sim, excluir
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
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
          <Button size="sm" className="h-8 gap-1" asChild>
            <Link href="/cadastro">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Adicionar Cliente
              </span>
            </Link>
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
                  <TableHead className="w-12">
                     <Checkbox
                        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                        onCheckedChange={handleSelectAll}
                        aria-label="Selecionar todos"
                      />
                  </TableHead>
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
              Mostrando <strong>1-{clientList?.length || 0}</strong> de <strong>{clients?.length || 0}</strong>{" "}
              clientes
            </div>
          </CardFooter>
        </Card>
    </Tabs>
  )
}

    