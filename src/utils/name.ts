export function toAmericanNameCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(formatWord)
    .join(' ');
}

function formatWord(word: string) {
  return word
    .split(/([-'])/)
    .map((part) => {
      if (part === '-' || part === "'") return part;
      const normalized = part.toLocaleLowerCase('pt-BR');
      return normalized ? `${normalized[0].toLocaleUpperCase('pt-BR')}${normalized.slice(1)}` : normalized;
    })
    .join('');
}
