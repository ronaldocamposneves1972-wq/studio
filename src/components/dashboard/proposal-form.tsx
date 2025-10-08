
'use client'

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import Link from 'next/link';
import { DialogFooter } from '../ui/dialog';
import { cn } from '@/lib/utils';
import { calculateMonthlyRate } from '@/lib/utils';


const proposalFormSchema = z.object({
  productId: z.string({ required_error: 'Selecione um produto.' }),
  value: z.preprocess(
    (a) => parseFloat(String(a).replace(/\./g, '').replace(',', '.')),
    z.number().positive('O valor do empréstimo deve ser positivo.')
  ),
   installments: z.preprocess(
    (a) => parseInt(String(a), 10),
    z.number().positive("O número de parcelas deve ser positivo.")
  ),
  installmentValue: z.preprocess(
    (a) => parseFloat(String(a).replace(/\./g, '').replace(',', '.')),
    z.number().positive("O valor da parcela deve ser positivo.")
  ),
});

type ProposalFormData = z.infer<typeof proposalFormSchema>;

interface ProposalFormProps {
  onSave: (data: any) => Promise<void> | void;
}

export function ProposalForm({ onSave }: ProposalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalToPay, setTotalToPay] = useState(0);
  const [monthlyInterestRate, setMonthlyInterestRate] = useState(0);
  const [totalInterestRate, setTotalInterestRate] = useState(0);
  const [selectedProductInfo, setSelectedProductInfo] = useState<{rate: number, type: Product['behavior']} | null>(null);
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    return firestore ? query(collection(firestore, 'products'), where('behavior', '==', 'Proposta')) : null;
  }, [firestore]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalFormSchema),
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

  const principal = watch('value');
  const installments = watch('installments');
  const installmentValue = watch('installmentValue');
  const selectedProductId = watch('productId');

  useEffect(() => {
    const parsedPrincipal = parseFloat(String(principal).replace(/\./g, '').replace(',', '.'));
    const parsedInstallments = parseInt(String(installments), 10);
    const parsedInstallmentValue = parseFloat(String(installmentValue).replace(/\./g, '').replace(',', '.'));
    
    if (!isNaN(parsedInstallments) && !isNaN(parsedInstallmentValue) && parsedInstallments > 0 && parsedInstallmentValue > 0) {
        const total = parsedInstallments * parsedInstallmentValue;
        setTotalToPay(total);
        if (!isNaN(parsedPrincipal) && parsedPrincipal > 0) {
          const monthlyRate = calculateMonthlyRate(parsedPrincipal, parsedInstallments, parsedInstallmentValue);
          setMonthlyInterestRate(monthlyRate);
          
          const totalRate = monthlyRate * parsedInstallments;
          setTotalInterestRate(totalRate);

        }
    } else {
        setTotalToPay(0);
        setMonthlyInterestRate(0);
        setTotalInterestRate(0);
    }
  }, [principal, installments, installmentValue]);
  
  useEffect(() => {
    if (selectedProductId && products) {
        const product = products.find(p => p.id === selectedProductId);
        if (product && product.behavior === 'Proposta') {
            setSelectedProductInfo({ rate: product.interestRate, type: product.behavior });
        } else {
            setSelectedProductInfo(null);
        }
    }
  }, [selectedProductId, products]);


  const handleFormSubmit = async (data: ProposalFormData) => {
    setIsSubmitting(true);
    const selectedProduct = products?.find(p => p.id === data.productId);
    if (!selectedProduct) {
        console.error("Selected product not found");
        setIsSubmitting(false);
        return;
    }
    
    const fullData = {
        ...data,
        totalValue: totalToPay,
        productName: selectedProduct.name,
        bankName: selectedProduct.bankName,
    }

    await onSave(fullData);
    setIsSubmitting(false);
  };
  
  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof ProposalFormData) => {
    const { value } = e.target;
    const digitsOnly = value.replace(/[^\d]/g, '');
    if (!digitsOnly) {
      setValue(fieldName, '' as any);
      return;
    }
    const numberValue = parseInt(digitsOnly, 10);
    
    // For currency fields
    if (fieldName === 'installmentValue' || fieldName === 'value') {
      const formatted = (numberValue / 100).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
      });
      setValue(fieldName, formatted as any, { shouldValidate: true });
    } else {
      setValue(fieldName, numberValue as any, { shouldValidate: true });
    }
  };


  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
            <Label htmlFor="productId">Produto</Label>
            {isLoadingProducts ? (
            <Skeleton className="h-10 w-full" />
            ) : (
            <Select onValueChange={(value) => setValue('productId', value)} disabled={isSubmitting}>
                <SelectTrigger id="productId" className={errors.productId ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione um produto de crédito" />
                </SelectTrigger>
                <SelectContent>
                {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                    {product.name} ({product.bankName})
                    </SelectItem>
                ))}
                {!products?.length && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                    Nenhum produto cadastrado. <Link href="/dashboard/products/new" className="text-primary underline">Adicionar produto</Link>.
                    </div>
                )}
                </SelectContent>
            </Select>
            )}
            {errors.productId && <p className="text-sm text-destructive">{errors.productId.message}</p>}
        </div>

        <div className="grid gap-2">
            <Label>Taxa de Juros / Admin. do Produto</Label>
            <div className={cn("flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm", selectedProductInfo ? 'text-foreground' : 'text-muted-foreground')}>
                {selectedProductInfo ? `${selectedProductInfo.rate}%` : 'Selecione um produto'}
            </div>
        </div>
      </div>

       <div className="grid gap-2">
        <Label htmlFor="value">Valor do Empréstimo (Principal) R$</Label>
        <Input
          id="value"
          {...register('value')}
          placeholder="Ex: 3.000,00"
          className={cn(errors.value ? 'border-destructive' : '')}
          disabled={isSubmitting}
          onChange={(e) => handleNumericInputChange(e, 'value')}
        />
        {errors.value && <p className="text-sm text-destructive">{errors.value.message}</p>}
      </div>


       <div className="grid grid-cols-2 gap-4">
         <div className="grid gap-2">
            <Label htmlFor="installments">Número de Parcelas</Label>
            <Input
              id="installments"
              type="number"
              {...register('installments')}
              placeholder="Ex: 18"
              className={errors.installments ? 'border-destructive' : ''}
              disabled={isSubmitting}
            />
            {errors.installments && <p className="text-sm text-destructive">{errors.installments.message}</p>}
        </div>
        <div className="grid gap-2">
            <Label htmlFor="installmentValue">Valor da Parcela (R$)</Label>
            <Input
              id="installmentValue"
              {...register('installmentValue')}
              placeholder="Ex: 379,00"
              className={errors.installmentValue ? 'border-destructive' : ''}
              disabled={isSubmitting}
              onChange={(e) => handleNumericInputChange(e, 'installmentValue')}
            />
            {errors.installmentValue && <p className="text-sm text-destructive">{errors.installmentValue.message}</p>}
        </div>
      </div>
      
       <div className="space-y-4 rounded-lg bg-muted/50 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Valor Total a Pagar</p>
            <p className="text-2xl font-bold">
                R$ {totalToPay.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
           <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-muted-foreground">Juros (Mensal)</p>
                    <p className="text-lg font-bold text-primary">
                        {(monthlyInterestRate * 100).toFixed(2)}%
                    </p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Juros (Total)</p>
                    <p className="text-lg font-bold text-primary">
                        {(totalInterestRate * 100).toFixed(2)}%
                    </p>
                </div>
            </div>
        </div>
        <p className="text-xs text-muted-foreground">Valores calculados com base nas informações fornecidas.</p>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Salvando...' : 'Salvar Proposta'}
        </Button>
      </DialogFooter>
    </form>
  );
}
