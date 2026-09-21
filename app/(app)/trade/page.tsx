'use client';
// Trading screen: Buy / Sell / Swap. REAL BitGo prices (level1), DEMO settlement
// (visible badge). The quote is recomputed live as you type.
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { AssetGlyph, Card, MockBadge } from '@/components/ui';
import { useApi, fetchJson } from '@/components/useApi';
import { formatMoneyValue, sanitizeDecimalInput } from '@/lib/domain/money';
import { assetOf, isCoin, type Coin } from '@/lib/domain/assets';
import type {
  PortfolioView,
  ProductsView,
  QuoteView,
  TradeOutcomeView,
  TradeSide,
} from '@/components/types';

const CRYPTOS: Coin[] = ['ofctbtc', 'ofcteth', 'ofctsol', 'ofctusdc'];
const nonZero = (s: string) => /[1-9]/.test(s);
const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;

function TradeInner() {
  const params = useSearchParams();

  const rawSide = params.get('side');
  const initialSide: TradeSide = rawSide === 'sell' || rawSide === 'swap' ? rawSide : 'buy';
  const initialCoin = (() => {
    const c = params.get('coin');
    return c && isCoin(c) && c !== 'ofctusd' ? c : 'ofctbtc';
  })();

  const [side, setSide] = useState<TradeSide>(initialSide);
  const [coin, setCoin] = useState<Coin>(initialCoin);
  const [toCoin, setToCoin] = useState<Coin>(initialCoin === 'ofctsol' ? 'ofctbtc' : 'ofctsol');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<QuoteView | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState(newId());
  const [view, setView] = useState<'form' | 'submitting' | 'result'>('form');
  const [outcome, setOutcome] = useState<TradeOutcomeView | null>(null);

  const products = useApi<ProductsView>('/api/trading/products');
  const portfolio = useApi<PortfolioView>('/api/trading/portfolio');

  // The asset whose amount you type: on buy it's USD; on sell/swap, the source crypto.
  const inputCoin: Coin = side === 'buy' ? 'ofctusd' : coin;
  const inputSymbol = assetOf(inputCoin).symbol;

  const available = useMemo(() => {
    const e = portfolio.data?.entries.find((x) => x.coin === inputCoin);
    return e?.amount.value ?? null;
  }, [portfolio.data, inputCoin]);

  // ── Live quote (debounced) ─────────────────────────────────────────────────
  useEffect(() => {
    if (view !== 'form') return;
    if (!nonZero(amount)) {
      setQuote(null);
      setQuoteError(null);
      return;
    }
    if (side === 'swap' && toCoin === coin) {
      setQuote(null);
      setQuoteError('Elegí dos activos distintos para el swap.');
      return;
    }
    const ctrl = new AbortController();
    setQuoting(true);
    const t = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ side, coin, amount });
        if (side === 'swap') qs.set('toCoin', toCoin);
        const { ok, body } = await fetchJson<QuoteView & { error?: string }>(
          `/api/trading/quote?${qs.toString()}`,
          { signal: ctrl.signal },
        );
        if (!ok) {
          setQuote(null);
          setQuoteError(body?.error ?? 'No se pudo cotizar.');
        } else {
          setQuote(body);
          setQuoteError(null);
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setQuoteError('No se pudo cotizar.');
      } finally {
        setQuoting(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [side, coin, toCoin, amount, view]);

  function switchSide(s: TradeSide) {
    setSide(s);
    setAmount('');
    setQuote(null);
    setQuoteError(null);
  }

  function setMax() {
    if (available) setAmount(available);
  }

  async function submit() {
    if (view === 'submitting' || !quote) return;
    setView('submitting');
    try {
      const { body } = await fetchJson<TradeOutcomeView>('/api/trading/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          side,
          coin,
          toCoin: side === 'swap' ? toCoin : undefined,
          amount,
          orderId,
        }),
      });
      setOutcome(body);
      setView('result');
    } catch {
      setOutcome({
        outcome: 'failed',
        step: 'settle',
        message: 'Sin conexión. Intentá de nuevo.',
        source: 'app',
      });
      setView('result');
    }
  }

  function reset() {
    setOrderId(newId());
    setAmount('');
    setQuote(null);
    setOutcome(null);
    setView('form');
    portfolio.reload();
  }

  const receiveSymbol = quote
    ? assetOf(quote.toCoin).symbol
    : side === 'buy'
      ? assetOf(coin).symbol
      : side === 'sell'
        ? 'USD'
        : assetOf(toCoin).symbol;

  const canSubmit = view === 'form' && !!quote && !quoteError && !quoting;

  return (
    <>
      <AppHeader />
      <div className="row-between" style={{ alignItems: 'baseline' }}>
        <h1 className="screen-title" style={{ marginBottom: 8 }}>
          Operar
        </h1>
        <Link href="/" className="link">
          Cerrar
        </Link>
      </div>

      <div style={{ marginBottom: 12 }}>
        <MockBadge>Precios reales de BitGo · liquidación simulada (testnet)</MockBadge>
      </div>

      {view === 'result' ? (
        <ResultCard
          outcome={outcome!}
          onDone={reset}
          onRetry={() => setView('form')}
          receiveSymbol={receiveSymbol}
        />
      ) : (
        <>
          {/* Buy / Sell / Swap tabs */}
          <div className="segmented" role="tablist">
            {(['buy', 'sell', 'swap'] as TradeSide[]).map((s) => (
              <button key={s} role="tab" data-active={side === s} onClick={() => switchSide(s)}>
                {s === 'buy' ? 'Comprar' : s === 'sell' ? 'Vender' : 'Swap'}
              </button>
            ))}
          </div>

          <Card style={{ marginTop: 12 }}>
            {/* Asset selector (for swap: the SOURCE asset) */}
            <div className="label" style={{ marginBottom: 8 }}>
              {side === 'buy' ? 'Comprar' : side === 'sell' ? 'Vender' : 'Cambiar desde'}
            </div>
            <AssetChips
              selected={coin}
              onSelect={setCoin}
              exclude={side === 'swap' ? toCoin : undefined}
            />

            {/* Amount */}
            <div className="field" style={{ marginTop: 16 }}>
              <div className="row-between">
                <span className="label">Monto ({inputSymbol})</span>
                {available !== null && (
                  <button type="button" className="link" onClick={setMax} disabled={side === 'buy'}>
                    Disp: {formatMoneyValue(available)} {inputSymbol}
                    {side !== 'buy' ? ' · Max' : ''}
                  </button>
                )}
              </div>
              <input
                className="field-control field-control-lg mono"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(sanitizeDecimalInput(e.target.value))}
                placeholder="0.00"
                aria-label={`Monto en ${inputSymbol}`}
              />
            </div>

            {/* Swap: the DESTINATION asset */}
            {side === 'swap' && (
              <>
                <div className="label" style={{ margin: '4px 0 8px' }}>
                  Cambiar a
                </div>
                <AssetChips selected={toCoin} onSelect={setToCoin} exclude={coin} />
              </>
            )}

            {/* Live quote */}
            <QuoteLine
              quoting={quoting}
              quote={quote}
              quoteError={quoteError}
              receiveSymbol={receiveSymbol}
              hasAmount={nonZero(amount)}
            />
          </Card>

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={submit}
              disabled={!canSubmit}
            >
              {view === 'submitting'
                ? 'Procesando…'
                : side === 'buy'
                  ? `Comprar ${assetOf(coin).symbol}`
                  : side === 'sell'
                    ? `Vender ${assetOf(coin).symbol}`
                    : `Cambiar a ${assetOf(toCoin).symbol}`}
            </button>
          </div>
        </>
      )}
    </>
  );
}

