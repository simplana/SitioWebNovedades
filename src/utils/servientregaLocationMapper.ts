/**
 * Sistema de mapeo de ubicaciones para Servientrega
 * Mapea nombres amigables con tildes a los valores exactos del CSV de Servientrega
 */

import { SERVIENTREGA_LOCATIONS, ServientregaLocation } from './servientregaLocationData';

function normalizeText(text: string): string {
  return text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Ñ/g, 'N')
    .trim();
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);

  if (s1 === s2) return 1.0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  if (longer.includes(shorter)) return 0.8;

  const editDistance = levenshteinDistance(s1, s2);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

const PROVINCE_MAPPINGS: Record<string, string> = {
  'PROVINCIA DE PANAMA': 'PANAMA',
  'PANAMA OESTE': 'PANAMA',
  'CIUDAD DE PANAMA': 'PANAMA',
  'COMARCA GUNA YALA': 'COMARCA KUNA YALA',
  'COMARCA EMBERA-WOUNAAN': 'COMARCA EMBERA',
  'COMARCA NGABE-BUGLE': 'COMARCA NGOBE BUGLE',
};

export class ServientregaLocationMapper {
  private locations: ServientregaLocation[];
  private provinceMap: Map<string, string>;
  private corregimientosByProvince: Map<string, ServientregaLocation[]>;

  constructor() {
    this.locations = [...SERVIENTREGA_LOCATIONS];
    this.provinceMap = new Map();
    this.corregimientosByProvince = new Map();

    this.buildMaps();
  }

  private buildMaps(): void {
    Object.entries(PROVINCE_MAPPINGS).forEach(([key, value]) => {
      this.provinceMap.set(normalizeText(key), value);
    });

    this.locations.forEach(loc => {
      if (!this.corregimientosByProvince.has(loc.provincia)) {
        this.corregimientosByProvince.set(loc.provincia, []);
      }
      this.corregimientosByProvince.get(loc.provincia)!.push(loc);
    });
  }

  public mapProvince(input: string): string {
    const normalized = normalizeText(input);

    if (this.provinceMap.has(normalized)) {
      return this.provinceMap.get(normalized)!;
    }

    const uniqueProvinces = Array.from(new Set(this.locations.map(l => l.provincia)));

    for (const province of uniqueProvinces) {
      if (normalizeText(province) === normalized) {
        return province;
      }
    }

    let bestMatch = { province: normalized, similarity: 0 };
    for (const province of uniqueProvinces) {
      const similarity = calculateSimilarity(input, province);
      if (similarity > bestMatch.similarity) {
        bestMatch = { province, similarity };
      }
    }

    if (bestMatch.similarity > 0.7) {
      return bestMatch.province;
    }

    return normalized;
  }

  public mapCorregimiento(corregimientoInput: string, provinciaInput: string): string {
    const normalizedCorr = normalizeText(corregimientoInput);
    const provincia = this.mapProvince(provinciaInput);

    const corregimientosInProvince = this.corregimientosByProvince.get(provincia) || [];

    for (const loc of corregimientosInProvince) {
      if (normalizeText(loc.corregimiento) === normalizedCorr) {
        return loc.corregimiento;
      }
    }

    let bestMatch = { corregimiento: normalizedCorr, similarity: 0 };
    for (const loc of corregimientosInProvince) {
      const similarity = calculateSimilarity(corregimientoInput, loc.corregimiento);
      if (similarity > bestMatch.similarity) {
        bestMatch = { corregimiento: loc.corregimiento, similarity };
      }
    }

    if (bestMatch.similarity > 0.7) {
      return bestMatch.corregimiento;
    }

    return normalizedCorr;
  }

  public getCorregimientosByProvince(provincia: string): string[] {
    const mappedProvince = this.mapProvince(provincia);
    const locations = this.corregimientosByProvince.get(mappedProvince) || [];
    return Array.from(new Set(locations.map(l => l.corregimiento))).sort();
  }

  public validateLocation(corregimiento: string, provincia: string): boolean {
    const mappedProvince = this.mapProvince(provincia);
    const mappedCorregimiento = this.mapCorregimiento(corregimiento, provincia);

    const locations = this.corregimientosByProvince.get(mappedProvince) || [];
    return locations.some(l => l.corregimiento === mappedCorregimiento);
  }

  public findLocation(corregimiento: string, provincia: string): ServientregaLocation | null {
    const mappedProvince = this.mapProvince(provincia);
    const mappedCorregimiento = this.mapCorregimiento(corregimiento, provincia);

    const locations = this.corregimientosByProvince.get(mappedProvince) || [];
    return locations.find(l => l.corregimiento === mappedCorregimiento) || null;
  }
}

export const locationMapper = new ServientregaLocationMapper();
