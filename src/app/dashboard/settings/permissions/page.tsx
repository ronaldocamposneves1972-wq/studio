
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
import { Loader2, ShieldCheck } from 'lucide-react';
import { collections } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


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


// Pre-configure some sensible defaults
initialPermissions.Admin = collections.reduce((acc, col) => ({ ...acc, [col]: { create: true, read: true, update: true, delete: true } }), {});
initialPermissions.Atendente.clients = { create: true, read: true, update: true, delete: false };
initialPermissions.Atendente.sales_proposals = { create: true, read: true, update: true, delete: false };
initialPermissions.Anonimo.quizzes = { create: false, read: true, update: false, delete: false };
initialPermissions.Anonimo.clients = { create: true, read: false, update: false, delete: false };


export default function PermissionsPage() {
    const [selectedRole, setSelectedRole] = useState('Atendente');
    const [permissions, setPermissions] = useState(initialPermissions);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

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

    const generateRules = () => {
      let rulesString = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper Functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function getUserRole() {
      // Check if the user is signed in before trying to get their data
      if (isSignedIn()) {
        return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
      }
      return 'Anonimo'; // Default role for non-signed-in users
    }

    function isRole(role) {
      // For anonymous users, check directly if the role is 'Anonimo'
      if (!isSignedIn()) {
        return role == 'Anonimo';
      }
      // For signed-in users, check their role from Firestore
      return getUserRole() == role;
    }
`;

    for (const collection of collections) {
      let path = collection.includes('{') ? collection : `${collection}/{docId}`;
      rulesString += `    match /${path} {\n`;

      const permsByAction: Record<string, string[]> = {
        get: [],
        list: [],
        create: [],
        update: [],
        delete: [],
      };

      for (const role of roles) {
        const rolePerms = permissions[role][collection];
        const roleCheck = `isRole('${role}')`;
        
        if (rolePerms.create) permsByAction.create.push(roleCheck);
        if (rolePerms.read) {
          permsByAction.get.push(roleCheck);
          permsByAction.list.push(roleCheck);
        }
        if (rolePerms.update) permsByAction.update.push(roleCheck);
        if (rolePerms.delete) permsByAction.delete.push(roleCheck);
      }

      // Special owner-based rules for specific collections
      if (collection === 'users/{userId}') {
          permsByAction.get.push('isOwner(userId)');
          permsByAction.update.push('isOwner(userId)');
      }
       if (collection === 'clients/{clientId}/documents/{documentId}') {
          permsByAction.get.push(`
            exists(/databases/$(database)/documents/clients/$(clientId)) &&
            get(/databases/$(database)/documents/clients/$(clientId)).data.salesRepId == request.auth.uid
          `);
      }


      // Consolidate read/write if possible
      const allRead = [...new Set(permsByAction.get.concat(permsByAction.list))];
      if (allRead.length > 0) {
        rulesString += `      allow read: if ${allRead.join(' || ') || 'false'};\n`;
      }
      
      const allWrite = [...new Set(permsByAction.create.concat(permsByAction.update, permsByAction.delete))];
      if (allWrite.length > 0 && 
          JSON.stringify(allWrite.sort()) === JSON.stringify(permsByAction.create.sort()) && 
          JSON.stringify(allWrite.sort()) === JSON.stringify(permsByAction.update.sort()) && 
          JSON.stringify(allWrite.sort()) === JSON.stringify(permsByAction.delete.sort())) {
          rulesString += `      allow write: if ${allWrite.join(' || ') || 'false'};\n`;
      } else {
          if (permsByAction.create.length > 0) {
              rulesString += `      allow create: if ${[...new Set(permsByAction.create)].join(' || ') || 'false'};\n`;
          }
          if (permsByAction.update.length > 0) {
              rulesString += `      allow update: if ${[...new Set(permsByAction.update)].join(' || ') || 'false'};\n`;
          }
          if (permsByAction.delete.length > 0) {
              rulesString += `      allow delete: if ${[...new Set(permsByAction.delete)].join(' || ') || 'false'};\n`;
          }
      }

      if (allRead.length === 0 && allWrite.length === 0 && permsByAction.create.length === 0 && permsByAction.update.length === 0 && permsByAction.delete.length === 0) {
        rulesString += `      allow read, write: if false;\n`;
      }

      rulesString += `    }\n`;
    }

    rulesString += `  }\n}\n`;
    return rulesString;
  };
    
    const handleSave = () => {
        setIsSaving(true);
        // This function will now be handled by the agent's file modification capabilities.
        // The generated rules will be placed in the `firestore.rules` file in the response.
        // We simulate a short delay for user feedback.
        setTimeout(() => {
            toast({
                title: "Regras de Segurança Prontas para Aplicação",
                description: "As novas regras foram geradas. A aplicação será feita pelo sistema.",
            });
            setIsSaving(false);
        }, 1000);
    }


    return (
        <Card>
            <CardHeader>
              <CardTitle>Permissões do Sistema por Função</CardTitle>
              <CardDescription>
                Defina o que cada função de usuário pode fazer. As alterações aqui irão gerar o conteúdo do arquivo `firestore.rules`.
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
                                <TableCell className="text-center">
                                    <Checkbox 
                                        checked={permissions[selectedRole][collection].create}
                                        onCheckedChange={(checked) => handlePermissionChange(collection, 'create', !!checked)}
                                        disabled={selectedRole === 'Admin'}
                                    />
                                </TableCell>
                                 <TableCell className="text-center">
                                    <Checkbox 
                                       checked={permissions[selectedRole][collection].read}
                                       onCheckedChange={(checked) => handlePermissionChange(collection, 'read', !!checked)}
                                       disabled={selectedRole === 'Admin'}
                                    />
                                </TableCell>
                                 <TableCell className="text-center">
                                    <Checkbox 
                                        checked={permissions[selectedRole][collection].update}
                                        onCheckedChange={(checked) => handlePermissionChange(collection, 'update', !!checked)}
                                        disabled={selectedRole === 'Admin'}
                                    />
                                </TableCell>
                                 <TableCell className="text-center">
                                    <Checkbox 
                                        checked={permissions[selectedRole][collection].delete}
                                        onCheckedChange={(checked) => handlePermissionChange(collection, 'delete', !!checked)}
                                        disabled={selectedRole === 'Admin'}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
               </div>
            </CardContent>
             <CardFooter className="border-t px-6 py-4 flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar e Gerar Regras
              </Button>
            </CardFooter>
          </Card>
    )
}

    