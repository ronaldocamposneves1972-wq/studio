

'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ChevronLeft, Loader2, Package, DraftingCompass, FileText } from "lucide-react"
import { collection, addDoc } from "firebase/firestore"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import type { ProductBehavior, FinancialInstitution as Bank, CommissionBase } from "@/lib/types"
import { query } from "firebase/firestore"

const baseSchema = z.object({
  name: z.string().min(3, "O nome do produto é obrigatório."),
  bankId: z.string({ required_error: "O banco é obrigatório." }),
  behavior: z.enum(["Fixo", "Variável", "Proposta"]),
});

const fixedSchema = baseSchema.extend({
  behavior: z.literal("Fixo"),
  value: z.preprocess(
    (a) => parseFloat(String(a).replace(",", ".")),
    z.number().positive("O valor deve ser positivo.")
  ),
});

const variableSchema = baseSchema.extend({
  behavior: z.literal("Variável"),
  value: z.preprocess(
    (a) => parseFloat(String(a).replace(",", ".")),
    z.number().positive("O valor deve ser positivo.")
  ),
});

const proposalSchema = baseSchema.extend({
  behavior: z.literal("Proposta"),
  minAmount: z.preprocess(
    (a) => parseFloat(String(a).replace(",", ".")),
    z.number().positive("O valor mínimo deve ser positivo.")
  ),
  maxAmount: z.preprocess(
    (a) => parseFloat(String(a).replace(",", ".")),
    z.number().positive("O valor máximo deve ser positivo.")
  ),
  interestRate: z.preprocess(
    (a) => parseFloat(String(a).replace(",", ".")),
    z.number().min(0, "A taxa não pode ser negativa.")
  ),
  terms: z.string().min(1, "Informe ao menos um prazo.").transform(value => value.split(',').map(term => Number(term.trim()))),
  commissionRate: z.preprocess(
    (a) => parseFloat(String(a).replace(",", ".")),
    z.number().min(0, "A comissão não pode ser negativa.")
  ),
  commissionBase: z.enum(["liquido", "bruto"], { required_error: "Base de comissão é obrigatória."}),
});

const productSchema = z.discriminatedUnion("behavior", [fixedSchema, variableSchema, proposalSchema]);

type ProductFormData = z.infer<typeof productSchema>

