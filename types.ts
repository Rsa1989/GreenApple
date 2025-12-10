
export interface ProductItem {
  id: string;
  name: string;
  memory: string;
  color: string;
  costUsd: number;
  feeUsd: number;
  exchangeRate: number;
  spread: number;
  importTaxBrl: number;
  totalCostBrl: number;
  createdAt: number;
}

export interface CalculationResult {
  baseCostUsd: number;
  effectiveRate: number;
  baseCostBrl: number;
  totalCostBrl: number;
  marginAmount: number;
  sellingPrice: number;
}

export enum CalculatorMode {
  FROM_STOCK = 'FROM_STOCK',
  SIMULATION = 'SIMULATION'
}

export interface InstallmentRule {
  installments: number; // 1 to 12
  rate: number; // Percentage increase (e.g., 5.5 for 5.5%)
}

export interface AppSettings {
  defaultFeeUsd: number;
  defaultSpread: number;
  defaultImportTax: number;
  installmentRules: InstallmentRule[];
  themeColor: string; // Hex code
  headerBackgroundColor: string; // Hex code for header background
  backgroundColor: string; // Hex code for app background
  logoUrl: string | null; // Base64 string
}
