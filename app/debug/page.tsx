'use client';
// Visor crudo del BFF (Fase 2). Fuera del shell, sin estética. Útil para verificar.
import { useEffect, useState } from 'react';

function Block({ title, path }: { title: string; path: string }) {
  const [out, setOut] = useState<string>('cargando…');
  useEffect(() => {
    fetch(path)
      .then(async (r) => setOut(`${r.status}\n${JSON.stringify(await r.json(), null, 2)}`))
      .catch((e) => setOut(String(e)));
  }, [path]);
  return (
    <section style={{ marginBottom: 24 }}>
      <h2>
        {title} <code>{path}</code>
      </h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{out}</pre>
    </section>
  );
}

export default function DebugPage() {
  return (
    <main style={{ fontFamily: 'monospace', padding: 16 }}>
      <h1>Bitgo Whitelabel — debug</h1>
      <Block title="Balances" path="/api/balance" />
      <Block title="Transacciones" path="/api/transactions?limit=25" />
      <Block title="Direcciones" path="/api/addresses" />
    </main>
  );
}