function ProductForm({
  behavior,
  onSave,
  onCancel,
  banks,
  isLoadingBanks,
}: {
  behavior: ProductBehavior,
  onSave: (data: ProductFormData) => void,
  onCancel: () => void,
  banks: Bank[] | null,
  isLoadingBanks: boolean,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedSchema = {
    "Fixo": fixedSchema,
    "Variável": variableSchema,
    "Proposta": proposalSchema
  }[behavior];
  
  const { register, handleSubmit, formState: { errors }, control } = useForm<ProductFormData>({
    resolver: zodResolver(selectedSchema),
    defaultValues: { behavior },
  });

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    await onSave(data);
    setIsSubmitting(false);
  }

  return (
     <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle>Novo Produto: {behavior}</CardTitle>
            <CardDescription>
              Preencha os detalhes para o novo produto.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
             <div className="grid gap-2">
                <Label htmlFor="name">Nome do Produto</Label>
                <Input id="name" {...register("name")} placeholder="Ex: Consórcio de Imóvel" disabled={isSubmitting} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
             </div>
             
             <div className="grid gap-2">
                <Label>Banco / Instituição Financeira</Label>
                 {isLoadingBanks ? (
                    <Skeleton className="h-10 w-full" />
                 ) : (
                    <Controller
                        control={control}
                        name="bankId"
                        render={({ field }) => (
                           <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o banco parceiro" />
                            </SelectTrigger>
                            <SelectContent>
                                {banks?.map(bank => (
                                    <SelectItem key={bank.id} value={bank.id}>{bank.name}</SelectItem>
                                ))}
                                {banks?.length === 0 && (
                                <div className="p-4 text-sm text-center text-muted-foreground">
                                    Nenhum banco encontrado. <Link href="/dashboard/banks" className="text-primary underline">Cadastre um banco.</Link>
                                </div>
                                )}
                            </SelectContent>
                           </Select>
                        )}
                    />
                 )}
                 {errors.bankId && <p className="text-sm text-destructive">{errors.bankId.message}</p>}
            </div>
            
            { (behavior === 'Fixo' || behavior === 'Variável') && (
                <div className="grid gap-2">
                    <Label htmlFor="value">Valor (R$)</Label>
                    <Input id="value" type="number" step="0.01" {...register("value")} placeholder="1000,00" disabled={isSubmitting} />
                    {errors.value && <p className="text-sm text-destructive">{errors.value.message}</p>}
                </div>
            )}

            { behavior === 'Proposta' && (
                <>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="minAmount">Valor Mínimo (R$)</Label>
                            <Input id="minAmount" type="number" step="0.01" {...register("minAmount")} placeholder="1000,00" disabled={isSubmitting} />
                            {'minAmount' in errors && errors.minAmount && <p className="text-sm text-destructive">{(errors as any).minAmount.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="maxAmount">Valor Máximo (R$)</Label>
                            <Input id="maxAmount" type="number" step="0.01" {...register("maxAmount")} placeholder="500000,00" disabled={isSubmitting} />
                             {'maxAmount' in errors && errors.maxAmount && <p className="text-sm text-destructive">{(errors as any).maxAmount.message}</p>}
                        </div>
                   </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="interestRate">Taxa de Juros / Admin. (%)</Label>
                            <Input id="interestRate" type="number" step="0.01" {...register("interestRate")} placeholder="1,8" disabled={isSubmitting} />
                            {'interestRate' in errors && errors.interestRate && <p className="text-sm text-destructive">{(errors as any).interestRate.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="terms">Prazos (meses, separados por vírgula)</Label>
                            <Input id="terms" {...register("terms")} placeholder="60, 72, 84" disabled={isSubmitting} />
                             {'terms' in errors && errors.terms && <p className="text-sm text-destructive">{(errors as any).terms.message}</p>}
                        </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="commissionRate">Comissão (%)</Label>
                            <Input id="commissionRate" type="number" step="0.01" {...register("commissionRate")} placeholder="2.5" disabled={isSubmitting} />
                            {'commissionRate' in errors && errors.commissionRate && <p className="text-sm text-destructive">{(errors as any).commissionRate.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label>Base de Cálculo da Comissão</Label>
                            <Controller
                                control={control}
                                name="commissionBase"
                                render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a base" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="liquido">Valor Líquido (principal)</SelectItem>
                                        <SelectItem value="bruto">Valor Bruto (total do contrato)</SelectItem>
                                    </SelectContent>
                                </Select>
                                )}
                            />
                            {'commissionBase' in errors && errors.commissionBase && <p className="text-sm text-destructive">{(errors as any).commissionBase.message}</p>}
                        </div>
                    </div>
                </>
            )}

            <div className="mt-6 flex justify-end gap-2">
                 <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Salvar Produto"}
                </Button>
            </div>
          </CardContent>
        </Card>
      </form>
  )
}


export default function NewProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()
  const [selectedBehavior, setSelectedBehavior] = useState<ProductBehavior | null>(null)

  const banksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "financial_institutions"));
  }, [firestore]);
  const { data: banks, isLoading: isLoadingBanks } = useCollection<Bank>(banksQuery);

  const handleSave = async (data: ProductFormData) => {
    if (!user) {
       toast({ variant: "destructive", title: "Erro de autenticação", description: "Você precisa estar logado." })
       return;
    }
     if (!firestore) {
       toast({ variant: "destructive", title: "Erro de Conexão", description: "Serviço de banco de dados indisponível." })
       return;
    }

    try {
      const productsCollection = collection(firestore, 'products');
      const selectedBank = banks?.find(b => b.id === data.bankId);
      
      const productData: any = {
        ...data,
        bankName: selectedBank?.name || 'N/A',
      }
      
      await addDoc(productsCollection, productData);
      
      toast({ title: "Produto criado com sucesso!", description: `O produto "${data.name}" foi salvo.` });
      router.push("/dashboard/products");

    } catch (error) {
      console.error("Error creating product: ", error);
      toast({ variant: "destructive", title: "Erro ao criar produto", description: "Não foi possível salvar o produto." });
    }
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard/products">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Adicionar Produto
        </h1>
      </div>

      <Dialog open={!selectedBehavior} onOpenChange={(open) => { if (!open) router.push('/dashboard/products')}}>
          <DialogContent className="sm:max-w-[425px]">
               <DialogHeader>
                  <DialogTitle>Selecione o Tipo de Produto</DialogTitle>
                  <DialogDescription>
                    Cada tipo de produto tem características e campos diferentes.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Button variant="outline" className="h-20 justify-start" onClick={() => setSelectedBehavior('Fixo')}>
                        <div className="flex items-center gap-4">
                            <Package className="h-8 w-8 text-primary" />
                            <div className="text-left">
                                <p className="font-semibold">Produto Fixo</p>
                                <p className="text-sm text-muted-foreground">Valor fixo para venda direta.</p>
                            </div>
                        </div>
                    </Button>
                     <Button variant="outline" className="h-20 justify-start" onClick={() => setSelectedBehavior('Variável')}>
                        <div className="flex items-center gap-4">
                            <DraftingCompass className="h-8 w-8 text-primary" />
                            <div className="text-left">
                                <p className="font-semibold">Produto Variável</p>
                                <p className="text-sm text-muted-foreground">O valor pode ser alterado na venda.</p>
                            </div>
                        </div>
                    </Button>
                     <Button variant="outline" className="h-20 justify-start" onClick={() => setSelectedBehavior('Proposta')}>
                        <div className="flex items-center gap-4">
                            <FileText className="h-8 w-8 text-primary" />
                            <div className="text-left">
                                <p className="font-semibold">Produto de Proposta</p>
                                <p className="text-sm text-muted-foreground">Gera propostas de crédito/consórcio.</p>
                            </div>
                        </div>
                    </Button>
                </div>
          </DialogContent>
      </Dialog>
      
      {selectedBehavior && (
        <ProductForm 
            behavior={selectedBehavior}
            onSave={handleSave}
            onCancel={() => setSelectedBehavior(null)}
            banks={banks}
            isLoadingBanks={isLoadingBanks}
        />
      )}
    </>
  )
}
