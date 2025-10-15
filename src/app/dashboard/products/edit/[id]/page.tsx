

'use client'

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ChevronLeft, Loader2 } from "lucide-react"
import { collection, doc, updateDoc } from "firebase/firestore"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import type { Product, ProductBehavior, FinancialInstitution as Bank, CommissionBase } from "@/lib/types"
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
  terms: z.preprocess(
    (val) => String(val),
    z.string().min(1, "Informe ao menos um prazo.")
  ),
  commissionRate: z.preprocess(
    (a) => parseFloat(String(a).replace(",", ".")),
    z.number().min(0, "A comissão não pode ser negativa.")
  ),
  commissionBase: z.enum(["liquido", "bruto"], { required_error: "Base de comissão é obrigatória."}),
});

const productSchema = z.discriminatedUnion("behavior", [fixedSchema, variableSchema, proposalSchema]);

type ProductFormData = z.infer<typeof productSchema>

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams();
  const productId = params.id as string;
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const productDocRef = useMemoFirebase(() => {
    if (!firestore || !productId) return null;
    return doc(firestore, 'products', productId);
  }, [firestore, productId]);
  const { data: product, isLoading: isLoadingProduct } = useDoc<Product>(productDocRef);

  const banksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "financial_institutions"));
  }, [firestore]);
  const { data: banks, isLoading: isLoadingBanks } = useCollection<Bank>(banksQuery);
  
  const selectedSchema = product ? {
    "Fixo": fixedSchema,
    "Variável": variableSchema,
    "Proposta": proposalSchema
  }[product.behavior] : baseSchema;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(selectedSchema),
  });

  const { register, handleSubmit, formState: { errors }, control, reset } = form;

  useEffect(() => {
    if (product) {
      const defaultValues: any = {
        name: product.name,
        bankId: product.bankId,
        behavior: product.behavior,
      };

      if (product.behavior === 'Proposta') {
        defaultValues.minAmount = product.minAmount;
        defaultValues.maxAmount = product.maxAmount;
        defaultValues.interestRate = product.interestRate;
        defaultValues.terms = product.terms.join(', ');
        defaultValues.commissionRate = product.commissionRate;
        defaultValues.commissionBase = product.commissionBase;
      } else if (product.behavior === 'Fixo' || product.behavior === 'Variável') {
        defaultValues.value = product.value;
      }
      
      reset(defaultValues);
      setIsLoadingData(false);
    }
  }, [product, reset]);

  const onSave = async (data: ProductFormData) => {
    if (!user) {
       toast({ variant: "destructive", title: "Erro de autenticação" })
       return;
    }
     if (!firestore || !productDocRef) {
       toast({ variant: "destructive", title: "Erro de Conexão" })
       return;
    }

    setIsSubmitting(true);

    try {
      const selectedBank = banks?.find(b => b.id === data.bankId);
      
      const productData: any = {
        ...data,
        bankName: selectedBank?.name || 'N/A',
      }
      if (productData.terms && typeof productData.terms === 'string') {
        productData.terms = productData.terms.split(',').map(term => Number(term.trim()));
      }

      await updateDoc(productDocRef, productData);
      
      toast({ title: "Produto atualizado com sucesso!", description: `O produto "${data.name}" foi salvo.` });
      router.push(`/dashboard/products/${productId}`);

    } catch (error) {
      console.error("Error updating product: ", error);
      toast({ variant: "destructive", title: "Erro ao atualizar produto" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLoading = isLoadingData || isLoadingProduct || isLoadingBanks;

  if (isLoading) {
    return (
       <div className="grid flex-1 auto-rows-max gap-4">
         <div className="flex items-center gap-4">
           <Skeleton className="h-7 w-7" />
           <Skeleton className="h-6 w-40" />
         </div>
         <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent className="grid gap-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
         </Card>
       </div>
    );
  }

  if (!product) {
     return (
        <div className="text-center py-10">
            <p>Produto não encontrado.</p>
            <Button asChild className="mt-4"><Link href="/dashboard/products">Voltar</Link></Button>
        </div>
    )
  }

  return (
    <div className="grid flex-1 auto-rows-max gap-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href={`/dashboard/products/${productId}`}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Editar Produto
        </h1>
      </div>
      <form onSubmit={handleSubmit(onSave)}>
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Produto: {product.behavior}</CardTitle>
            <CardDescription>
              Ajuste as informações do produto abaixo.
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
            
            { (product.behavior === 'Fixo' || product.behavior === 'Variável') && (
                <div className="grid gap-2">
                    <Label htmlFor="value">Valor (R$)</Label>
                    <Input id="value" type="number" step="0.01" {...register("value")} placeholder="1000,00" disabled={isSubmitting} />
                    {errors.value && <p className="text-sm text-destructive">{errors.value.message}</p>}
                </div>
            )}

            { product.behavior === 'Proposta' && (
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
                 <Button variant="outline" type="button" onClick={() => router.back()} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Salvar Alterações"}
                </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

    