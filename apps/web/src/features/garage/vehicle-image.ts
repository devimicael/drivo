/** Fotografias ilustrativas originais do Figma, associadas somente ao modelo correspondente. */
export function vehicleImage(marca: string, modelo: string): string | null {
  const brand = marca.toLocaleLowerCase('pt-BR');
  const model = modelo.toLocaleLowerCase('pt-BR').replace(/[\s-]/g, '');
  if (brand.includes('toyota') && model.includes('corolla')) return '/img/vehicles/corolla.jpg';
  if (brand.includes('honda') && model.includes('hrv')) return '/img/vehicles/hr-v.jpg';
  if (brand.includes('volkswagen') && model.includes('polo')) return '/img/vehicles/polo.jpg';
  if (brand.includes('fiat') && model.includes('toro')) return '/img/vehicles/toro.jpg';
  if (brand.includes('yamaha') && model.includes('mt03')) return '/img/vehicles/mt-03.jpg';
  return null;
}
