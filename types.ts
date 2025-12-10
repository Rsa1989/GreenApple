
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
  isUsed?: boolean;
  batteryHealth?: number;
  observation?: string; // Field for notes like "Reserved for X"
}

export interface SimulationItem {
  id: string;
  customerName: string;
  customerSurname: string;
  customerPhone: string;
  productName: string; // Combined name
  
  // Specific Product Details
  productNameOnly?: string;
  productMemory?: string;
  productColor?: string;

  costUsd: number;
  feeUsd: number;
  exchangeRate: number;
  spread?: number; // Added to save simulation config
  importTaxBrl?: number; // Added to save simulation config
  totalCostBrl: number;
  sellingPrice: number;
  createdAt: number;
  mode?: CalculatorMode; // Track which mode created this
  productId?: string; // Track original inventory ID if applicable
  status?: 'saved' | 'sold' | 'ordered'; // Track if the item was sold or ordered
  soldAt?: number;
  
  // Trade-in fields
  tradeInName?: string;
  tradeInValue?: number;
  tradeInMemory?: string;
  tradeInColor?: string;
  tradeInBattery?: number;
}

export interface Transaction {
  id: string;
  type: 'STOCK_ENTRY' | 'SALE' | 'TRADE_IN_ENTRY'; // Added TRADE_IN_ENTRY
  description: string;
  amount: number; // Value in BRL (Sale Price for SALES, Cost for STOCK_ENTRY)
  cost?: number; // Only for SALE: The original cost of the item to calculate profit
  date: number;
  relatedId?: string; // ID of the product or simulation
  tradeInValue?: number; // NEW: Value of the trade-in accepted during this sale
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
  FROM_USED_STOCK = 'FROM_USED_STOCK',
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
  whatsappTemplate: string; // Custom message template
  
  // Customizable WhatsApp Labels
  whatsappTradeInLabel?: string; 
  whatsappTradeInValueLabel?: string;
  whatsappTotalLabel?: string;

  adminPassword: string; // Login password
}

// Kept CatalogItem interface to prevent errors in other files, even if feature is disabled
export interface CatalogItem {
  id: string;
  name: string;
}