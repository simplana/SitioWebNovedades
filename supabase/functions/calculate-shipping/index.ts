import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  weight?: number;
  sku: string;
  options?: string;
}

interface PackageInfo {
  packageNumber: number;
  items: Array<{
    item: CartItem;
    quantity: number;
  }>;
  totalWeight: number;
  zone: string;
  baseCost: number;
  additionalCost: number;
  totalCost: number;
}

interface ShippingRate {
  zone: string;
  base_cost: number;
  additional_cost_per_kg: number;
  estimated_delivery_hours_min: number;
  estimated_delivery_hours_max: number;
  delivery_description: string;
}

const MAX_PACKAGE_WEIGHT = 5.0;
const DEFAULT_ESTIMATED_WEIGHT = 0.5;

function getShippingZone(province: string): string {
  const zoneMapping: Record<string, string> = {
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

  return zoneMapping[province.trim()] || 'nacional';
}

function segmentPackages(items: CartItem[], zone: string, rate: ShippingRate): {
  packages: PackageInfo[];
  hasEstimatedWeights: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let hasEstimatedWeights = false;

  const expandedItems: Array<{ item: CartItem; weight: number }> = [];

  for (const item of items) {
    let itemWeight = item.weight;

    if (!itemWeight || itemWeight <= 0) {
      itemWeight = DEFAULT_ESTIMATED_WEIGHT;
      hasEstimatedWeights = true;
      warnings.push(`"${item.name}" no tiene peso registrado`);
    }

    for (let i = 0; i < item.quantity; i++) {
      expandedItems.push({
        item: { ...item, quantity: 1 },
        weight: itemWeight
      });
    }
  }

  expandedItems.sort((a, b) => b.weight - a.weight);

  const packages: PackageInfo[] = [];
  let currentPackage: Omit<PackageInfo, 'zone' | 'baseCost' | 'additionalCost' | 'totalCost'> = {
    packageNumber: 1,
    items: [],
    totalWeight: 0
  };

  for (const expandedItem of expandedItems) {
    if (expandedItem.weight > MAX_PACKAGE_WEIGHT) {
      const numPackages = Math.ceil(expandedItem.weight / MAX_PACKAGE_WEIGHT);
      warnings.push(`"${expandedItem.item.name}" requiere ${numPackages} paquetes`);

      const weightPerPackage = expandedItem.weight / numPackages;
      for (let i = 0; i < numPackages; i++) {
        const pkgWeight = parseFloat(weightPerPackage.toFixed(2));
        const cost = calculateCost(pkgWeight, rate);
        packages.push({
          packageNumber: packages.length + 1,
          items: [{ item: expandedItem.item, quantity: 1 / numPackages }],
          totalWeight: pkgWeight,
          zone,
          ...cost
        });
      }
      continue;
    }

    if (currentPackage.totalWeight + expandedItem.weight > MAX_PACKAGE_WEIGHT) {
      const cost = calculateCost(currentPackage.totalWeight, rate);
      packages.push({
        ...currentPackage,
        zone,
        ...cost
      });
      currentPackage = {
        packageNumber: packages.length + 1,
        items: [],
        totalWeight: 0
      };
    }

    const existingItemIndex = currentPackage.items.findIndex(
      pi => pi.item.id === expandedItem.item.id && pi.item.options === expandedItem.item.options
    );

    if (existingItemIndex >= 0) {
      currentPackage.items[existingItemIndex].quantity += 1;
    } else {
      currentPackage.items.push({
        item: expandedItem.item,
        quantity: 1
      });
    }

    currentPackage.totalWeight = parseFloat(
      (currentPackage.totalWeight + expandedItem.weight).toFixed(2)
    );
  }

  if (currentPackage.items.length > 0) {
    const cost = calculateCost(currentPackage.totalWeight, rate);
    packages.push({
      ...currentPackage,
      zone,
      ...cost
    });
  }

  return { packages, hasEstimatedWeights, warnings };
}

function calculateCost(weightKg: number, rate: ShippingRate): {
  baseCost: number;
  additionalCost: number;
  totalCost: number;
} {
  const BASE_WEIGHT = 5.0;
  let baseCost = rate.base_cost;
  let additionalCost = 0;

  if (weightKg > BASE_WEIGHT) {
    const extraWeight = weightKg - BASE_WEIGHT;
    additionalCost = extraWeight * rate.additional_cost_per_kg;
  }

  return {
    baseCost: parseFloat(baseCost.toFixed(2)),
    additionalCost: parseFloat(additionalCost.toFixed(2)),
    totalCost: parseFloat((baseCost + additionalCost).toFixed(2))
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { items, province } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Items array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!province) {
      return new Response(
        JSON.stringify({ error: 'Province is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const zone = getShippingZone(province);

    const ratesResponse = await fetch(`${supabaseUrl}/rest/v1/shipping_rates?zone=eq.${zone}`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }
    });

    const rates: ShippingRate[] = await ratesResponse.json();
    if (!rates || rates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Shipping rate not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rate = rates[0];
    const { packages, hasEstimatedWeights, warnings } = segmentPackages(items, zone, rate);

    const totalWeight = packages.reduce((sum, pkg) => sum + pkg.totalWeight, 0);
    const totalShippingCost = packages.reduce((sum, pkg) => sum + pkg.totalCost, 0);

    const estimatedDate = new Date();
    estimatedDate.setHours(estimatedDate.getHours() + rate.estimated_delivery_hours_max);

    const response = {
      packages,
      totalPackages: packages.length,
      totalWeight: parseFloat(totalWeight.toFixed(2)),
      totalShippingCost: parseFloat(totalShippingCost.toFixed(2)),
      zone,
      hasEstimatedWeights,
      canShip: true,
      warnings,
      estimatedDeliveryHoursMin: rate.estimated_delivery_hours_min,
      estimatedDeliveryHoursMax: rate.estimated_delivery_hours_max,
      estimatedDeliveryDate: estimatedDate.toISOString(),
      deliveryDescription: rate.delivery_description
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error calculating shipping:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});