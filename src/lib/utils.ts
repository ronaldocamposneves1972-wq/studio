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

/**
 * Calculates the monthly interest rate for a loan using the bisection method.
 * @param principal The loan amount.
 * @param numberOfInstallments The total number of payments.
 * @param installmentValue The value of each installment.
 * @returns The monthly interest rate (e.g., 0.05 for 5%).
 */
export function calculateMonthlyRate(
  principal: number,
  numberOfInstallments: number,
  installmentValue: number
): number {
  if (principal <= 0 || numberOfInstallments <= 0 || installmentValue <= 0) {
    return 0;
  }

  // If the total payments are less than or equal to the principal, there's no interest.
  if (installmentValue * numberOfInstallments <= principal) {
    return 0;
  }

  let low = 0;
  let high = 1; // Assume a max monthly rate of 100%, which is very high
  let mid = 0;
  const precision = 0.000001; // The desired precision for the rate

  // Function to calculate the present value (PV) of the installments for a given rate.
  const calculatePresentValue = (rate: number): number => {
    if (rate === 0) return numberOfInstallments * installmentValue;
    return installmentValue * ((1 - Math.pow(1 + rate, -numberOfInstallments)) / rate);
  };

  // Perform a sanity check before starting the loop.
  if (calculatePresentValue(high) > principal) {
    // This case is unlikely if total payments > principal, but it's a safeguard.
    // It suggests an unusual scenario, perhaps installmentValue is too low for any positive rate.
    // We can extend the search range or return an error indicator.
    // For now, let's extend the high range once.
    high = 2;
  }

  // Bisection method to find the root (the interest rate)
  for (let i = 0; i < 100; i++) { // Limit iterations to prevent infinite loops
    mid = (low + high) / 2;
    const pv = calculatePresentValue(mid);

    if (Math.abs(pv - principal) < precision) {
      // The rate is found
      return mid;
    }

    if (pv > principal) {
      // The rate is too low, so we search in the upper half
      low = mid;
    } else {
      // The rate is too high, so we search in the lower half
      high = mid;
    }
  }
  
  // Return the last calculated middle point if max iterations are reached
  return mid;
}
