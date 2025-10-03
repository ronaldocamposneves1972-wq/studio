
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ChevronLeft, ChevronRight, Upload, CheckCircle } from 'lucide-react';

import type { Quiz, Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { validateCPF, maskCPF, maskPhone, maskDate, maskCEP } from '@/lib/utils';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';

// --- Zod Schema for Validation ---
// This schema should be broad enough to catch all possible questions
const formSchema = z.object({}).catchall(z.any());

type FormData = z.infer<typeof formSchema>;

const getMaskFunction = (questionId: string) => {
    switch (questionId) {
        case 'q-cpf': return maskCPF;
        case 'q-phone': return maskPhone;
        case 'q-birthdate': return maskDate;
        case 'q-cep': return maskCEP;
        default: return (value: string) => value;
    }
};

interface StandaloneQuizFormProps {
    quiz: Quiz;
    onComplete: (answers: FormData) => Promise<void>;
    isSubmitting: boolean;
    initialAnswers?: Record<string, any>;
    onCEPChange?: (cep: string) => Promise<void>;
}

export function StandaloneQuizForm({ quiz, onComplete, isSubmitting, initialAnswers, onCEPChange }: StandaloneQuizFormProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const totalSteps = quiz.questions.length;
    
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: initialAnswers || {},
    });
    
    // We get the current question based on the step
    const currentQuestion = quiz.questions[currentStep];

    const handleNext = async () => {
        // Trigger validation for the current field if needed
        const isValid = await form.trigger(currentQuestion.id as any);
        if (!isValid) return;

        if (currentQuestion.id === 'q-cep' && onCEPChange) {
            await onCEPChange(form.getValues(currentQuestion.id));
        }

        if (currentStep < totalSteps - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // This is the final step, call the main onComplete function
            await onComplete(form.getValues());
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };
    
    const renderInput = (field: any) => {
        const mask = getMaskFunction(currentQuestion.id);

        switch (currentQuestion.type) {
            case 'file':
                return (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center">
                        <Upload className="w-12 h-12 text-muted-foreground" />
                        <FormLabel htmlFor={currentQuestion.id} className="mt-4 text-lg cursor-pointer text-primary hover:underline">
                            Clique para enviar o arquivo
                        </FormLabel>
                        <FormControl>
                             <Input
                                id={currentQuestion.id}
                                type="file"
                                className="hidden"
                                onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                            />
                        </FormControl>
                        {field.value && <p className="mt-2 text-sm text-muted-foreground">Arquivo selecionado: {(field.value as File).name}</p>}
                        <FormMessage />
                    </div>
                );
            case 'radio':
                return (
                    <FormControl>
                        <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="space-y-2"
                        >
                            {currentQuestion.options?.map((option, index) => (
                                <FormItem key={index} className="flex items-center space-x-2">
                                    <FormControl>
                                        <RadioGroupItem value={option} id={`${currentQuestion.id}-${index}`} />
                                    </FormControl>
                                    <FormLabel htmlFor={`${currentQuestion.id}-${index}`} className="font-normal">{option}</FormLabel>
                                </FormItem>
                            ))}
                        </RadioGroup>
                    </FormControl>
                );
            default:
                 return (
                    <FormControl>
                         <Input
                            {...field}
                            type={currentQuestion.type}
                            placeholder={`Sua resposta para ${currentQuestion.text.toLowerCase().replace('*','')}`}
                            onChange={(e) => {
                                if (typeof e.target.value === 'string') {
                                    const maskedValue = mask(e.target.value);
                                    e.target.value = maskedValue;
                                }
                                field.onChange(e);
                            }}
                            onBlur={() => {
                                if (currentQuestion.id === 'q-cep' && onCEPChange) {
                                    onCEPChange(field.value);
                                }
                                field.onBlur();
                            }}
                        />
                    </FormControl>
                );
        }
    };

    return (
        <Form {...form}>
            <div className="space-y-4">
                <Progress value={((currentStep + 1) / totalSteps) * 100} className="w-full" />
                <div className="space-y-2 text-left">
                    <h3 className="text-2xl font-bold">{quiz.name}</h3>
                    <p className="text-muted-foreground">Passo {currentStep + 1} de {totalSteps}</p>
                </div>

                <form onSubmit={(e) => e.preventDefault()} className="space-y-4 py-4 min-h-[200px]">
                    <FormField
                        control={form.control}
                        name={currentQuestion.id as any}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-lg">{currentQuestion.text}</FormLabel>
                                {renderInput(field)}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </form>

                <div className="flex justify-between items-center pt-4">
                    {currentStep > 0 ? (
                        <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Button>
                    ) : <div></div>}
                    <Button onClick={handleNext} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isSubmitting ? 'Enviando...' : (currentStep === totalSteps - 1 ? 'Finalizar' : 'Continuar')}
                        {!isSubmitting && currentStep < totalSteps - 1 && <ChevronRight className="ml-2 h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </Form>
    );
}

