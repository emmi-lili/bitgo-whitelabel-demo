// components/types.ts — vistas del cliente (el JSON del BFF ya parseado).
// Espejo de los tipos de dominio pero sin la marca nominal de Money.
import type { Coin } from '@/lib/domain/assets';

export interface MoneyView {
  coin: Coin;
  unit: 'base' | 'display';
  value: string;
}

export interface AssetBalanceView {
  coin: Coin;
  currency: string;
  total: MoneyView;
  held: MoneyView;
  unsettledHeld: MoneyView;
  tradable: MoneyView;
  withdrawable: MoneyView;
}

export interface BalancesView {
  balances: AssetBalanceView[];
  unmapped: Array<{ currency: string; raw: Record<string, string> }>;
}

export interface TransactionView {
  id: string;
  coin: Coin;
  direction: 'in' | 'out';
  amount: MoneyView;
  state: string;
  pending: boolean;
  isBookTransfer: boolean;
  subType?: string;
  date: string;
  comment?: string;
  internalRef: string;
  onChainTxid: string | null;
  history: Array<{ action?: string; date?: string }>;
}

export interface TransactionsView {
  transactions: TransactionView[];
  unmapped: Array<{ id: string; coin: string }>;
}

export interface AddressView {
  id?: string;
  address: string;
  coin?: string;
  chain?: number;
  label?: string;
}

export interface AddressesView {
  addresses: AddressView[];
}

// ── Trading ──────────────────────────────────────────────────────────────────
export type TradeSide = 'buy' | 'sell' | 'swap';

export interface AssetPriceView {
  coin: Coin;
  product: string;
  bid: string;
  ask: string;
  mid: string;
  time: string;
}

export interface TradableAssetView {
  coin: Coin;
  symbol: string;
  name: string;
  glyph: string;
  product: string;
  price: AssetPriceView | null;
  priceError?: string;
}

export interface ProductsView {
  assets: TradableAssetView[];
}

export interface QuoteView {
  side: TradeSide;
  fromCoin: Coin;
  toCoin: Coin;
  pay: MoneyView;
  receive: MoneyView;
  unitPrice: string;
  usdValue: MoneyView;
  priceTime: string;
}

export interface TradeRecordView {
  id: string;
  side: TradeSide;
  fromCoin: Coin;
  toCoin: Coin;
  paid: MoneyView;
  received: MoneyView;
  unitPrice: string;
  usdValue: MoneyView;
  bitgoOrderId?: string;
  bitgoStatus?: string;
  createdAt: string;
}

export type TradeOutcomeView =
  | { outcome: 'filled'; trade: TradeRecordView }
  | { outcome: 'failed'; step: 'quote' | 'settle'; message: string; source?: 'bitgo' | 'app' };

export interface PortfolioEntryView {
  coin: Coin;
  symbol: string;
  name: string;
  glyph: string;
  amount: MoneyView;
  usdValue: MoneyView;
  price: string | null;
}

export interface PortfolioView {
  entries: PortfolioEntryView[];
  totalUsd: MoneyView;
  trades: TradeRecordView[];
}
