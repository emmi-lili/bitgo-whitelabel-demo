'use client';
// 🟡 Presentación de los bloques MOCK. Cada uno lleva <MockBadge/> visible
// (constitución: sin mocks silenciosos). Los DATOS que renderizan NO viven acá:
// vienen de lib/mock/ (inventario único, separado de toda respuesta de BitGo).
import { Card } from './ui';
import { BALANCE_DELTA_MOCK, CARD_MOCK, SAVINGS_GOAL_MOCK } from '@/lib/mock';

export function DeltaChip() {
  return <span className="delta">{BALANCE_DELTA_MOCK.label}</span>;
}

export function PaymentCardVisual() {
  return (
    <div className="pay-card">
      <div className="row-between">
        <span style={{ fontWeight: 700 }}>{CARD_MOCK.brand}</span>
      </div>
      <div className="num mono">•••• •••• •••• {CARD_MOCK.last4}</div>
      <div className="row-between" style={{ fontSize: 12, opacity: 0.9 }}>
        <span>{CARD_MOCK.holder}</span>
        <span>{CARD_MOCK.expiry}</span>
      </div>
    </div>
  );
}

export function SavingsGoalCard() {
  const { label, emoji, saved, goal, accent } = SAVINGS_GOAL_MOCK;
  const pct = Math.min(100, Math.round((saved / goal) * 100));
  const size = 64;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  const remaining = Math.max(0, goal - saved);

  return (
    <div className="pocket-card" style={{ ['--pocket-accent' as string]: accent }}>
      <div className="pocket-main">
        <div
          className="pocket-ring"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${pct}% de la meta ${label}`}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
            <circle
              className="pocket-ring-track"
              cx={size / 2}
              cy={size / 2}
              r={r}
              strokeWidth={stroke}
              fill="none"
            />
            <circle
              className="pocket-ring-value"
              cx={size / 2}
              cy={size / 2}
              r={r}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={c}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </svg>
          <span className="pocket-emoji" aria-hidden>
            {emoji}
          </span>
        </div>

        <div className="pocket-body">
          <div className="pocket-label">{label}</div>
          <div className="pocket-amount mono">${saved.toLocaleString('en-US')}</div>
          <div className="pocket-meta">
            de ${goal.toLocaleString('en-US')} · {pct}%
          </div>
        </div>
      </div>

      <div className="pocket-footer">
        <span className="muted">Faltan ${remaining.toLocaleString('en-US')}</span>
        <button type="button" className="pocket-add" disabled title="Próximamente">
          Añadir
        </button>
      </div>
    </div>
  );
}

export function InfoTable({ rows, title }: { title: string; rows: Array<[string, string]> }) {
  return (
    <Card>
      <div className="row-between" style={{ marginBottom: 8 }}>
        <strong>{title}</strong>
      </div>
      <div className="info-table">
        {rows.map(([k, v]) => (
          <div className="info-row" key={k}>
            <span className="muted">{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function NoticeCard({ children }: { children: React.ReactNode }) {
  return (
    <Card style={{ background: 'var(--brand-subtle)', border: 'none' }}>
      <div className="row-between">
        <span style={{ fontWeight: 600 }}>{children}</span>
      </div>
    </Card>
  );
}

export function QuickActionGrid() {
  const items = [
    { icon: '💳', label: 'Pagar' },
    { icon: '⚙', label: 'Gestionar' },
    { icon: '⋯', label: 'Más' },
  ];
  return (
    <div className="quick-grid">
      {items.map((i) => (
        <button className="quick-item" key={i.label}>
          <span className="qi-icon" aria-hidden>
            {i.icon}
          </span>
          {i.label}
        </button>
      ))}
    </div>
  );
}
