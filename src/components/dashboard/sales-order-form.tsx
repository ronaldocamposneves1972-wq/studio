
'use client'

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';

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
import { Separator } from '../ui/separator';

const orderItemSchema = z.object({
  productId: z.string().min(1, 'Selecione um produto.'),
  value: z.preprocess(
    (a) => parseFloat(String(a).replace(/\./g, '').replace(',', '.')),
    z.number().positive('O valor deve ser positivo.')
  ),
});

const salesOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Adicione pelo menos um item ao pedido.'),
});

type SalesOrderFormData = z.infer<typeof salesOrderSchema>;

interface SalesOrderFormProps {
  onSave: (data: any) => Promise<void> | void;
}

export function SalesOrderForm({ onSave }: SalesOrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    return firestore ? query(collection(firestore, 'products'), where('behavior', '!=', 'Proposta')) : null;
  }, [firestore]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const form = useForm<SalesOrderFormData>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: {
      items: [{ productId: '', value: 0 }],
    },
  });

  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const totalValue = watchedItems.reduce((acc, item) => {
      const value = parseFloat(String(item.value).replace(/\./g, '').replace(',', '.')) || 0;
      return acc + value;
  }, 0);


  const handleFormSubmit = async (data: SalesOrderFormData) => {
    setIsSubmitting(true);
    const orderData = {
        ...data,
        totalValue,
        items: data.items.map(item => {
            const product = products?.find(p => p.id === item.productId);
            return {
                ...item,
                productName: product?.name || 'N/A'
            }
        })
    }
    await onSave(orderData);
    setIsSubmitting(false);
  };
  
   const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    const digitsOnly = value.replace(/[^\d]/g, '');
    if (!digitsOnly) {
      setValue(`items.${index}.value`, '' as any);
      return;
    }
    const numberValue = parseInt(digitsOnly, 10);
    
    const formatted = (numberValue / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    setValue(`items.${index}.value`, formatted as any, { shouldValidate: true });
  };


  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-4 py-4">
        <div className="max-h-[50vh] overflow-y-auto pr-4">
            {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[1fr_auto_auto] items-end gap-2 border-b pb-4 mb-4">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                             <Label htmlFor={`items.${index}.productId`}>Produto</Label>
                            {isLoadingProducts ? (
                                <Skeleton className="h-10 w-full" />
                            ) : (
                                <Controller
                                    control={control}
                                    name={`items.${index}.productId`}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um produto"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products?.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            )}
                            {errors.items?.[index]?.productId && <p className="text-sm text-destructive">{errors.items?.[index]?.productId?.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`items.${index}.value`}>Valor R$</Label>
                            <Input
                                {...register(`items.${index}.value`)}
                                placeholder="100,00"
                                onChange={(e) => handleNumericInputChange(e, index)}
                            />
                            {errors.items?.[index]?.value && <p className="text-sm text-destructive">{errors.items?.[index]?.value?.message}</p>}
                        </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
        </div>
        <Button type="button" variant="outline" onClick={() => append({ productId: '', value: 0 })}>
            <PlusCircle className="mr-2 h-4 w-4"/>
            Adicionar Item
        </Button>
         {errors.items && <p className="text-sm text-destructive">{errors.items.message}</p>}

        <Separator/>

        <div className="flex justify-end items-center gap-4">
            <p className="text-muted-foreground">Valor Total do Pedido:</p>
            <p className="text-2xl font-bold">
                 R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
        </div>


      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Salvando...' : 'Lançar Pedido'}
        </Button>
      </DialogFooter>
    </form>
  );
}