function AssetChips({
  selected,
  onSelect,
  exclude,
}: {
  selected: Coin;
  onSelect: (c: Coin) => void;
  exclude?: Coin;
}) {
  return (
    <div className="chips">
      {CRYPTOS.filter((c) => c !== exclude).map((c) => {
        const meta = assetOf(c);
        return (
          <button
            key={c}
            className="chip chip-asset"
            data-active={selected === c}
            onClick={() => onSelect(c)}
          >
            <AssetGlyph glyph={meta.glyph} coin={c} />
            {meta.symbol}
          </button>
        );
      })}
    </div>
  );
}

function QuoteLine({
  quoting,
  quote,
  quoteError,
  receiveSymbol,
  hasAmount,
}: {
  quoting: boolean;
  quote: QuoteView | null;
  quoteError: string | null;
  receiveSymbol: string;
  hasAmount: boolean;
}) {
  return (
    <div className="quote-line">
      {quoteError ? (
        <span style={{ color: '#b91c1c' }}>{quoteError}</span>
      ) : !hasAmount ? (
        <span className="muted">Ingresá un monto para ver la cotización.</span>
      ) : quoting && !quote ? (
        <span className="muted">Cotizando al precio de mercado…</span>
      ) : quote ? (
        <>
          <div className="row-between">
            <span className="muted">Recibís aprox.</span>
            <span className="mono" style={{ fontWeight: 700, fontSize: 18 }}>
              {formatMoneyValue(quote.receive.value)} {receiveSymbol}
            </span>
          </div>
          <div className="row-between" style={{ marginTop: 4 }}>
            <span className="muted" style={{ fontSize: 12 }}>
              Precio
            </span>
            <span className="mono muted" style={{ fontSize: 12 }}>
              1 {assetOf(quote.side === 'buy' ? quote.toCoin : quote.fromCoin).symbol} ={' '}
              {formatMoneyValue(quote.unitPrice, { symbol: '$' })}
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}

function ResultCard({
  outcome,
  onDone,
  onRetry,
  receiveSymbol,
}: {
  outcome: TradeOutcomeView;
  onDone: () => void;
  onRetry: () => void;
  receiveSymbol: string;
}) {
  if (outcome.outcome === 'filled') {
    const t = outcome.trade;
    const sideLabel = t.side === 'buy' ? 'Compra' : t.side === 'sell' ? 'Venta' : 'Swap';
    return (
      <Card style={{ marginTop: 8, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>✓</div>
        <h2 style={{ margin: '4px 0 2px', fontSize: 18 }}>{sideLabel} completada</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Recibiste
        </p>
        <div className="hero-amount mono" style={{ fontSize: 30 }}>
          {formatMoneyValue(t.received.value)} {receiveSymbol}
        </div>
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          Entregaste {formatMoneyValue(t.paid.value)}{' '}
          {t.paid.coin.replace('ofct', '').toUpperCase()} · precio{' '}
          {formatMoneyValue(t.unitPrice, { symbol: '$' })}
        </p>
        <button
          type="button"
          className="btn btn-primary btn-block"
          style={{ marginTop: 12 }}
          onClick={onDone}
        >
          Listo
        </button>
      </Card>
    );
  }
  return (
    <Card style={{ marginTop: 8 }}>
      <h2 style={{ marginTop: 0, fontSize: 18 }}>✕ No se pudo completar</h2>
      <p className="muted">Falló al {outcome.step === 'quote' ? 'cotizar' : 'liquidar'}.</p>
      <pre
        className="mono"
        style={{ whiteSpace: 'pre-wrap', color: '#b91c1c', fontSize: 12, margin: '8px 0 16px' }}
      >
        {outcome.message}
      </pre>
      <div className="action-pair" style={{ marginTop: 0 }}>
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Volver
        </button>
        <button type="button" className="btn btn-secondary" onClick={onDone}>
          Cerrar
        </button>
      </div>
    </Card>
  );
}

export default function TradePage() {
  return (
    <Suspense fallback={<div className="state">Cargando…</div>}>
      <TradeInner />
    </Suspense>
  );
}
