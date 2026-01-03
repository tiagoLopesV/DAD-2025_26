import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Converte os dados da carta no nome do ficheiro correspondente.
 * Exemplo: suit: 'diamonds', value: 'A' -> 'o1.png'
 */
export const getCardFilename = (suit, value) => {
  if (!suit || !value) return 'semFace.png'

  // Mapeamento de naipes para as iniciais dos teus ficheiros
  const suitMap = {
    'hearts': 'c',   
    'diamonds': 'o', 
    'spades': 'e',   
    'clubs': 'p'     
  }

  // Mapeamento de valores para números (1 a 13)
  const valueMap = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
    '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
  }

  const prefix = suitMap[suit.toLowerCase()]
  const number = valueMap[value]

  return `${prefix}${number}.png`
}