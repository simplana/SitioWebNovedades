/**
 * Normaliza nombres de provincias y corregimientos para la API de Servientrega
 * Convierte a mayúsculas y elimina tildes/acentos
 */
export function normalizeForServientrega(text: string): string {
  return text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Ñ/g, 'N')
    .trim();
}

/**
 * Mapeo de nombres especiales que requieren formato específico
 */
const SPECIAL_MAPPINGS: Record<string, string> = {
  'PANAMA OESTE': 'PANAMA',
  'COMARCA GUNA YALA': 'COMARCA KUNA YALA',
  'COMARCA EMBERA-WOUNAAN': 'COMARCA EMBERA',
  'COMARCA NGABE-BUGLE': 'COMARCA NGOBE BUGLE',
  'LA VILLA DE LOS SANTOS': 'LOS SANTOS',
  'PUERTO ARMUELLES': 'PUERTO ARMUELLESABECER',
};

/**
 * Formatea una provincia para Servientrega
 */
export function formatProvinciaForServientrega(provincia: string): string {
  const normalized = normalizeForServientrega(provincia);
  return SPECIAL_MAPPINGS[normalized] || normalized;
}

/**
 * Formatea un corregimiento para Servientrega
 */
export function formatCorregimientoForServientrega(corregimiento: string): string {
  const normalized = normalizeForServientrega(corregimiento);
  return SPECIAL_MAPPINGS[normalized] || normalized;
}

/**
 * Formatea una ciudad/distrito para Servientrega
 */
export function formatCiudadForServientrega(ciudad: string): string {
  const normalized = normalizeForServientrega(ciudad);
  return SPECIAL_MAPPINGS[normalized] || normalized;
}
