
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
  Pencil,
  Search,
  Recycle
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
import type { Client, ClientStatus, WhatsappMessageTemplate } from "@/lib/types"
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
import { collection, doc, query, where, writeBatch, deleteDoc, getDocs, limit } from "firebase/firestore"
import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { sendWhatsappMessage } from "@/lib/whatsapp"


const getStatusVariant = (status: ClientStatus) => {
  switch (status) {
    case 'Aprovado':
      return 'default';
    case 'Reprovado':
    case 'Reciclagem':
      return 'destructive';
    case 'Em análise':
      return 'secondary';
    case 'Pendente':
      return 'outline';
    default:
      return 'secondary';
  }
}

export default function DiscoveryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    // Filter for new clients only
    return query(collection(firestore, 'clients'), where('status', '==', 'Novo'))
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
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: `Não foi possível excluir o cliente "${client.name}".`,
      });
    }
  }

  const handleBulkAction = async (action: 'delete' | 'recycle') => {
    if (!firestore || selectedRows.length === 0) return;

    const batch = writeBatch(firestore);
    const selectedClients = clients?.filter(c => selectedRows.includes(c.id));
    
    if (!selectedClients) return;

    if (action === 'delete') {
        selectedRows.forEach(clientId => {
            const clientRef = doc(firestore, 'clients', clientId);
            batch.delete(clientRef);
        });
    } else if (action === 'recycle') {
        selectedRows.forEach(clientId => {
            const clientRef = doc(firestore, 'clients', clientId);
            batch.update(clientRef, { status: 'Reciclagem' });
        });
    }

    try {
        await batch.commit();
        const noun = selectedRows.length > 1 ? 'clientes' : 'cliente';

        if (action === 'delete') {
            toast({
                title: `${selectedRows.length} ${noun} excluído(s)!`,
                description: `Os ${noun} selecionados foram removidos com sucesso.`,
            });
        } else {
             toast({
                title: `${selectedRows.length} ${noun} movido(s) para reciclagem!`,
            });
            // Send WhatsApp messages after successful batch commit
            const templatesQuery = query(collection(firestore, 'whatsapp_templates'), where('stage', '==', 'Reciclagem'), limit(1));
            const templatesSnap = await getDocs(templatesQuery);
            if (!templatesSnap.empty) {
                const template = templatesSnap.docs[0].data() as WhatsappMessageTemplate;
                for (const client of selectedClients) {
                    await sendWhatsappMessage(template, { clientName: client.name }, client.phone);
                }
            }
        }
        setSelectedRows([]);
    } catch (error) {
        console.error(`Error performing bulk ${action}:`, error);
        toast({
            variant: "destructive",
            title: "Erro ao executar ação",
            description: "Não foi possível completar a operação para os clientes selecionados.",
        });
    }
  }
  
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    if (!searchTerm) return clients;
    return clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const clientList = filteredClients || []

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
  
  const numSelected = selectedRows.length;
  const allSelected = numSelected > 0 && numSelected === clientList.length;
  const someSelected = numSelected > 0 && !allSelected;

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
            Nenhum novo lead encontrado.
          </TableCell>
        </TableRow>
      )
    }
    
    return clientList.map(client => (
      <TableRow key={client.id} data-state={selectedRows.includes(client.id) && "selected"}>
        <TableCell>
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
    <>
      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Pesquisar por nome, email ou telefone..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
            {numSelected > 0 && (
                 <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        {numSelected} selecionado(s)
                    </span>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="outline" size="sm" className="h-8 gap-1">
                                <Recycle className="h-3.5 w-3.5" />
                                Reciclar
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Mover para Reciclagem?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Os {numSelected} clientes selecionados serão movidos para a lista de reciclagem.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleBulkAction('recycle')}>
                                    Sim, mover
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-1 border-destructive text-destructive hover:bg-destructive/10">
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
                                onClick={() => handleBulkAction('delete')}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                Sim, excluir
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
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
            <CardTitle>Discovery: Novos Leads</CardTitle>
            <CardDescription>
              Clientes recém-cadastrados que aguardam o início do processo.
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
              Mostrando <strong>{clientList?.length || 0}</strong> de <strong>{clients?.length || 0}</strong>{" "}
              novos leads
            </div>
          </CardFooter>
        </Card>
    </>
  )
}
