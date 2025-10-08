
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
      let rulesString = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isAdmin() {
      return getUserRole() == 'Admin';
    }

    function isGestor() {
      return getUserRole() == 'Gestor';
    }
    
    function isAtendente() {
        return getUserRole() == 'Atendente';
    }

    function isFinanceiro() {
        return getUserRole() == 'Financeiro';
    }
`;

      for (const collection of collections) {
          rulesString += `
    match /${collection}/{docId} {`;

          const rolePermissions: Record<string, string[]> = {};

          for (const role of roles) {
              const perms = permissions[role][collection];
              const allowedActions = Object.entries(perms)
                  .filter(([, allowed]) => allowed)
                  .map(([action]) => {
                      if (action === 'read') return 'get, list';
                      if (action === 'create') return 'create';
                      if (action === 'update') return 'update';
                      if (action === 'delete') return 'delete';
                      return '';
                  })
                  .filter(Boolean)
                  .join(', ');

              if (allowedActions) {
                  const roleCheck = role === 'Anonimo' ? '!isSignedIn()' : `is${role}()`;
                  if (!rolePermissions[allowedActions]) {
                      rolePermissions[allowedActions] = [];
                  }
                  rolePermissions[allowedActions].push(roleCheck);
              }
          }
           
          // Add owner-based rule for users collection
          if (collection === 'users') {
              const ownerRule = 'isOwner(docId)';
              if (!rolePermissions['read, update']) {
                  rolePermissions['read, update'] = [];
              }
               // Avoid duplicates
              if (!rolePermissions['read, update'].includes(ownerRule)) {
                rolePermissions['read, update'].push(ownerRule);
              }
          }

          if (Object.keys(rolePermissions).length === 0) {
              rulesString += `
      allow read, write: if false;`;
          } else {
              for (const [actions, roles] of Object.entries(rolePermissions)) {
                  rulesString += `
      allow ${actions}: if ${roles.join(' || ')};`;
              }
          }

          rulesString += `
    }
`;
      }

      rulesString += `
  }
}
`;
      return rulesString;
    }
    
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
                description: "As regras foram geradas. A integração para salvar o arquivo será implementada.",
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
