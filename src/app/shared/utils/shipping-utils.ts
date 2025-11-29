export type ShippingConfig = {
  freeThreshold: number;
  defaultCost: number;
  metroCities: string[];
  metroDepartments?: string[];
};

const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  freeThreshold: 200000,
  defaultCost: 12000,
  metroCities: [
    'barranquilla',
    'soledad',
    'malambo',
    'galapa',
    'puerto colombia',
    'sabanagrande',
    'sabanalarga'
  ],
  metroDepartments: ['atlantico']
};

function normalizeText(value?: string): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function resolveConfig(config?: Partial<ShippingConfig>): ShippingConfig {
  const merged: ShippingConfig = {
    ...DEFAULT_SHIPPING_CONFIG,
    ...config,
    metroCities: config?.metroCities || DEFAULT_SHIPPING_CONFIG.metroCities,
    metroDepartments: config?.metroDepartments || DEFAULT_SHIPPING_CONFIG.metroDepartments
  };
  return merged;
}

export function isMetroAreaBarranquilla(
  city?: string,
  department?: string,
  config?: Partial<ShippingConfig>
): boolean {
  const normalizedCity = normalizeText(city);
  const normalizedDepartment = normalizeText(department);
  const { metroCities, metroDepartments } = resolveConfig(config);

  if (
    metroCities.some(
      (metro) => normalizeText(metro) && normalizeText(metro) === normalizedCity
    )
  ) {
    return true;
  }

  if (
    metroDepartments &&
    metroDepartments.some(
      (dept) => normalizeText(dept) && normalizeText(dept) === normalizedDepartment
    )
  ) {
    return true;
  }

  return false;
}

export function calculateShippingCost(
  subtotal: number,
  city?: string,
  department?: string,
  config?: Partial<ShippingConfig>
): number {
  const resolved = resolveConfig(config);
  if (!Number.isFinite(subtotal)) {
    return resolved.defaultCost;
  }

  if (subtotal >= resolved.freeThreshold || subtotal === 0) {
    return 0;
  }

  if (isMetroAreaBarranquilla(city, department, resolved)) {
    return 0;
  }

  return resolved.defaultCost;
}
