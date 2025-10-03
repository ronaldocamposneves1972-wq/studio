import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Funções de Validação e Máscaras ---

/**
 * Valida um número de CPF.
 * @param cpf O CPF como string (pode conter pontos e hífen).
 * @returns `true` se o CPF for válido, `false` caso contrário.
 */
export function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;

  const digits = cpf.split('').map(Number);
  
  const calcChecker = (sliceEnd: number): number => {
    let sum = 0;
    for (let i = 0; i < sliceEnd; i++) {
      sum += digits[i] * (sliceEnd + 1 - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 || remainder === 11 ? 0 : remainder;
  };

  return calcChecker(9) === digits[9] && calcChecker(10) === digits[10];
}

/**
 * Aplica máscara de CPF (XXX.XXX.XXX-XX).
 */
export function maskCPF(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .substring(0, 14);
}

/**
 * Aplica máscara de telefone ((XX) XXXXX-XXXX).
 */
export function maskPhone(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 15);
}

/**
 * Aplica máscara de data (DD/MM/YYYY).
 */
export function maskDate(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .substring(0, 10);
}

/**
 * Aplica máscara de CEP (XXXXX-XXX).
 */
export function maskCEP(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 9);
}
