
'use client'

import { useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldCheck } from 'lucide-react';
import { collections } from '@/lib/types';


const roles = ['Admin', 'Gestor', 'Atendente', 'Financeiro', 'Anonimo'];

const initialPermissions = roles.reduce((acc, role) => {
  acc[role] = collections.reduce((colAcc, collection) => {
    colAcc[collection] = {
      create: false,
      read: false,
      update: false,
      delete: false,
    };
    return colAcc;
  }, {} as Record<string, { create: boolean, read: boolean, update: boolean, delete: boolean }>);
  return acc;
}, {} as Record<string, any>);


export default function PermissionsPage() {
    const [selectedRole, setSelectedRole] = useState('Atendente');
    const [permissions, setPermissions] = useState(initialPermissions);

    const handlePermissionChange = (collection: string, action: 'create' | 'read' | 'update' | 'delete', value: boolean) => {
        setPermissions(prev => ({
            ...prev,
            [selectedRole]: {
                ...prev[selectedRole],
                [collection]: {
                    ...prev[selectedRole][collection],
                    [action]: value
                }
            }
        }))
    }

    return (
        <Card>
            <CardHeader>
              <CardTitle>Permissões do Sistema</CardTitle>
              <CardDescription>
                Defina o que cada função de usuário pode fazer dentro do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    <label className="font-medium">Selecionar Função:</label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Selecione uma função" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map(role => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertTitle>Visualização de Permissões</AlertTitle>
                  <AlertDescription>
                    Esta tela é uma representação visual das suas regras de segurança do Firestore. As alterações aqui não são salvas automaticamente. A edição e deploy das regras de segurança ainda precisam ser feitas diretamente no arquivo `firestore.rules`.
                  </AlertDescription>
                </Alert>

               <div className="border rounded-lg overflow-hidden">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Coleção</TableHead>
                            <TableHead className="text-center">Criar (Create)</TableHead>
                            <TableHead className="text-center">Ler (Read)</TableHead>
                            <TableHead className="text-center">Atualizar (Update)</TableHead>
                            <TableHead className="text-center">Excluir (Delete)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {collections.map(collection => (
                            <TableRow key={collection}>
                                <TableCell className="font-medium capitalize">{collection.replace(/_/g, ' ')}</TableCell>
                                <TableCell className="text-center">
                                    <Checkbox 
                                        checked={permissions[selectedRole][collection].create}
                                        onCheckedChange={(checked) => handlePermissionChange(collection, 'create', !!checked)}
                                    />
                                </TableCell>
                                 <TableCell className="text-center">
                                    <Checkbox 
                                       checked={permissions[selectedRole][collection].read}
                                       onCheckedChange={(checked) => handlePermissionChange(collection, 'read', !!checked)}
                                    />
                                </TableCell>
                                 <TableCell className="text-center">
                                    <Checkbox 
                                        checked={permissions[selectedRole][collection].update}
                                        onCheckedChange={(checked) => handlePermissionChange(collection, 'update', !!checked)}
                                    />
                                </TableCell>
                                 <TableCell className="text-center">
                                    <Checkbox 
                                        checked={permissions[selectedRole][collection].delete}
                                        onCheckedChange={(checked) => handlePermissionChange(collection, 'delete', !!checked)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
               </div>
            </CardContent>
             <CardFooter className="border-t px-6 py-4 flex justify-end">
              <Button disabled>Salvar Permissões (em breve)</Button>
            </CardFooter>
          </Card>
    )
}
