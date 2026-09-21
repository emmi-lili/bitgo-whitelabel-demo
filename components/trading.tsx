'use client';
// Trading components: market list (REAL live prices) and portfolio (DEMO balances
// valued at the real price). The demo badge goes wherever it belongs.
import { useRouter } from 'next/navigation';
import { formatMoneyValue } from '@/lib/domain/money';
import { AssetGlyph } from './ui';
import type { PortfolioEntryView, TradableAssetView, TradeRecordView } from './types';

function fmtUsd(v: string): string {
  return formatMoneyValue(v, { symbol: '$' });
}

/** A market asset row, with its live mid price. Tap → buy. */
export function MarketRow({ asset }: { asset: TradableAssetView }) {
  const router = useRouter();
  return (
    <button
      className="tx-row"
      aria-label={`Comprar ${asset.name}`}
      onClick={() => router.push(`/trade?side=buy&coin=${asset.coin}`)}
    >
      <AssetGlyph glyph={asset.glyph} coin={asset.coin} />
      <span className="tx-body">
        <span className="tx-title">{asset.name}</span>
        <span className="tx-sub">{asset.symbol}</span>
      </span>
      <span style={{ textAlign: 'right' }}>
        {asset.price ? (
          <span className="mono" style={{ fontWeight: 600 }}>
            {fmtUsd(asset.price.mid)}
          </span>
        ) : (
          <span className="muted" style={{ fontSize: 12 }}>
            sin precio
          </span>
        )}
      </span>
    </button>
  );
}

export function MarketList({ assets }: { assets: TradableAssetView[] }) {
  return (
    <div>
      {assets.map((a) => (
        <MarketRow key={a.coin} asset={a} />
      ))}
    </div>
  );
}

/** Portfolio row: holding + USD valuation. */
export function PortfolioRow({ entry }: { entry: PortfolioEntryView }) {
  const router = useRouter();
  const isUsd = entry.coin === 'ofctusd';
  return (
    <button
      className="tx-row"
      aria-label={isUsd ? 'Comprar con tu saldo en USD' : `Vender ${entry.name}`}
      onClick={() =>
        router.push(isUsd ? '/trade?side=buy&coin=ofctbtc' : `/trade?side=sell&coin=${entry.coin}`)
      }
    >
      <AssetGlyph glyph={entry.glyph} coin={entry.coin} />
      <span className="tx-body">
        <span className="tx-title">{entry.name}</span>
        <span className="tx-sub mono">
          {formatMoneyValue(entry.amount.value)} {entry.symbol}
        </span>
      </span>
      <span className="mono" style={{ fontWeight: 600 }}>
        {fmtUsd(entry.usdValue.value)}
      </span>
    </button>
  );
}

export function PortfolioList({ entries }: { entries: PortfolioEntryView[] }) {
  // We don't show zero holdings (except USD, which is the cash balance).
  const visible = entries.filter(
    (e) => e.coin === 'ofctusd' || !/^0*(\.0*)?$/.test(e.amount.value),
  );
  return (
    <div>
      {visible.map((e) => (
        <PortfolioRow key={e.coin} entry={e} />
      ))}
    </div>
  );
}

const SIDE_LABEL: Record<TradeRecordView['side'], string> = {
  buy: 'Compra',
  sell: 'Venta',
  swap: 'Swap',
};

/** Row of an already-settled trade (demo). */
export function TradeRow({ trade }: { trade: TradeRecordView }) {
  const recvSym = trade.received.coin.replace('ofct', '').toUpperCase();
  const paidSym = trade.paid.coin.replace('ofct', '').toUpperCase();
  const d = new Date(trade.createdAt);
  const when = Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('es', { day: '2-digit', month: 'short' });
  return (
    <div className="tx-row" style={{ cursor: 'default' }}>
      <span
        className="tx-icon"
        style={{ background: 'var(--cat-blue)', color: 'var(--cat-blue-ink)' }}
        aria-hidden
      >
        {trade.side === 'swap' ? '⇄' : trade.side === 'buy' ? '↓' : '↑'}
      </span>
      <span className="tx-body">
        <span className="tx-title">
          {SIDE_LABEL[trade.side]} {recvSym}
        </span>
        <span className="tx-sub">{when}</span>
      </span>
      <span className="mono" style={{ fontWeight: 600, textAlign: 'right' }}>
        +{formatMoneyValue(trade.received.value)} {recvSym}
        <br />
        <span className="muted" style={{ fontSize: 11, fontWeight: 400 }}>
          −{formatMoneyValue(trade.paid.value)} {paidSym}
        </span>
      </span>
    </div>
  );
}
