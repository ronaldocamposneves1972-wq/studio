
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
import { collection, query } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import Link from 'next/link';
import { DialogFooter } from '../ui/dialog';
import { cn } from '@/lib/utils';

const proposalFormSchema = z.object({
  productId: z.string({ required_error: 'Selecione um produto.' }),
  value: z.preprocess(
    (a) => parseFloat(String(a).replace(/\./g, '').replace(',', '.')),
    z.number().positive('O valor deve ser positivo.')
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

const formatCurrency = (value: number | string) => {
    if (!value) return '';
    let stringValue = String(value);
    
    // Remove non-digit characters except comma
    stringValue = stringValue.replace(/[^\d,]/g, '');
    // Replace comma with a dot for float conversion
    stringValue = stringValue.replace(',', '.');

    const numberValue = parseFloat(stringValue);
    if (isNaN(numberValue)) return '';

    return numberValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

export function ProposalForm({ onSave }: ProposalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    return firestore ? query(collection(firestore, 'products')) : null;
  }, [firestore]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalFormSchema),
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

  const installments = watch('installments');
  const installmentValue = watch('installmentValue');

  useEffect(() => {
    const parsedInstallments = parseInt(String(installments), 10);
    const parsedInstallmentValue = parseFloat(String(installmentValue).replace(/\./g, '').replace(',', '.'));
    
    if (!isNaN(parsedInstallments) && !isNaN(parsedInstallmentValue) && parsedInstallments > 0 && parsedInstallmentValue > 0) {
        setCalculatedTotal(parsedInstallments * parsedInstallmentValue);
    } else {
        setCalculatedTotal(0);
    }
  }, [installments, installmentValue]);


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
        value: calculatedTotal > 0 ? calculatedTotal : data.value,
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
    
    if (fieldName === 'installmentValue') {
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

       <div className="grid grid-cols-2 gap-4">
         <div className="grid gap-2">
            <Label htmlFor="installments">Número de Parcelas</Label>
            <Input
              id="installments"
              type="number"
              {...register('installments')}
              placeholder="Ex: 60"
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
              placeholder="Ex: 1.500,50"
              className={errors.installmentValue ? 'border-destructive' : ''}
              disabled={isSubmitting}
              onChange={(e) => handleNumericInputChange(e, 'installmentValue')}
            />
            {errors.installmentValue && <p className="text-sm text-destructive">{errors.installmentValue.message}</p>}
        </div>
      </div>
      
       <div className="space-y-2 rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">Valor Total Calculado</p>
        <p className="text-2xl font-bold">
            R$ {calculatedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="value">Ou informe o Valor Total Desejado (R$)</Label>
        <Input
          id="value"
          {...register('value')}
          placeholder="Ex: 90.030,00"
          className={cn(errors.value ? 'border-destructive' : '', calculatedTotal > 0 ? 'bg-muted/70' : '')}
          disabled={isSubmitting || calculatedTotal > 0}
          onChange={(e) => handleNumericInputChange(e, 'value')}
        />
        {errors.value && <p className="text-sm text-destructive">{errors.value.message}</p>}
         {calculatedTotal > 0 && <p className="text-xs text-muted-foreground">O valor total é calculado automaticamente a partir das parcelas.</p>}
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
