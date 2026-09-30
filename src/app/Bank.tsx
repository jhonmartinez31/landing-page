import { useEffect, useState } from 'react';
import { listLandings, type Landing } from '../storage/db.ts';
import { formatDate } from './format.ts';
import { href } from './route.ts';
import { Thumb } from './Thumb.tsx';
import { LogoIcon } from './Chat.tsx';

// Banco de landings: una tarjeta con miniatura por cada landing generada, la más reciente primero.
export function Bank() {
  const [landings, setLandings] = useState<Landing[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listLandings()
      .then(setLandings)
      .catch((e: Error) => setError(`No se pudo leer el banco: ${e.message}`));
  }, []);

  return (
    <main className="shell wide">
      <header className="top">
        <a href={href({ name: 'chat' })} className="brand-link">
          <LogoIcon />
          <div className="brand-info">
            <span className="brand-name">AuraLanding</span>
            <span className="brand-badge">AI Studio</span>
          </div>
        </a>
        <div className="top-actions">
          <a className="btn btn-primary btn-icon" href={href({ name: 'chat' })}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Nueva landing</span>
          </a>
        </div>
      </header>

      <section className="bank">
        <h2>Mis landings</h2>
        {error && <p className="error">{error}</p>}
        {landings === null && !error && <p className="status">Cargando…</p>}
        {landings?.length === 0 && (
          <div className="empty">
            <p>Aún no hay landings. Las que construyas aparecerán aquí automáticamente.</p>
          </div>
        )}
        {landings && landings.length > 0 && (
          <ul className="bank-grid">
            {landings.map((l) => (
              <li key={l.id}>
                <a className="bank-card" href={href({ name: 'landing', id: l.id })}>
                  <Thumb html={l.html} title={l.title} />
                  <span className="bank-card-body">
                    <strong>{l.title}</strong>
                    <span className="bank-card-idea">{l.idea}</span>
                    <span className="bank-card-meta">
                      {formatDate(l.updatedAt)}
                      {l.by && ` · ${l.by.model}`}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
