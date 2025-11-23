import { CartItem } from '../hooks/useCart';

export interface PackageInfo {
  packageNumber: number;
  items: Array<{
    item: CartItem;
    quantity: number;
  }>;
  totalWeight: number;
  zone?: string;
  shippingCost?: number;
}

export interface SegmentationResult {
  packages: PackageInfo[];
  totalPackages: number;
  totalWeight: number;
  totalShippingCost: number;
  hasEstimatedWeights: boolean;
  canShip: boolean;
  warnings: string[];
}

const MAX_PACKAGE_WEIGHT = 5.0;
const DEFAULT_ESTIMATED_WEIGHT = 0.5;

export function segmentPackages(items: CartItem[]): Pick<SegmentationResult, 'packages' | 'totalPackages' | 'totalWeight' | 'hasEstimatedWeights' | 'canShip' | 'warnings'> {
  const warnings: string[] = [];
  let hasEstimatedWeights = false;

  const expandedItems: Array<{ item: CartItem; weight: number }> = [];

  for (const item of items) {
    let itemWeight = item.weight;

    if (!itemWeight || itemWeight <= 0) {
      itemWeight = DEFAULT_ESTIMATED_WEIGHT;
      hasEstimatedWeights = true;
      warnings.push(`"${item.name}" no tiene peso registrado. Usando peso estimado de ${DEFAULT_ESTIMATED_WEIGHT}kg`);
    }

    for (let i = 0; i < item.quantity; i++) {
      expandedItems.push({
        item: { ...item, quantity: 1 },
        weight: itemWeight
      });
    }
  }

  if (expandedItems.length === 0) {
    return {
      packages: [],
      totalPackages: 0,
      totalWeight: 0,
      hasEstimatedWeights: false,
      canShip: false,
      warnings: ['El carrito está vacío']
    };
  }

  expandedItems.sort((a, b) => b.weight - a.weight);

  const packages: PackageInfo[] = [];
  let currentPackage: PackageInfo = {
    packageNumber: 1,
    items: [],
    totalWeight: 0
  };

  for (const expandedItem of expandedItems) {
    if (expandedItem.weight > MAX_PACKAGE_WEIGHT) {
      const numPackages = Math.ceil(expandedItem.weight / MAX_PACKAGE_WEIGHT);
      warnings.push(
        `"${expandedItem.item.name}" pesa ${expandedItem.weight}kg y requiere ${numPackages} paquetes separados`
      );

      const weightPerPackage = expandedItem.weight / numPackages;
      for (let i = 0; i < numPackages; i++) {
        packages.push({
          packageNumber: packages.length + 1,
          items: [{
            item: expandedItem.item,
            quantity: 1 / numPackages
          }],
          totalWeight: parseFloat(weightPerPackage.toFixed(2))
        });
      }
      continue;
    }

    if (currentPackage.totalWeight + expandedItem.weight > MAX_PACKAGE_WEIGHT) {
      packages.push(currentPackage);
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

    currentPackage.totalWeight = parseFloat((currentPackage.totalWeight + expandedItem.weight).toFixed(2));
  }

  if (currentPackage.items.length > 0) {
    packages.push(currentPackage);
  }

  const totalWeight = parseFloat(
    packages.reduce((sum, pkg) => sum + pkg.totalWeight, 0).toFixed(2)
  );

  return {
    packages,
    totalPackages: packages.length,
    totalWeight,
    hasEstimatedWeights,
    canShip: true,
    warnings
  };
}

export function calculateTotalWeight(items: CartItem[]): number {
  return items.reduce((total, item) => {
    const weight = item.weight || DEFAULT_ESTIMATED_WEIGHT;
    return total + (weight * item.quantity);
  }, 0);
}

export function hasAnyWeight(items: CartItem[]): boolean {
  return items.some(item => item.weight && item.weight > 0);
}

export function getAllItemsWithoutWeight(items: CartItem[]): CartItem[] {
  return items.filter(item => !item.weight || item.weight <= 0);
}
