export type ShippingZone = 'urbano' | 'nacional' | 'especial';

export interface ShippingRate {
  zone: ShippingZone;
  baseCost: number;
  additionalCostPerKg: number;
  estimatedDeliveryHoursMin: number;
  estimatedDeliveryHoursMax: number;
  deliveryDescription: string;
}

export interface ShippingCostCalculation {
  zone: ShippingZone;
  weight: number;
  baseCost: number;
  additionalCost: number;
  totalCost: number;
}

export interface DeliveryEstimate {
  zone: ShippingZone;
  hoursMin: number;
  hoursMax: number;
  estimatedDate: Date;
  description: string;
  friendlyText: string;
}

const SHIPPING_RATES: Record<ShippingZone, ShippingRate> = {
  urbano: {
    zone: 'urbano',
    baseCost: 3.90,
    additionalCostPerKg: 0.40,
    estimatedDeliveryHoursMin: 24,
    estimatedDeliveryHoursMax: 24,
    deliveryDescription: 'Recolección en Panamá sin que el envío cruce a otra provincia'
  },
  nacional: {
    zone: 'nacional',
    baseCost: 4.90,
    additionalCostPerKg: 0.55,
    estimatedDeliveryHoursMin: 48,
    estimatedDeliveryHoursMax: 48,
    deliveryDescription: 'Cuando el envío cruza a otra provincia'
  },
  especial: {
    zone: 'especial',
    baseCost: 7.97,
    additionalCostPerKg: 0.90,
    estimatedDeliveryHoursMin: 72,
    estimatedDeliveryHoursMax: 120,
    deliveryDescription: 'Zonas Rojas y trayectos lejanos (Bocas del Toro, Darién, etc.)'
  }
};

const ZONE_MAPPING: Record<string, ShippingZone> = {
  'Panamá': 'urbano',
  'Panama': 'urbano',
  'Panamá Oeste': 'urbano',
  'Panama Oeste': 'urbano',
  'Colón': 'urbano',
  'Colon': 'urbano',

  'Chiriquí': 'nacional',
  'Chiriqui': 'nacional',
  'Veraguas': 'nacional',
  'Herrera': 'nacional',
  'Los Santos': 'nacional',
  'Coclé': 'nacional',
  'Cocle': 'nacional',

  'Bocas del Toro': 'especial',
  'Darién': 'especial',
  'Darien': 'especial',
  'Comarca Guna Yala': 'especial',
  'Comarca Ngäbe-Buglé': 'especial',
  'Comarca Emberá-Wounaan': 'especial'
};

export function getShippingZone(province: string): ShippingZone {
  const normalizedProvince = province.trim();

  const zone = ZONE_MAPPING[normalizedProvince];

  if (zone) {
    return zone;
  }

  return 'nacional';
}

export function getShippingRate(zone: ShippingZone): ShippingRate {
  return SHIPPING_RATES[zone];
}

export function calculateShippingCost(zone: ShippingZone, weightKg: number): ShippingCostCalculation {
  const rate = getShippingRate(zone);

  const BASE_WEIGHT = 5.0;

  let baseCost = rate.baseCost;
  let additionalCost = 0;

  if (weightKg > BASE_WEIGHT) {
    const extraWeight = weightKg - BASE_WEIGHT;
    additionalCost = extraWeight * rate.additionalCostPerKg;
  }

  const totalCost = baseCost + additionalCost;

  return {
    zone,
    weight: parseFloat(weightKg.toFixed(2)),
    baseCost: parseFloat(baseCost.toFixed(2)),
    additionalCost: parseFloat(additionalCost.toFixed(2)),
    totalCost: parseFloat(totalCost.toFixed(2))
  };
}

export function getDeliveryEstimate(
  province: string,
  fromDate: Date = new Date()
): DeliveryEstimate {
  const zone = getShippingZone(province);
  const rate = getShippingRate(zone);

  const estimatedDate = new Date(fromDate);
  estimatedDate.setHours(estimatedDate.getHours() + rate.estimatedDeliveryHoursMax);

  while (estimatedDate.getDay() === 0 || estimatedDate.getDay() === 6) {
    estimatedDate.setDate(estimatedDate.getDate() + 1);
  }

  const friendlyText = formatDeliveryTime(rate.estimatedDeliveryHoursMin, rate.estimatedDeliveryHoursMax);

  return {
    zone,
    hoursMin: rate.estimatedDeliveryHoursMin,
    hoursMax: rate.estimatedDeliveryHoursMax,
    estimatedDate,
    description: rate.deliveryDescription,
    friendlyText
  };
}

function formatDeliveryTime(hoursMin: number, hoursMax: number): string {
  if (hoursMin === hoursMax) {
    const days = hoursMin / 24;
    if (days === 1) return '1 día hábil';
    return `${days} días hábiles`;
  } else {
    const daysMin = Math.floor(hoursMin / 24);
    const daysMax = Math.ceil(hoursMax / 24);
    return `${daysMin} a ${daysMax} días hábiles`;
  }
}

export function getAllProvinces(): string[] {
  return Object.keys(ZONE_MAPPING);
}

export function getProvincesByZone(zone: ShippingZone): string[] {
  return Object.entries(ZONE_MAPPING)
    .filter(([, z]) => z === zone)
    .map(([province]) => province);
}

export function formatShippingCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}
