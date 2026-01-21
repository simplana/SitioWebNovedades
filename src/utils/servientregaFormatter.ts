import { locationMapper } from './servientregaLocationMapper';

/**
 * Normaliza nombres de provincias y corregimientos para la API de Servientrega
 * Usa el mapeador inteligente basado en el CSV de Servientrega
 */

/**
 * Formatea una provincia para Servientrega usando el mapeador inteligente
 */
export function formatProvinciaForServientrega(provincia: string): string {
  return locationMapper.mapProvince(provincia);
}

/**
 * Formatea un corregimiento para Servientrega usando el mapeador inteligente
 * Requiere la provincia para hacer el mapeo correcto
 */
export function formatCorregimientoForServientrega(corregimiento: string, provincia?: string): string {
  if (provincia) {
    return locationMapper.mapCorregimiento(corregimiento, provincia);
  }

  return corregimiento
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Ñ/g, 'N')
    .trim();
}

/**
 * Formatea una ciudad/distrito para Servientrega
 * En Servientrega, la ciudad es el corregimiento
 */
export function formatCiudadForServientrega(ciudad: string, provincia?: string): string {
  return formatCorregimientoForServientrega(ciudad, provincia);
}

/**
 * Valida que una combinación de provincia y corregimiento existe en Servientrega
 */
export function validateServientregaLocation(corregimiento: string, provincia: string): boolean {
  return locationMapper.validateLocation(corregimiento, provincia);
}
