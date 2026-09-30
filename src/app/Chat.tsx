import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { generateLanding, generateMasterPrompt, recommendTechniques, reviewLanding } from '../engine/flow.ts';
import { TECHNIQUES, type Recommendation, type TechniqueId } from '../engine/techniques.ts';
import { getHealth, type Health, type ModelChoice } from '../providers/client.ts';
import { ModelPicker, choiceKey, parseChoice } from './ModelPicker.tsx';
import { getLanding, newId, saveLanding, titleFor, type ChatEntry } from '../storage/db.ts';
import { downloadHtml, fileNameFor } from './download.ts';
import { href, navigate } from './route.ts';

const CHOICE_STORAGE_KEY = 'auralanding.model';

const PROMPT_TEMPLATES = [
  {
    badge: 'B2B SaaS',
    title: 'Automatización & Analítica IA',
    description: 'Prueba gratuita de 14 días y calculadora de ROI para CFOs',
    prompt: 'Landing page para un software SaaS de automatización contable con IA para pymes; con prueba gratis de 14 días sin tarjeta de crédito, calculadora interactiva de ahorro de tiempo y testimonios de directores financieros.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    badge: 'Salud & Wellness',
    title: 'Estudio de Yoga & Mindfulness',
    description: 'Reserva de clase de cortesía vía WhatsApp directo',
    prompt: 'Landing moderna, serena y minimalista para un estudio de yoga y meditación en Medellín; llamada a la acción clara para reservar la primera clase de cortesía directamente por WhatsApp con cupos limitados.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    ),
  },
  {
    badge: 'Fintech',
    title: 'App Móvil de Microinversión',
    description: 'Lista de espera VIP con recompensas de prelanzamiento',
    prompt: 'Landing de alta conversión para una aplicación móvil de microinversión automática en fondos indexados; objetivo principal: registro en la lista de espera VIP con beneficios exclusivos para los primeros 1.000 usuarios.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  {
    badge: 'Gastronomía',
    title: 'Café de Especialidad & Catas',
    description: 'Suscripción mensual y reserva de experiencias sensoriales',
    prompt: 'Landing para una cafetería de especialidad y tostaduría artesanal; quiero destacar el menú de temporada, catálogo de suscripción mensual de café en grano a domicilio y reserva de catas sensoriales.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    badge: 'LegalTech',
    title: 'Consultoría para Startups',
    description: 'Diagnóstico estratégico de 30 min sin coste',
    prompt: 'Landing corporativa de alto impacto para una firma de consultoría legal, fiscal y de rondas de inversión para startups tecnológicas; llamada a la acción para agendar una sesión de diagnóstico estratégico de 30 minutos.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    badge: 'E-Learning',
    title: 'Bootcamp Intensivo de IA',
    description: 'Plan de estudios interactivo y becas tempranas',
    prompt: 'Landing persuasiva para un programa intensivo de 8 semanas en ingeniería de IA aplicada y agentes autónomos; con desglose modular de temas, testimonios de graduados y formulario de postulación a becas tempranas.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
];

export function LogoIcon() {
  return (
    <svg className="brand-logo" width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="auraBrandGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4f46e5" />
          <stop offset="0.5" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="10" fill="url(#auraBrandGrad)" />
      <path d="M16 6L20 13H12L16 6Z" fill="#ffffff" fillOpacity="0.95" />
      <path d="M22 15L26 22H18L22 15Z" fill="#ffffff" fillOpacity="0.8" />
      <path d="M10 15L14 22H6L10 15Z" fill="#ffffff" fillOpacity="0.8" />
      <circle cx="16" cy="18" r="2.5" fill="#38bdf8" />
    </svg>
  );
}

function readStoredChoice(): string | null {
  try {
    return localStorage.getItem(CHOICE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeChoice(choice: ModelChoice) {
  try {
    localStorage.setItem(CHOICE_STORAGE_KEY, choiceKey(choice));
  } catch {
    // Sin almacenamiento (modo privado): la elección dura solo esta sesión.
  }
}

// Recupera la última elección si sigue disponible; prioriza Gemini si está configurado para velocidad.
function initialChoice(health: Health): ModelChoice | null {
  const defaultP = health.providers.find((p) => p.id === health.defaultProvider) ?? health.providers[0];
  const stored = readStoredChoice();
  if (stored) {
    const c = parseChoice(stored);
    // Si el usuario tenía guardado openrouter pero gemini está como default rápido, preferimos gemini
    if (health.defaultProvider === 'gemini' && c.provider === 'openrouter') {
      return defaultP ? { provider: defaultP.id, model: defaultP.model } : null;
    }
    if (health.providers.some((p) => p.id === c.provider && p.models.some((m) => m.id === c.model))) return c;
  }
  return defaultP ? { provider: defaultP.id, model: defaultP.model } : null;
}

// Idea -> elegir técnicas (3 recomendadas) -> prompt maestro editable -> landing en un iframe aislado.
type Phase = 'idle' | 'recommending' | 'choosing' | 'prompting' | 'prompt' | 'building' | 'reviewing' | 'done';

// El chat sigue montado (oculto) mientras se ve el banco o el editor, para no perder una generación en curso.
export function Chat({ active }: { active: boolean }) {
  const [health, setHealth] = useState<Health | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [draft, setDraft] = useState('');
  const [idea, setIdea] = useState('');
  const [recommended, setRecommended] = useState<Recommendation[]>([]);
  const [recommendedBy, setRecommendedBy] = useState<Origin | null>(null);
  const [selected, setSelected] = useState<TechniqueId[]>([]);
  // Técnicas con las que se escribió el prompt maestro actual.
  const [promptTechniques, setPromptTechniques] = useState<TechniqueId[]>([]);
  const [masterPrompt, setMasterPrompt] = useState('');
  const [html, setHtml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [choice, setChoice] = useState<ModelChoice | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  // Quién generó cada paso, para avisar si respondió un respaldo en vez del modelo elegido.
  const [promptBy, setPromptBy] = useState<Origin | null>(null);
  const [htmlBy, setHtmlBy] = useState<Origin | null>(null);
  // Descarta respuestas que llegan después de "Nueva idea" y cancela la petición en curso.
  const runId = useRef(0);
  const abort = useRef<AbortController | null>(null);
  // La landing de esta conversación en el banco, y el prompt tal como lo escribió el modelo (para el historial).
  const [savedId, setSavedId] = useState<string | null>(null);
  const ideaAt = useRef(0);
  const generatedPrompt = useRef<ChatEntry | null>(null);

  useEffect(() => {
    getHealth()
      .then((h) => {
        setHealth(h);
        setChoice(initialChoice(h));
      })
      .catch((e: Error) => setHealthError(e.message));
  }, []);

  // Al volver del editor, mostrar el código editado.
  useEffect(() => {
    if (!active || !savedId) return;
    let stale = false;
    void getLanding(savedId).then((l) => {
      if (!stale && l) setHtml(l.html);
    });
    return () => {
      stale = true;
    };
  }, [active, savedId]);

  const busy = phase === 'recommending' || phase === 'prompting' || phase === 'building' || phase === 'reviewing';
  const started = phase !== 'idle';

  // Contador de segundos transcurridos durante la generación
  useEffect(() => {
    if (!busy) {
      setElapsed(0);
      return;
    }
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [busy]);

  async function run<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T | undefined> {
    const id = ++runId.current;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setError(null);
    try {
      const result = await fn(controller.signal);
      return id === runId.current ? result : undefined;
    } catch (e) {
      if (id === runId.current && !controller.signal.aborted) setError((e as Error).message);
      return undefined;
    }
  }

  async function sendIdea(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setIdea(clean);
    ideaAt.current = Date.now();
    setDraft('');
    setHtml('');
    setPhase('recommending');
    const result = await run((signal) => recommendTechniques(clean, choice ?? undefined, signal));
    if (result === undefined) {
      setPhase('idle');
      setDraft(clean);
      return;
    }
    setRecommended(result.value);
    setSelected(result.value.map((r) => r.id));
    setRecommendedBy({ by: result, asked: choice });
    if (result.fallback) setError('El modelo no devolvió una recomendación válida: te propongo 3 técnicas por defecto.');
    setPhase('choosing');
  }

  function toggle(id: TechniqueId) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function writePrompt() {
    const techniques = TECHNIQUES.map((t) => t.id).filter((id) => selected.includes(id));
    const back = masterPrompt ? (html ? 'done' : 'prompt') : 'choosing';
    setPhase('prompting');
    const result = await run((signal) => generateMasterPrompt(idea, techniques, choice ?? undefined, signal));
    if (result === undefined) {
      setPhase(back);
      return;
    }
    setPromptTechniques(techniques);
    setMasterPrompt(result.value);
    generatedPrompt.current = {
      role: 'assistant',
      kind: 'prompt',
      text: result.value,
      at: Date.now(),
      by: { provider: result.provider, model: result.model },
    };
    setPromptBy({ by: result, asked: choice });
    setPhase('prompt');
  }

  async function build() {
    setPhase('building');
    const built = await run((signal) => generateLanding(masterPrompt, choice ?? undefined, signal));
    if (built === undefined) {
      setPhase(html ? 'done' : 'prompt');
      return;
    }
    setHtml(built.value);
    setHtmlBy({ by: built, asked: choice });
    let result = built;
    let reviewed = false;
    if (promptTechniques.includes('critic')) {
      setPhase('reviewing');
      const before = runId.current;
      const review = await run((signal) => reviewLanding(masterPrompt, built.value, choice ?? undefined, signal));
      // Si se canceló ("Nueva idea"), no guardar nada; si falló, se queda la versión sin revisar y el error visible.
      if (runId.current !== before + 1) return;
      if (review) {
        result = review;
        reviewed = true;
        setHtml(review.value);
        setHtmlBy({ by: review, asked: choice });
      }
    }
    setPhase('done');
    try {
      await persist(result.value, masterPrompt, { provider: result.provider, model: result.model }, reviewed);
    } catch (e) {
      setError(`La landing se generó pero no se pudo guardar en el banco: ${(e as Error).message}`);
    }
  }

  // Guarda la landing en el banco: la primera construcción crea la entrada y las siguientes la actualizan.
  async function persist(nextHtml: string, usedPrompt: string, by: ModelChoice, reviewed: boolean) {
    const now = Date.now();
    const existing = savedId ? await getLanding(savedId) : undefined;
    const chat: ChatEntry[] = existing
      ? [...existing.chat]
      : [{ role: 'user', kind: 'idea', text: idea, at: ideaAt.current || now }];
    const lastTechniques = chat.filter((e) => e.kind === 'techniques').pop();
    const techniquesText = techniquesSummary(promptTechniques);
    if (promptTechniques.length && lastTechniques?.text !== techniquesText)
      chat.push({ role: 'user', kind: 'techniques', text: techniquesText, at: generatedPrompt.current?.at ?? now });
    if (!existing && generatedPrompt.current) chat.push(generatedPrompt.current);
    const lastPrompt = chat.filter((e) => e.kind === 'prompt').pop();
    if (lastPrompt?.text !== usedPrompt) chat.push({ role: 'user', kind: 'prompt', text: usedPrompt, at: now });
    chat.push({
      role: 'assistant',
      kind: 'landing',
      text: `${existing ? 'Reconstruí la landing' : 'Construí la landing'}${reviewed ? ' y el agente crítico la revisó.' : '.'}`,
      at: now,
      by,
    });
    const id = existing?.id ?? newId();
    await saveLanding({
      id,
      title: titleFor(nextHtml, idea),
      idea,
      masterPrompt: usedPrompt,
      techniques: promptTechniques,
      html: nextHtml,
      chat,
      by,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    setSavedId(id);
  }

  function reset() {
    runId.current++;
    abort.current?.abort();
    setPromptBy(null);
    setHtmlBy(null);
    setSavedId(null);
    generatedPrompt.current = null;
    setPhase('idle');
    setIdea('');
    setRecommended([]);
    setRecommendedBy(null);
    setSelected([]);
    setPromptTechniques([]);
    setMasterPrompt('');
    setHtml('');
    setError(null);
    setFullscreen(false);
  }

  function download() {
    downloadHtml(html, fileNameFor(titleFor(html, idea)));
  }

  function copyPrompt() {
    if (!masterPrompt) return;
    void navigator.clipboard.writeText(masterPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void sendIdea(draft);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendIdea(draft);
    }
  }

  function pick(next: ModelChoice) {
    setChoice(next);
    storeChoice(next);
  }

  return (
    <main className={`shell ${!started ? 'shell-hero' : 'shell-chat'}`} hidden={!active}>
      {/* Luces ambientales con sutil gradiente */}
      <div className="ambient-glow ambient-glow-1" aria-hidden="true" />
      <div className="ambient-glow ambient-glow-2" aria-hidden="true" />

      <header className="top">
        <a
          href={href({ name: 'chat' })}
          className="brand-link"
          onClick={(e) => {
            if (started) {
              e.preventDefault();
              reset();
            }
          }}
        >
          <LogoIcon />
          <div className="brand-info">
            <span className="brand-name">AuraLanding</span>
            <span className="brand-badge">AI Studio</span>
          </div>
        </a>

        <div className="top-actions">
          {health && (
            <div className="system-status" title={`${health.providers.length} proveedor(es) activo(s)`}>
              <span className="status-dot online" />
              <span className="status-text">Motor IA listo</span>
            </div>
          )}
          {health && choice ? (
            <ModelPicker health={health} value={choice} onChange={pick} disabled={busy} />
          ) : (
            <span className="status">
              {healthError ? 'Servidor sin conexión' : !health ? 'Conectando IA…' : 'Sin proveedor: configura .env'}
            </span>
          )}
          <a className="btn ghost btn-icon" href={href({ name: 'bank' })}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>Mis landings</span>
          </a>
          {started && (
            <button className="btn ghost btn-icon" onClick={reset} title="Comenzar con una nueva idea">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Nueva idea</span>
            </button>
          )}
        </div>
      </header>

      <section className="chat">
        {!started && (
          <div className="hero-landing">
            <div className="hero-badge">
              <span className="hero-badge-sparkle">✦</span>
              <span>Motor Autónomo de Landing Pages & Neurodiseño</span>
            </div>

            <h1 className="hero-title">
              Genera páginas web de alto impacto <br className="br-desktop" />
              <span className="gradient-text">con criterio experto de conversión</span>
            </h1>

            <p className="hero-subtitle">
              AuraLanding audita la psicología de tu audiencia, formula un prompt maestro auditable
              y compila código HTML5/CSS3 limpio, supervisado por un agente crítico de diseño.
            </p>

            {/* Prompt Studio Hero Card */}
            <div className="hero-composer-card">
              <div className="composer-header">
                <div className="composer-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>Describe tu negocio, servicio o propuesta de valor</span>
                </div>
                <span className="composer-hint">Sin plantillas genéricas · Código 100% a medida</span>
              </div>

              <form className="hero-composer-form" onSubmit={onSubmit}>
                <textarea
                  id="main-prompt-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ej.: Una landing moderna para mi estudio de yoga en Medellín; quiero que reserven la primera clase gratis por WhatsApp..."
                  rows={4}
                  autoFocus
                />
                <div className="composer-footer">
                  <div className="composer-footer-left">
                    <span className="kbd-shortcut">
                      <kbd>Enter ↵</kbd> para generar · <kbd>Shift + Enter</kbd> nueva línea
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-generate"
                    disabled={!draft.trim() || busy}
                    id="submit-prompt-button"
                  >
                    <span>Sintetizar con IA</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Inspiration Matrix (6 Balanced Cards) */}
            <div className="templates-section">
              <div className="templates-header">
                <span className="templates-badge">EXPLORADOR DE CASOS</span>
                <span className="templates-label">O pulsa en un caso de uso real para auto-completar el brief:</span>
              </div>
              <div className="templates-matrix">
                {PROMPT_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="matrix-card"
                    onClick={() => {
                      setDraft(tmpl.prompt);
                      const el = document.getElementById('main-prompt-input');
                      el?.focus();
                    }}
                  >
                    <div className="matrix-card-top">
                      <div className="matrix-icon">{tmpl.icon}</div>
                      <span className="matrix-badge">{tmpl.badge}</span>
                    </div>
                    <strong className="matrix-title">{tmpl.title}</strong>
                    <span className="matrix-desc">{tmpl.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Architecture & Flow Cards */}
            <div className="pipeline-header">
              <span className="pipeline-badge">ARQUITECTURA DE GENERACIÓN</span>
              <h2 className="pipeline-title">Cómo sintetiza tu página el motor de IA</h2>
              <p className="pipeline-subtitle">
                A diferencia de generadores genéricos que reciclan las mismas plantillas, nuestra solución implementa un pipeline de ingeniería de tres fases:
              </p>
            </div>

            <div className="features-grid">
              <div className="feature-card feature-step-1">
                <div className="feature-top-bar">
                  <span className="feature-phase-badge">Fase 01 · Estrategia</span>
                  <div className="feature-icon-wrap feature-accent-1">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a8 8 0 0 0-8 8c0 3.31 2.01 6.16 4.88 7.37L8.5 20h7l-.38-2.63C17.99 16.16 20 13.31 20 10a8 8 0 0 0-8-8z" />
                    </svg>
                  </div>
                </div>
                <h3>Diagnóstico de Conversión</h3>
                <p>Audita el nicho de mercado, define la audiencia objetiva y selecciona algorítmicamente las 3 mejores técnicas psicológicas de persuasión.</p>
                <ul className="feature-checklist">
                  <li><span>✓</span> Sesgos cognitivos aplicados</li>
                  <li><span>✓</span> Jerarquía visual hacia el CTA</li>
                  <li><span>✓</span> Reducción de objeciones reales</li>
                </ul>
              </div>

              <div className="feature-card feature-step-2">
                <div className="feature-top-bar">
                  <span className="feature-phase-badge">Fase 02 · Especificación</span>
                  <div className="feature-icon-wrap feature-accent-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                </div>
                <h3>Prompt Maestro Transparente</h3>
                <p>Estructura una especificación técnica de nivel arquitecto web con rol, directivas, paleta y narrativa que puedes revisar y editar en vivo.</p>
                <ul className="feature-checklist">
                  <li><span>✓</span> Especificación abierta y auditable</li>
                  <li><span>✓</span> Copywriting persuasivo modular</li>
                  <li><span>✓</span> Personalizable antes de programar</li>
                </ul>
              </div>

              <div className="feature-card feature-step-3">
                <div className="feature-top-bar">
                  <span className="feature-phase-badge">Fase 03 · Compilación</span>
                  <div className="feature-icon-wrap feature-accent-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                  </div>
                </div>
                <h3>Código Limpio & Agente Crítico</h3>
                <p>Sintetiza HTML5 semántico, CSS moderno y JS sin dependencias propietarias, supervisado por un agente crítico de diseño y accesibilidad.</p>
                <ul className="feature-checklist">
                  <li><span>✓</span> HTML5 + CSS autónomo (W3C)</li>
                  <li><span>✓</span> Agente crítico supervisor de calidad</li>
                  <li><span>✓</span> Descarga o edición inmediata</li>
                </ul>
              </div>
            </div>

            {/* Metrics & Benchmark Ribbon */}
            <div className="hero-metrics-ribbon">
              <div className="metric-pill">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span><strong>&lt; 60s</strong> Síntesis autónoma</span>
              </div>
              <div className="metric-pill">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span><strong>100% Local</strong> Máxima privacidad</span>
              </div>
              <div className="metric-pill">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
                <span><strong>Responsive</strong> Mobile-First 320px-4K</span>
              </div>
              <div className="metric-pill">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span><strong>Código Abierto</strong> Sin ataduras</span>
              </div>
            </div>
          </div>
        )}

        {started && (
          <div className="user-request-card">
            <div className="user-request-head">
              <div className="user-avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="user-label">Tu idea de landing</span>
            </div>
            <p className="user-request-text">{idea}</p>
          </div>
        )}

        {busy && (
          <div className="ai-processing-card">
            <div className="ai-spinner">
              <div className="ai-spinner-inner" />
            </div>
            <div className="ai-processing-info">
              <div className="ai-processing-title">
                <span>
                  {phase === 'recommending' && 'Paso 1: Analizando técnicas de diseño de conversión…'}
                  {phase === 'prompting' && 'Paso 2: Formulando el prompt maestro de nivel experto…'}
                  {phase === 'building' && 'Paso 3: Construyendo el código HTML y estilos responsive…'}
                  {phase === 'reviewing' && 'Paso 4: Agente crítico auditando código, contraste y persuasión…'}
                </span>
                <span className="elapsed-badge">{elapsed}s</span>
              </div>
              <div className="ai-processing-sub">
                {phase === 'building'
                  ? `La IA está programando la landing completa (${choice?.provider ?? 'IA'} · ${choice?.model ?? ''}).`
                  : 'Procesando con el modelo de inteligencia artificial seleccionado.'}
              </div>
            </div>
            <button
              type="button"
              className="btn ghost btn-sm btn-cancel-step"
              onClick={() => {
                abort.current?.abort();
                setPhase(html ? 'done' : masterPrompt ? 'prompt' : 'idle');
              }}
              title="Detener generación actual"
            >
              Detener
            </button>
          </div>
        )}

        {recommended.length > 0 && started && (
          <div className="card step-card">
            <div className="step-card-header">
              <div className="step-badge-num">1</div>
              <div className="step-card-titles">
                <h3>Técnicas de Conversión Recomendadas</h3>
                <p className="label">
                  La IA seleccionó 3 técnicas estratégicas para tu nicho. Marca o desmarca las que desees incluir:
                  {recommendedBy && <GeneratedBy {...recommendedBy} />}
                </p>
              </div>
            </div>

            {selected.includes('critic') && (
              <div className="speed-tip">
                <span className="speed-tip-icon">⚡</span>
                <span>
                  <strong>Tip de velocidad:</strong> La técnica <em>"Agente crítico"</em> está marcada. Realizará una segunda pasada completa para auditar la página. Si deseas una generación ultra-rápida (en ~15s), desmárcala.
                </span>
              </div>
            )}

            <ul className="techniques">
              {orderTechniques(recommended).map(({ technique, why }) => {
                const on = selected.includes(technique.id);
                return (
                  <li key={technique.id}>
                    <button
                      type="button"
                      className={`technique${on ? ' on' : ''}`}
                      aria-pressed={on}
                      onClick={() => toggle(technique.id)}
                      disabled={busy}
                    >
                      <span className="technique-head">
                        <span className="technique-check" aria-hidden="true">
                          {on ? '✓' : ''}
                        </span>
                        <strong>{technique.name}</strong>
                        {why !== undefined && <span className="badge">Recomendada</span>}
                      </span>
                      <span className="technique-summary">{technique.summary}</span>
                      {why && <span className="technique-summary technique-why">Para tu idea: {why}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="actions">
              <button className="btn btn-primary" onClick={writePrompt} disabled={busy || selected.length === 0}>
                <span>{masterPrompt ? 'Reescribir prompt maestro' : 'Escribir prompt maestro'}</span>
                <span className="btn-count">
                  ({selected.length} {selected.length === 1 ? 'técnica' : 'técnicas'})
                </span>
              </button>
            </div>
          </div>
        )}

        {masterPrompt && started && phase !== 'prompting' && (
          <div className="card step-card">
            <div className="step-card-header">
              <div className="step-badge-num">2</div>
              <div className="step-card-titles">
                <div className="step-title-row">
                  <h3>Prompt Maestro de Ingeniería</h3>
                  <button
                    type="button"
                    className="btn ghost btn-sm btn-icon"
                    onClick={copyPrompt}
                    title="Copiar prompt al portapapeles"
                  >
                    {copiedPrompt ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>Copiar prompt</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="label">
                  Puedes inspeccionar o ajustar la especificación del modelo antes de construir el código HTML:
                  {promptBy && <GeneratedBy {...promptBy} />}
                </p>
              </div>
            </div>

            <textarea
              className="prompt-editor"
              value={masterPrompt}
              onChange={(e) => setMasterPrompt(e.target.value)}
              disabled={busy}
              spellCheck={false}
            />
            <div className="actions">
              <button className="btn btn-primary" onClick={build} disabled={busy || !masterPrompt.trim()}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>{html ? 'Reconstruir landing' : 'Construir landing'}</span>
              </button>
            </div>
          </div>
        )}

        {html && started && (
          <div className={`card preview-card${fullscreen ? ' fullscreen' : ''}`}>
            <div className="preview-browser-bar">
              <div className="browser-dots" aria-hidden="true">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <div className="browser-address-bar">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>https://lienzo-preview.local/landing</span>
              </div>
              <div className="browser-meta">
                {htmlBy && <GeneratedBy {...htmlBy} />}
              </div>
            </div>

            <iframe title="Vista previa de la landing" sandbox="allow-scripts" srcDoc={html} />

            <div className="actions preview-actions">
              <button className="btn btn-primary" onClick={download}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Descargar HTML</span>
              </button>
              <button className="btn ghost" onClick={() => setFullscreen((f) => !f)}>
                {fullscreen ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                    </svg>
                    <span>Salir de pantalla completa</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </svg>
                    <span>Pantalla completa</span>
                  </>
                )}
              </button>
              {savedId && (
                <button
                  className="btn ghost"
                  onClick={() => {
                    setFullscreen(false);
                    navigate({ name: 'editor', id: savedId });
                  }}
                  disabled={busy}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>Editar código</span>
                </button>
              )}
            </div>
          </div>
        )}

        {error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}

// Recomendadas primero (en el orden del modelo, con su porqué); luego el resto del catálogo.
function orderTechniques(recommended: Recommendation[]) {
  const first = recommended.flatMap((r) => {
    const technique = TECHNIQUES.find((t) => t.id === r.id);
    return technique ? [{ technique, why: r.why }] : [];
  });
  const rest = TECHNIQUES.filter((t) => !recommended.some((r) => r.id === t.id)).map((technique) => ({
    technique,
    why: undefined as string | undefined,
  }));
  return [...first, ...rest];
}

function techniquesSummary(ids: TechniqueId[]): string {
  return `Técnicas: ${TECHNIQUES.filter((t) => ids.includes(t.id))
    .map((t) => t.name)
    .join(', ')}`;
}

// "· con gemini · gemini-flash-latest", y un aviso si respondió un respaldo en vez del modelo elegido.
interface Origin {
  by: ModelChoice;
  asked: ModelChoice | null;
}

function GeneratedBy({ by, asked }: Origin) {
  const fallback = asked && (asked.provider !== by.provider || asked.model !== by.model);
  return (
    <span className={fallback ? 'fallback' : undefined}>
      {' · '}
      {fallback ? 'respondió el respaldo ' : 'con '}
      {by.provider} · {by.model}
    </span>
  );
}
