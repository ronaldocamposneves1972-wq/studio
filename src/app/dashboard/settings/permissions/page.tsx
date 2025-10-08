
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

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isRole(role) {
        return isSignedIn() && getUserData().role == role;
    }

`;

    for (const collection of collections) {
      rulesString += `    match /${collection}/{docId} {\n`;

      const permsByAction: Record<string, string[]> = {
        read: [],
        list: [],
        create: [],
        update: [],
        delete: [],
      };

      for (const role of roles) {
        const rolePerms = permissions[role][collection];
        const roleCheck = `isRole('${role}')`;
        const anonCheck = `!isSignedIn()`;
        
        if (rolePerms.create) permsByAction.create.push(role === 'Anonimo' ? anonCheck : roleCheck);
        if (rolePerms.read) {
            permsByAction.read.push(role === 'Anonimo' ? anonCheck : roleCheck);
            permsByAction.list.push(role === 'Anonimo' ? anonCheck : roleCheck);
        }
        if (rolePerms.update) permsByAction.update.push(role === 'Anonimo' ? anonCheck : roleCheck);
        if (rolePerms.delete) permsByAction.delete.push(role === 'Anonimo' ? anonCheck : roleCheck);
      }

      // Special owner-based rules
      if (collection === 'users') {
        permsByAction.read.push('isOwner(docId)');
        permsByAction.update.push('isOwner(docId)');
      }

      const writeActions = ['create', 'update', 'delete'];
      let combinedWriteRoles = new Set<string>();
      
      const createRoles = permsByAction.create;
      const updateRoles = permsByAction.update;
      const deleteRoles = permsByAction.delete;

      // Check if all write actions have the same roles
      const allSame = writeActions.every(action => 
        JSON.stringify(permsByAction[action].sort()) === JSON.stringify(createRoles.sort())
      );

      if (allSame && createRoles.length > 0) {
        rulesString += `      allow read: if ${[...new Set(permsByAction.read)].join(' || ') || 'false'};\n`;
        rulesString += `      allow write: if ${[...new Set(createRoles)].join(' || ') || 'false'};\n`;
      } else {
         if (permsByAction.read.length > 0) {
             rulesString += `      allow get, list: if ${[...new Set(permsByAction.read)].join(' || ')};\n`;
         }
         if (createRoles.length > 0) {
             rulesString += `      allow create: if ${[...new Set(createRoles)].join(' || ')};\n`;
         }
         if (updateRoles.length > 0) {
              rulesString += `      allow update: if ${[...new Set(updateRoles)].join(' || ')};\n`;
         }
         if (deleteRoles.length > 0) {
             rulesString += `      allow delete: if ${[...new Set(deleteRoles)].join(' || ')};\n`;
         }
      }
      
       if (Object.values(permsByAction).every(arr => arr.length === 0)) {
            rulesString += `      allow read, write: if false;\n`;
       }


      rulesString += `    }\n`;
    }

    rulesString += `  }\n}\n`;
    return rulesString;
  };
    
    const handleSave = () => {
        setIsSaving(true);
        const generatedRules = generateRules();
        
        // This is a placeholder for the actual file-writing logic
        // In a real scenario, this would trigger an API call to a backend
        // that has permissions to write to the file system.
        console.log("--- Generated firestore.rules ---");
        console.log(generatedRules);
        
        // Simulate API call
        setTimeout(() => {
            // Here you would get the result and update the real file
            // For now, we'll just log it and show a toast.
            toast({
                title: "Regras de Segurança Geradas",
                description: "As regras foram geradas no console do navegador para verificação.",
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
