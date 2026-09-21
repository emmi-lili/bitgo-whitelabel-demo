import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="header">
      <Link href="/" className="logo" style={{ color: 'inherit', textDecoration: 'none' }}>
        <span className="logo-mark" aria-hidden>
          BTSales
        </span>
        Bitgo Whitelabel
      </Link>
      <Link href="/profile" className="avatar" aria-label="Perfil" title="Perfil">
        E
      </Link>
    </header>
  );
}

export function Fab() {
  return (
    <Link href="/transfer" className="fab" aria-label="Transferir">
      +
    </Link>
  );
}
