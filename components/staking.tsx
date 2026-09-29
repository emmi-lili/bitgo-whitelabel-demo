'use client';
// Dashboard entry point for staking (DeFi). REAL APR from BitGo Go-Staking, DEMO
// settlement (badged). Links to the full /stake screen.
import Link from 'next/link';
import { Async, Card, MockBadge, Skeleton } from '@/components/ui';
import { useApi } from '@/components/useApi';
import { formatMoneyValue } from '@/lib/domain/money';
import type { StakingView } from '@/components/types';

export function StakingCard() {
  const staking = useApi<StakingView>('/api/staking');
  return (
    <Async
      state={staking}
      skeleton={<Skeleton height={92} radius={16} />}
    >
      {(view) => {
        const { position } = view;
        const staked = formatMoneyValue(position.staked.value);
        const isStaking = /[1-9]/.test(position.staked.value);
        return (
          <Link href="/stake" className="stake-card" aria-label="Ir a staking">
            <Card>
              <div className="row-between">
                <span style={{ fontWeight: 600 }}>Staking · Ganá {position.symbol}</span>
                <span className="stake-apr mono">
                  {formatMoneyValue(position.rate.apr)}% APR{' '}
                  {position.rate.isReal ? null : <MockBadge>demo</MockBadge>}
                </span>
              </div>
              <p className="muted" style={{ margin: '6px 0 0', fontSize: 13 }}>
                {isStaking
                  ? `Tenés ${staked} ${position.symbol} en staking acumulando recompensas.`
                  : `Poné tu ${position.symbol} a rendir a la tasa real de BitGo.`}
              </p>
            </Card>
          </Link>
        );
      }}
    </Async>
  );
}
