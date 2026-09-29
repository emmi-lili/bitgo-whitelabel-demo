'use client';
// Staking screen (DeFi). REAL reward rate (APR) from BitGo Go-Staking, DEMO
// settlement in the local ledger (visible badge). Stake/unstake SOL and watch the
// position accrue rewards at the real rate.
import { useMemo, useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { AssetGlyph, Async, Card, MockBadge, Skeleton } from '@/components/ui';
import { useApi, fetchJson } from '@/components/useApi';
import { formatMoneyValue, sanitizeDecimalInput } from '@/lib/domain/money';
import { assetOf } from '@/lib/domain/assets';
import type { StakingView, StakeOutcomeView } from '@/components/types';

type Action = 'stake' | 'unstake';
const nonZero = (s: string) => /[1-9]/.test(s);

export default function StakePage() {
  const staking = useApi<StakingView>('/api/staking');

  return (
    <>
      <AppHeader />
      <h1 className="screen-title" style={{ marginBottom: 8 }}>
        Staking
      </h1>
      <div style={{ marginBottom: 12 }}>
        <MockBadge>Rendimiento real de BitGo · staking simulado (testnet)</MockBadge>
      </div>

      <Async
        state={staking}
        skeleton={
          <div className="stack">
            <Skeleton height={120} />
            <Skeleton height={220} />
          </div>
        }
      >
        {(view) => <StakeInner view={view} reload={staking.reload} />}
      </Async>
    </>
  );
}

function StakeInner({ view, reload }: { view: StakingView; reload: () => void }) {
  const { position, available } = view;
  const meta = assetOf(position.coin);

  const [action, setAction] = useState<Action>('stake');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<StakeOutcomeView | null>(null);

  // Stake spends the liquid balance; unstake draws from the staked amount.
  const max = action === 'stake' ? available.value : position.staked.value;
  const hasStake = nonZero(position.staked.value);

  const canSubmit = useMemo(() => {
    if (submitting || !nonZero(amount)) return false;
    return true;
  }, [submitting, amount]);

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setOutcome(null);
    try {
      const { body } = await fetchJson<StakeOutcomeView>('/api/staking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, coin: position.coin, amount }),
      });
      setOutcome(body);
      if (body.outcome === 'done') {
        setAmount('');
        reload();
      }
    } catch {
      setOutcome({ outcome: 'failed', message: 'Sin conexión. Intentá de nuevo.', source: 'app' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* ── Position: staked + rewards, valued at the real APR ──────────────── */}
      <Card>
        <div className="row-between">
          <span className="stake-asset">
            <AssetGlyph glyph={meta.glyph} coin={position.coin} />
            {meta.name}
          </span>
          <span className="stake-apr">
            {formatMoneyValue(position.rate.apr)}% APR{' '}
            {position.rate.isReal ? (
              <span className="badge badge-active" title="Tasa real de BitGo">
                real
              </span>
            ) : (
              <MockBadge>demo</MockBadge>
            )}
          </span>
        </div>

        <div className="stake-figures" style={{ marginTop: 12 }}>
          <div>
            <div className="label">En staking</div>
            <div className="hero-amount mono" style={{ fontSize: 24 }}>
              {formatMoneyValue(position.staked.value)} {meta.symbol}
            </div>
          </div>
          <div>
            <div className="label">Recompensas</div>
            <div
              className="mono"
              style={{ fontSize: 24, fontWeight: 700, color: 'var(--positive)' }}
            >
              +{formatMoneyValue(position.rewards.value)} {meta.symbol}
            </div>
          </div>
        </div>
        {hasStake && (
          <p className="muted" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
            Las recompensas se acumulan a la tasa real; se liberan a tu saldo al hacer unstake.
          </p>
        )}
      </Card>

      {/* ── Stake / Unstake ─────────────────────────────────────────────────── */}
      <div className="segmented" role="tablist" style={{ marginTop: 16 }}>
        {(['stake', 'unstake'] as Action[]).map((a) => (
          <button
            key={a}
            role="tab"
            aria-selected={action === a}
            data-active={action === a}
            onClick={() => {
              setAction(a);
              setAmount('');
              setOutcome(null);
            }}
          >
            {a === 'stake' ? 'Stake' : 'Unstake'}
          </button>
        ))}
      </div>

      <Card style={{ marginTop: 12 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <div className="row-between">
            <span className="label">Monto ({meta.symbol})</span>
            <button type="button" className="link" onClick={() => setAmount(max)}>
              {action === 'stake' ? 'Disp' : 'En staking'}: {formatMoneyValue(max)} {meta.symbol} ·
              Max
            </button>
          </div>
          <input
            className="field-control field-control-lg mono"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(sanitizeDecimalInput(e.target.value))}
            placeholder="0.000000000"
            aria-label={`Monto en ${meta.symbol}`}
          />
        </div>
      </Card>

      {outcome && outcome.outcome === 'failed' && (
        <p className="mono" style={{ color: 'var(--negative)', fontSize: 12, marginTop: 12 }}>
          {outcome.message}
        </p>
      )}
      {outcome && outcome.outcome === 'done' && (
        <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
          {outcome.action === 'stake' ? 'Stakeaste' : 'Recuperaste'}{' '}
          {formatMoneyValue(outcome.moved.value)} {meta.symbol}.
        </p>
      )}

      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={submit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <>
              <span className="spinner" /> Procesando…
            </>
          ) : action === 'stake' ? (
            `Stake ${meta.symbol}`
          ) : (
            `Unstake ${meta.symbol}`
          )}
        </button>
      </div>
    </>
  );
}
