export function validateCityQuery(query: string): string | null {
  return query.trim().length < 3 || query.trim().length > 100
    ? 'A busca deve conter de 3 a 100 caracteres.'
    : null;
}
