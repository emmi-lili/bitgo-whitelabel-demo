import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="header">
      <Link href="/" className="logo" style={{ color: 'inherit', textDecoration: 'none' }}>
        <span className="logo-mark" aria-hidden>
          B
        </span>
        Bitgo
      </Link>
      <Link href="/profile" className="avatar" aria-label="Perfil" title="Perfil">
        E
      </Link>
    </header>
  );
}
