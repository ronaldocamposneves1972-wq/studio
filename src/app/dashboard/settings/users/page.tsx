
'use client'

import { useState, useEffect } from "react"
import { useForm, Controller } from 'react-hook-form'
import {
  ChevronsUpDown,
  Check,
  Save,
  Loader2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, doc, updateDoc } from 'firebase/firestore'
import type { User } from '@/lib/types'
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

const collections = [
  'clients',
  'products',
  'sales_proposals',
  'transactions',
  'users',
  'suppliers',
  'cost_centers',
  'expense_categories',
  'quizzes',
  'financial_institutions',
  'commissions'
] as const;

type CollectionKey = typeof collections[number];

type Permissions = Record<CollectionKey, {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}>

const defaultPermissions: Permissions = collections.reduce((acc, key) => {
  acc[key] = { create: false, read: false, update: false, delete: false };
  return acc;
}, {} as Permissions);


export default function UsersAndPermissionsPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const firestore = useFirestore()
  const { toast } = useToast()

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, 'users'))
  }, [firestore])
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery)

  const { control, reset, handleSubmit } = useForm({
    defaultValues: defaultPermissions
  });

  const selectedUser = users?.find(u => u.id === selectedUserId)

  useEffect(() => {
    if (selectedUser) {
      // Deep merge default permissions with user's permissions
      const userPermissions = JSON.parse(JSON.stringify(defaultPermissions));
      if (selectedUser.permissions) {
        for (const collectionKey of collections) {
          if (selectedUser.permissions[collectionKey]) {
            Object.assign(userPermissions[collectionKey], selectedUser.permissions[collectionKey]);
          }
        }
      }
      reset(userPermissions);
    } else {
      reset(defaultPermissions);
    }
  }, [selectedUserId, selectedUser, reset]);

  const onSubmit = async (data: Permissions) => {
    if (!selectedUserId || !firestore) return;
    setIsSubmitting(true);
    
    const userDocRef = doc(firestore, 'users', selectedUserId);
    
    try {
      await updateDoc(userDocRef, { permissions: data });
      toast({
        title: "Permissões salvas!",
        description: `As permissões para ${selectedUser?.name} foram atualizadas.`,
      })
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível atualizar as permissões.",
      })
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Usuários e Permissões</CardTitle>
          <CardDescription>
            Selecione um usuário para visualizar e editar suas permissões de acesso no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <label className="font-medium">Usuário:</label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-[300px] justify-between"
                  disabled={isLoadingUsers}
                >
                  {isLoadingUsers ? <Skeleton className="h-5 w-40" /> : (
                    selectedUserId
                      ? users?.find((user) => user.id === selectedUserId)?.name
                      : "Selecione um usuário..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Pesquisar usuário..." />
                  <CommandList>
                    <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                    <CommandGroup>
                      {users?.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.name}
                          onSelect={() => {
                            setSelectedUserId(user.id)
                            setPopoverOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedUserId === user.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {user.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selectedUserId ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo / Coleção</TableHead>
                    <TableHead className="text-center">Criar</TableHead>
                    <TableHead className="text-center">Ler</TableHead>
                    <TableHead className="text-center">Atualizar</TableHead>
                    <TableHead className="text-center">Excluir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.map(collection => (
                    <TableRow key={collection}>
                      <TableCell className="font-medium capitalize">{collection.replace(/_/g, ' ')}</TableCell>
                      {['create', 'read', 'update', 'delete'].map(action => (
                        <TableCell key={action} className="text-center">
                          <Controller
                            name={`${collection}.${action}` as any}
                            control={control}
                            render={({ field }) => (
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isSubmitting}
                              />
                            )}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center text-center gap-4 min-h-60 rounded-lg border-2 border-dashed p-6">
                <p className="text-muted-foreground">Selecione um usuário para configurar as permissões.</p>
            </div>
          )}
        </CardContent>
        {selectedUserId && (
          <CardFooter className="border-t px-6 py-4 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
               {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Save className="mr-2 h-4 w-4" />
                )}
              {isSubmitting ? "Salvando..." : "Salvar Permissões"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </form>
  )
}
