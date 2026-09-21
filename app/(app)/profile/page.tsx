'use client';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { Badge, Card, SectionHeader } from '@/components/ui';
import { PROFILE_MOCK } from '@/lib/mock';

const DETAILS: Array<[string, string]> = [
  ['Email', PROFILE_MOCK.email],
  ['Teléfono', PROFILE_MOCK.phone],
  ['Rol', PROFILE_MOCK.role],
  ['Empresa', PROFILE_MOCK.enterprise],
  ['Zona horaria', PROFILE_MOCK.timezone],
  ['Miembro desde', PROFILE_MOCK.memberSince],
];

const MENU: Array<{ href: string; label: string; hint: string }> = [
  { href: '/account', label: 'Mi cuenta', hint: 'Balances y acciones' },
  { href: '/history', label: 'Historial', hint: 'Movimientos recientes' },
  { href: '/transfer', label: 'Transferir', hint: 'Enviar a otra cuenta' },
];

export default function ProfilePage() {
  const p = PROFILE_MOCK;

  return (
    <>
      <AppHeader />
      <h1 className="screen-title">Perfil</h1>

      {/* Hero de identidad */}
      <Card style={{ marginTop: 8, textAlign: 'center', padding: '24px 16px' }}>
        <div className="profile-avatar" aria-hidden>
          {p.initials}
        </div>
        <div style={{ fontWeight: 700, fontSize: 20, marginTop: 12 }}>{p.fullName}</div>
        <div className="muted" style={{ marginTop: 4 }}>
          {p.email}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
          <Badge kind="active">{p.status}</Badge>
          <span className="badge badge-role">{p.role}</span>
        </div>
      </Card>

      <SectionHeader title="Datos personales" />
      <Card>
        <div className="info-table">
          {DETAILS.map(([k, v]) => (
            <div className="info-row" key={k}>
              <span className="muted">{k}</span>
              <span style={{ textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>
                {v}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <SectionHeader title="Accesos rápidos" />
      <Card style={{ padding: '4px 8px' }}>
        {MENU.map((item) => (
          <Link key={item.href} href={item.href} className="profile-row">
            <span>
              <strong style={{ display: 'block', fontWeight: 600 }}>{item.label}</strong>
              <span className="muted">{item.hint}</span>
            </span>
            <span className="muted" aria-hidden>
              →
            </span>
          </Link>
        ))}
      </Card>

      <div style={{ marginTop: 24, marginBottom: 8 }}>
        <button type="button" className="btn btn-secondary btn-block" disabled title="Próximamente">
          Cerrar sesión
        </button>
        <p className="muted" style={{ textAlign: 'center', marginTop: 8, fontSize: 12 }}>
          El cierre de sesión llega en una fase posterior.
        </p>
      </div>
    </>
  );
}
