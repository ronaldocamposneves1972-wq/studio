'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const data = {
  "Administração e Gestão": [
    "Administração Geral", "Diretoria Executiva", "Presidência", "Secretaria Administrativa",
    "Planejamento Estratégico", "Controladoria", "Auditoria Interna", "Governança Corporativa",
    "Assessoria Executiva", "Relações Institucionais"
  ],
  "Financeiro e Contábil": [
    "Financeiro", "Contabilidade", "Fiscal e Tributário", "Tesouraria", "Cobrança",
    "Contas a Pagar", "Contas a Receber", "Faturamento", "Custos e Orçamento", "Controle Patrimonial"
  ],
  "Recursos Humanos": [
    "Departamento Pessoal", "Folha Salarial", "Recrutamento e Seleção", "Treinamento e Desenvolvimento",
    "Clima Organizacional", "Segurança do Trabalho", "Medicina Ocupacional", "Avaliação de Desempenho"
  ],
  "Compliance": [
    "Jurídico e Compliance", "Jurídico Trabalhista", "Jurídico Contratual", "Jurídico Societário",
    "Compliance e Riscos", "Propriedade Intelectual", "Licitações e Contratos", "Regulação e Normas",
    "Contencioso"
  ],
  "Auditoria Externa": [
    "Relações Governamentais", "Comercial e Vendas", "Vendas Internas", "Vendas Externas",
    "Pré-vendas (SDR)", "Pós-vendas", "Inside Sales", "Representantes Comerciais"
  ],
  "Produção e Manufatura": [
    "Produção", "Planejamento e Controle da Produção (PCP)", "Controle de Qualidade",
    "Engenharia de Produção", "Manutenção Industrial", "Processos e Eficiência", "Linha de Montagem",
    "Desenvolvimento de Produto", "Laboratório Técnico", "Segurança Industrial", "CRM / Gestão de Leads",
    "Expansão Comercial", "Parcerias Estratégicas"
  ],
  "Marketing e Comunicação": [
    "Marketing Digital", "Branding", "Publicidade", "Mídias Sociais", "SEO e Tráfego Pago",
    "Produção de Conteúdo", "Assessoria de Imprensa", "Eventos e Feiras", "Design e Criação",
    "Pesquisa de Mercado"
  ],
  "Tecnologia da Informação (TI)": [
    "TI Corporativo", "Desenvolvimento de Software", "Infraestrutura e Redes", "Suporte Técnico",
    "Banco de Dados", "Segurança da Informação", "UX/UI Design", "Automação e IA",
    "Data Analytics", "Inovação e P&D"
  ]
};

export default function SeedDataPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSeedData = async () => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Firestore não está disponível.' });
      return;
    }
    setIsLoading(true);
    setResult('');

    try {
      const batch = writeBatch(firestore);
      const costCentersCol = collection(firestore, 'cost_centers');
      const categoriesCol = collection(firestore, 'expense_categories');

      const costCenterMap = new Map<string, string>();
      
      let createdCostCenters = 0;
      let createdCategories = 0;

      for (const costCenterName of Object.keys(data)) {
        // Check if cost center exists
        const ccQuery = query(costCentersCol, where("name", "==", costCenterName));
        const ccSnapshot = await getDocs(ccQuery);
        let costCenterId: string;

        if (ccSnapshot.empty) {
          const newCostCenterRef = doc(costCentersCol);
          batch.set(newCostCenterRef, { name: costCenterName });
          costCenterId = newCostCenterRef.id;
          costCenterMap.set(costCenterName, costCenterId);
          createdCostCenters++;
        } else {
          costCenterId = ccSnapshot.docs[0].id;
          costCenterMap.set(costCenterName, costCenterId);
        }

        const categories = data[costCenterName as keyof typeof data];
        for (const categoryName of categories) {
           // Check if category exists
           const catQuery = query(categoriesCol, where("name", "==", categoryName));
           const catSnapshot = await getDocs(catQuery);

           if (catSnapshot.empty) {
             const newCategoryRef = doc(categoriesCol);
             batch.set(newCategoryRef, {
               name: categoryName,
               costCenterId: costCenterId,
               costCenterName: costCenterName
             });
             createdCategories++;
           }
        }
      }
      
      await batch.commit();

      const summary = `Dados semeados com sucesso! ${createdCostCenters} novos centros de custo e ${createdCategories} novas categorias foram criadas.`;
      setResult(summary);
      toast({ title: 'Sucesso!', description: summary });

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
      setResult(`Erro: ${errorMessage}`);
      toast({ variant: 'destructive', title: 'Falha ao semear dados', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-xl mx-auto">
          <CardHeader>
              <CardTitle>Semear Dados Iniciais</CardTitle>
              <CardDescription>
                  Clique no botão abaixo para popular o banco de dados com os Centros de Custo e Tipos de Despesa.
                  Esta ação é segura e não duplicará itens existentes.
              </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4">
               <Button onClick={handleSeedData} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Semeando Dados...' : 'Iniciar Semeação'}
              </Button>
              {result && (
                  <p className="mt-4 text-center text-sm text-muted-foreground">{result}</p>
              )}
          </CardContent>
      </Card>
    </div>
  );
}
