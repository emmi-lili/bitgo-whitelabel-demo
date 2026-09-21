// components/ui.tsx — primitivas presentacionales + los 4 estados (UI.md §4).
import type { ReactNode } from 'react';
import { formatMoneyValue } from '@/lib/domain/money';
import type { Coin } from '@/lib/domain/assets';
import type { ApiError, ApiState } from './useApi';

export function uiSymbol(coin: Coin): string {
  return coin === 'ofctusd' ? '$' : '';
}

/** Monto en mono tabular-nums. 'in' verde con '+', 'out' con '-', ambos en --ink
 *  salvo el ingreso (UI.md §1: los egresos NO son rojos). */
export function Amount({
  value,
  coin = 'ofctusd',
  direction,
  className,
}: {
  value: string;
  coin?: Coin;
  direction?: 'in' | 'out';
  className?: string;
}) {
  const sign = direction === 'in' ? '+' : direction === 'out' ? '-' : '';
  return (
    <span className={`mono ${className ?? ''}`} data-dir={direction}>
      {sign}
      {formatMoneyValue(value, { symbol: uiSymbol(coin) })}
      {uiSymbol(coin) === '' ? ` ${coin.replace('ofct', '').toUpperCase()}` : ''}
    </span>
  );
}

/** "Simulated data" badge (constitution: no silent mocks). It goes next to any
 *  block whose data does not come from BitGo. */
export function MockBadge({ children = 'Simulado' }: { children?: ReactNode }) {
  return (
    <span className="badge badge-mock" title="Dato simulado, no proviene de BitGo">
      🟡 {children}
    </span>
  );
}

/** Circular glyph for an asset (we avoid images in the MVP). */
export function AssetGlyph({ glyph, coin }: { glyph: string; coin: Coin }) {
  return (
    <span className={`asset-glyph asset-${coin}`} aria-hidden>
      {glyph}
    </span>
  );
}

export function Card({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`card ${className ?? ''}`} style={style}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {action}
    </div>
  );
}

export function Badge({ kind, children }: { kind: 'pending' | 'active'; children: ReactNode }) {
  return <span className={`badge badge-${kind}`}>{children}</span>;
}

export function Skeleton({
  height = 16,
  width = '100%',
  radius = 8,
  style,
}: {
  height?: number;
  width?: number | string;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return <div className="skeleton" style={{ height, width, borderRadius: radius, ...style }} />;
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="state">
      <strong>{title}</strong>
      {children}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  const title =
    error.source === 'express' ? 'El servicio de firma no responde.' : 'No se pudo cargar.';
  return (
    <div className="state state-error">
      <strong>{title}</strong>
      {/* El mensaje de BitGo se muestra, no se reemplaza (UI.md §4). */}
      <pre>
        {error.message}
        {error.requestId ? `\nrequestId: ${error.requestId}` : ''}
      </pre>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry} style={{ marginTop: 8 }}>
          Reintentar
        </button>
      )}
    </div>
  );
}

/** Orquesta los 4 estados de un ApiState: loading → error → empty → data. */
export function Async<T>({
  state,
  skeleton,
  isEmpty,
  empty,
  children,
}: {
  state: ApiState<T>;
  skeleton: ReactNode;
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (state.loading) return <>{skeleton}</>;
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (state.data === undefined)
    return <ErrorState error={{ message: 'Sin datos.' }} onRetry={state.reload} />;
  if (isEmpty && empty && isEmpty(state.data)) return <>{empty}</>;
  return <>{children(state.data)}</>;
}
