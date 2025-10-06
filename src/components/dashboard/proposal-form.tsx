
'use client'

import { useState } from 'react';
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

const proposalFormSchema = z.object({
  productId: z.string({ required_error: 'Selecione um produto.' }),
  value: z.preprocess(
    (a) => parseFloat(String(a).replace(',', '.')),
    z.number().positive('O valor deve ser positivo.')
  ),
});

type ProposalFormData = z.infer<typeof proposalFormSchema>;

interface ProposalFormProps {
  onSave: (data: any) => Promise<void> | void;
}

export function ProposalForm({ onSave }: ProposalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    return firestore ? query(collection(firestore, 'products')) : null;
  }, [firestore]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalFormSchema),
  });

  const handleFormSubmit = async (data: ProposalFormData) => {
    setIsSubmitting(true);
    const selectedProduct = products?.find(p => p.id === data.productId);
    if (!selectedProduct) {
        // This should not happen if the form is correctly populated
        console.error("Selected product not found");
        setIsSubmitting(false);
        return;
    }
    
    const fullData = {
        ...data,
        productName: selectedProduct.name, // Denormalize product name for easy display
    }

    await onSave(fullData);
    setIsSubmitting(false);
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

      <div className="grid gap-2">
        <Label htmlFor="value">Valor da Proposta (R$)</Label>
        <Input
          id="value"
          type="number"
          step="0.01"
          {...register('value')}
          placeholder="5000,00"
          className={errors.value ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.value && <p className="text-sm text-destructive">{errors.value.message}</p>}
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
