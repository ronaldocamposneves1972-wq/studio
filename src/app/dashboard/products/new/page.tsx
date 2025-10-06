
'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ChevronLeft } from "lucide-react"
import { collection, addDoc, query } from "firebase/firestore"

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
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import type { ProductType, FinancialInstitution as Bank } from "@/lib/types"

const productSchema = z.object({
  name: z.string().min(3, "O nome do produto é obrigatório."),
  productTypeId: z.string({ required_error: "O tipo do produto é obrigatório." }),
  bankId: z.string({ required_error: "O banco é obrigatório." }),
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
    z.number().min(0, "A taxa de juros não pode ser negativa.")
  ),
  commissionRate: z.preprocess(
    (a) => parseFloat(String(a).replace(",", ".")),
    z.number().min(0, "A comissão não pode ser negativa.")
  ),
  terms: z.string().min(1, "Informe ao menos um prazo.").transform(value => value.split(',').map(term => Number(term.trim()))),
});

type ProductFormData = z.infer<typeof productSchema>

export default function NewProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const productTypesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "product_types"));
  }, [firestore]);
  const { data: productTypes, isLoading: isLoadingTypes } = useCollection<ProductType>(productTypesQuery);

  const banksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "financial_institutions"));
  }, [firestore]);
  const { data: banks, isLoading: isLoadingBanks } = useCollection<Bank>(banksQuery);


  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  const onSubmit = async (data: ProductFormData) => {
    if (!user) {
       toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar um produto.",
      })
      return;
    }

    setIsSubmitting(true)

    try {
      if (!firestore) throw new Error("Firestore not available");
      const productsCollection = collection(firestore, 'products');

      const selectedType = productTypes?.find(t => t.id === data.productTypeId);
      const selectedBank = banks?.find(b => b.id === data.bankId);
      
      const productData = {
        ...data,
        type: selectedType?.name || 'N/A', // Legacy field
        bankName: selectedBank?.name || 'N/A',
      }
      
      await addDoc(productsCollection, productData);
      
      toast({
        title: "Produto criado com sucesso!",
        description: `O produto "${data.name}" foi salvo.`,
      })
      router.push("/dashboard/products")
    } catch (error) {
      console.error("Error creating product: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar produto",
        description: "Não foi possível salvar o produto. Verifique as permissões do Firestore.",
      })
    } finally {
        setIsSubmitting(false)
    }
  }

  return (
    <div className="grid flex-1 auto-rows-max gap-4">
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Produto</CardTitle>
            <CardDescription>
              Preencha as informações abaixo para cadastrar um novo produto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome do Produto</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Ex: Consórcio de Imóvel"
                    className={errors.name ? "border-destructive" : ""}
                    disabled={isSubmitting}
                  />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                </div>
                 <div className="grid gap-2">
                    <Label>Tipo</Label>
                     {isLoadingTypes ? (
                      <Skeleton className="h-10 w-full" />
                     ) : (
                       <Select onValueChange={(value) => setValue("productTypeId", value)} disabled={isSubmitting || isLoadingTypes}>
                          <SelectTrigger className={errors.productTypeId ? "border-destructive" : ""}>
                              <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                              {productTypes?.map(type => (
                                <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                              ))}
                              {productTypes?.length === 0 && (
                                <div className="p-4 text-sm text-center text-muted-foreground">
                                  Nenhum tipo encontrado. <Link href="/dashboard/settings/product-types" className="text-primary underline">Cadastre um tipo.</Link>
                                </div>
                              )}
                          </SelectContent>
                      </Select>
                     )}
                     {errors.productTypeId && <p className="text-sm text-destructive mt-1">{errors.productTypeId.message}</p>}
                </div>
              </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="minAmount">Valor Mínimo (R$)</Label>
                        <Input
                            id="minAmount"
                            type="number"
                            step="0.01"
                            {...register("minAmount")}
                            placeholder="1000,00"
                            className={errors.minAmount ? "border-destructive" : ""}
                            disabled={isSubmitting}
                        />
                        {errors.minAmount && <p className="text-sm text-destructive mt-1">{errors.minAmount.message}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="maxAmount">Valor Máximo (R$)</Label>
                        <Input
                            id="maxAmount"
                            type="number"
                            step="0.01"
                            {...register("maxAmount")}
                            placeholder="500000,00"
                            className={errors.maxAmount ? "border-destructive" : ""}
                            disabled={isSubmitting}
                        />
                        {errors.maxAmount && <p className="text-sm text-destructive mt-1">{errors.maxAmount.message}</p>}
                    </div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="interestRate">Taxa de Juros / Admin. (%)</Label>
                        <Input
                            id="interestRate"
                            type="number"
                            step="0.01"
                            {...register("interestRate")}
                            placeholder="1,8"
                            className={errors.interestRate ? "border-destructive" : ""}
                            disabled={isSubmitting}
                        />
                        {errors.interestRate && <p className="text-sm text-destructive mt-1">{errors.interestRate.message}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="commissionRate">Comissão (%)</Label>
                        <Input
                            id="commissionRate"
                            type="number"
                            step="0.01"
                            {...register("commissionRate")}
                            placeholder="2.5"
                            className={errors.commissionRate ? "border-destructive" : ""}
                            disabled={isSubmitting}
                        />
                        {errors.commissionRate && <p className="text-sm text-destructive mt-1">{errors.commissionRate.message}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="terms">Prazos (meses, separados por vírgula)</Label>
                        <Input
                            id="terms"
                            {...register("terms")}
                            placeholder="60, 72, 84"
                            className={errors.terms ? "border-destructive" : ""}
                            disabled={isSubmitting}
                        />
                        {errors.terms && <p className="text-sm text-destructive mt-1">{errors.terms.message}</p>}
                    </div>
                </div>

                 <div className="grid gap-2">
                    <Label>Banco / Instituição Financeira</Label>
                     {isLoadingBanks ? (
                      <Skeleton className="h-10 w-full" />
                     ) : (
                       <Select onValueChange={(value) => setValue("bankId", value)} disabled={isSubmitting || isLoadingBanks}>
                          <SelectTrigger className={errors.bankId ? "border-destructive" : ""}>
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
                     {errors.bankId && <p className="text-sm text-destructive mt-1">{errors.bankId.message}</p>}
                </div>

              <div className="mt-6 flex justify-end gap-2">
                 <Button variant="outline" type="button" onClick={() => router.back()} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : "Salvar Produto"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
