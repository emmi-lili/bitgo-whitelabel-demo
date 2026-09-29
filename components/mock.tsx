'use client';
// 🟡 Presentación de los bloques MOCK. Cada uno lleva <MockBadge/> visible
// (constitución: sin mocks silenciosos). Los DATOS que renderizan NO viven acá:
// vienen de lib/mock/ (inventario único, separado de toda respuesta de BitGo).
import { BALANCE_DELTA_MOCK, SAVINGS_GOAL_MOCK } from '@/lib/mock';

export function DeltaChip() {
  return <span className="delta">{BALANCE_DELTA_MOCK.label}</span>;
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
