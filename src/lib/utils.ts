import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Função para converter data string (YYYY-MM-DD) para timestamp local ao meio-dia
export function dateStringToLocalTimestamp(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0); // Meio-dia local
  return date.toISOString();
}

// Função para exibir data sem problemas de timezone
export function formatDateLocal(dateString: string | null): string {
  if (!dateString) return '-';
  
  // Se a string já contém informação de hora, extrair apenas a data
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('pt-BR');
}

// Função para exibir data e hora no fuso horário do Brasil (São Paulo)
export function formatDateTimeLocal(dateString: string | null): string {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}