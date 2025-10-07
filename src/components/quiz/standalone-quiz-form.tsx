

'use client';

import { useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
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

const getMaskFunction = (questionType: string) => {
    switch (questionType) {
        case 'cpf': return maskCPF;
        case 'tel': return maskPhone;
        case 'date': return maskDate; // Assuming you might have a date type
        case 'cep': return maskCEP;
        default: return (value: string) => value;
    }
};

interface StandaloneQuizFormProps {
    quiz: Quiz;
    onComplete: (answers: FormData) => Promise<void>;
    isSubmitting: boolean;
    initialAnswers?: Record<string, any>;
    onCEPChange?: (cep: string) => Promise<void>;
    formContext: UseFormReturn<any>; // Pass react-hook-form context
}

export function StandaloneQuizForm({ quiz, onComplete, isSubmitting, initialAnswers, onCEPChange, formContext: form }: StandaloneQuizFormProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isStepProcessing, setIsStepProcessing] = useState(false);
    const totalSteps = quiz.questions.length;
    
    // We get the current question based on the step
    const currentQuestion = quiz.questions[currentStep];

    const handleNext = async () => {
        const isValid = await form.trigger(currentQuestion.id as any);
        if (!isValid) {
            const value = form.getValues(currentQuestion.id);
            if (!value || (value instanceof FileList && value.length === 0)) {
                 form.setError(currentQuestion.id as any, { type: 'manual', message: 'Este campo é obrigatório.' });
                 return;
            }
        }
        
        const value = form.getValues(currentQuestion.id);
        if (!value || (value instanceof FileList && value.length === 0)) {
            form.setError(currentQuestion.id as any, { type: 'manual', message: 'Este campo é obrigatório.' });
            return;
        }

        const isFileStep = currentQuestion.type === 'file' && form.getValues(currentQuestion.id);

        setIsStepProcessing(true);

        if (isFileStep) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second animation/delay
        }
        
        setIsStepProcessing(false);

        if (currentStep < totalSteps - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // This is the final step, call the main onComplete function
            await onComplete(form.getValues());
        }
    };
    
    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        if (currentQuestion.type === 'cep' && onCEPChange) {
            await onCEPChange(e.target.value);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };
    
    const renderInput = (field: any) => {
        const mask = getMaskFunction(currentQuestion.type);
        const watchedFiles = form.watch(field.name) as FileList | null;
        const selectedFiles = field.value instanceof FileList ? field.value : watchedFiles;


        switch (currentQuestion.type) {
            case 'file':
                return (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center">
                        {isStepProcessing ? (
                             <CheckCircle className="w-12 h-12 text-green-500 animate-pulse" />
                        ) : (
                            <Upload className="w-12 h-12 text-muted-foreground" />
                        )}
                        <FormLabel htmlFor={currentQuestion.id} className="mt-4 text-lg cursor-pointer text-primary hover:underline">
                            {isStepProcessing ? "Arquivo(s) pronto(s)!" : "Clique para selecionar os arquivos"}
                        </FormLabel>
                        <FormControl>
                             <Input
                                id={currentQuestion.id}
                                type="file"
                                className="hidden"
                                multiple // Allow multiple file selection
                                accept="image/*,application/pdf"
                                onChange={(e) => field.onChange(e.target.files)}
                            />
                        </FormControl>
                        {selectedFiles && selectedFiles.length > 0 && (
                            <div className="mt-2 text-sm text-muted-foreground space-y-1">
                                {Array.from(selectedFiles).map((file, index) => (
                                    <p key={index}>{file.name}</p>
                                ))}
                            </div>
                        )}
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
            case 'cep':
            case 'text':
            case 'number':
            case 'email':
            case 'tel':
            case 'address':
            case 'address_number':
            case 'address_complement':
                 return (
                    <FormControl>
                         <Input
                            {...field}
                            value={field.value || ''}
                            type={currentQuestion.type === 'number' ? 'number' : 'text'} // Use text for masked fields
                            placeholder={`Sua resposta para ${currentQuestion.text.toLowerCase().replace('*','')}`}
                            onChange={(e) => {
                                if (typeof e.target.value === 'string') {
                                    const maskedValue = mask(e.target.value);
                                    e.target.value = maskedValue;
                                }
                                field.onChange(e);
                            }}
                            onBlur={handleCepBlur}
                        />
                    </FormControl>
                );
            default:
                return <Input {...field} type="text" value={field.value || ''} />;
        }
    };

    const isFinalStep = currentStep === totalSteps - 1;
    const buttonDisabled = isSubmitting || isStepProcessing;
    
    const getButtonText = () => {
        if (isSubmitting) return 'Finalizando...';
        if (isStepProcessing) return 'Aguarde...';
        return isFinalStep ? 'Finalizar' : 'Continuar';
    }


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
                        key={currentQuestion.id}
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
                        <Button variant="outline" onClick={handleBack} disabled={buttonDisabled}>
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Button>
                    ) : <div></div>}
                    <Button onClick={handleNext} disabled={buttonDisabled}>
                        {buttonDisabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {getButtonText()}
                        {!buttonDisabled && !isFinalStep && <ChevronRight className="ml-2 h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </Form>
    );
}
