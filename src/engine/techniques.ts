// Las 8 técnicas de diseño de landings con IA (documento "8 técnicas avanzadas").
// Antes del prompt maestro, el modelo recomienda 3 según la idea y el usuario elige las que quiera.
// Cada técnica aporta una directiva que el prompt maestro debe volcar en sus secciones.

export type TechniqueId =
  | 'seed'
  | 'ambitious'
  | 'critic'
  | 'images'
  | 'video'
  | 'subtractive'
  | 'negative'
  | 'human';

export interface Technique {
  id: TechniqueId;
  name: string;
  // Qué consigue, en una línea, para la tarjeta del chat.
  summary: string;
  // Instrucción para quien escribe el prompt maestro.
  directive: string;
}

export const TECHNIQUES: Technique[] = [
  {
    id: 'seed',
    name: 'Cadenas semilla',
    summary: 'Ancla el diseño a un estilo visual refinado (editorial suizo, brutalismo suave, minimalismo nórdico…) para un acabado de alta gama.',
    directive:
      'Cadena semilla: en "Dirección de diseño" elige una referencia estética concreta (como diseño editorial suizo, minimalismo escandinavo o Bauhaus moderno). Nómbrala y deriva de ella la retícula, la paleta de colores sofisticada, la tipografía y la composición del hero.',
  },
  {
    id: 'ambitious',
    name: 'Prompt ambicioso',
    summary: 'Estructura una landing rica y profunda con copywriting persuasivo, abordando objeciones en cada sección del scroll.',
    directive:
      'Prompt ambicioso: define la psicología del cliente ideal y las objeciones clave a derribar. En "Estructura detallada de la página", especifica para cada sección el objetivo persuasivo, titular, copy de alto valor, elementos visuales/fotográficos y micro-conversiones.',
  },
  {
    id: 'critic',
    name: 'Agente crítico',
    summary: 'Tras construir la landing, un auditor sénior la revisa y pule (UX, accesibilidad, diseño visual y conversión).',
    directive:
      'Agente crítico: añade una lista de verificación de criterios de auditoría (UX moderna, riqueza de contenido, fotos reales con alt, contraste AA, interactividad en widgets y persuasión de titulares) para asegurar un acabado de clase mundial.',
  },
  {
    id: 'images',
    name: 'Fotografía de Alto Impacto & Mockups',
    summary: 'Integra fotografías reales de alta definición (Unsplash CDN) y elementos visuales protagonistas según el sector.',
    directive:
      'Fotografía de alto impacto: especifica las fotografías reales de Unsplash que deben ilustrar el Hero, las características en layout alternado y los avatares fotográficos de los testimonios, con estilos modernos de bordes, sombras y etiquetas alt descriptivas.',
  },
  {
    id: 'video',
    name: 'Vídeo y micro-interacciones',
    summary: 'Añade transiciones fluidas, animaciones CSS refinadas y widgets interactivos que guían la mirada hacia la acción.',
    directive:
      'Vídeo y micro-interacciones: diseña animaciones suaves con CSS (entradas fluidas, hover con levitación o glow sutil) respetando prefers-reduced-motion, e incluye widgets interactivos como toggle de precios y acordeón de FAQ.',
  },
  {
    id: 'subtractive',
    name: 'Diseño enfocado a la conversión',
    summary: 'Elimina fricciones innecesarias y simplifica formularios para maximizar la tasa de conversión sin perder riqueza visual.',
    directive:
      'Diseño enfocado: organiza la página con un camino claro hacia la conversión, formularios directos de baja fricción y llamadas a la acción prominentes y repetidas estratégicamente a lo largo de la página.',
  },
  {
    id: 'negative',
    name: 'Restricciones de autenticidad',
    summary: 'Elimina clichés de IA y lenguaje genérico: exige datos específicos, testimonios humanos y contenido verosímil.',
    directive:
      'Restricciones de autenticidad: prohíbe frases vacías de IA (p. ej. "soluciones integrales 360", "ecosistema revolucionario", "lleva al siguiente nivel") y prohíbe maquetas vacías o esquemáticas: cada sección debe tener contenido real, específico, persuasivo y terminado.',
  },
  {
    id: 'human',
    name: 'Redacción humana y empática',
    summary: 'Copywriting con storytelling del problema del cliente, tono conversacional y botones con beneficio inmediato.',
    directive:
      'Redacción humana: define una voz de marca empática y cercana. Redacta el copy abordando primero la frustración real del cliente antes de presentar las soluciones, con ritmo dinámico y botones con micro-copy específico que comunique valor inmediato.',
  },
];

export const DEFAULT_RECOMMENDATION: TechniqueId[] = ['ambitious', 'images', 'human'];

export function techniqueById(id: string): Technique | undefined {
  return TECHNIQUES.find((t) => t.id === id);
}

export interface Recommendation {
  id: TechniqueId;
  // Por qué encaja con la idea del usuario, en una frase.
  why: string;
}

export const RECOMMEND_SYSTEM = `Eres un director creativo que prepara el encargo de una landing page. Recibes la idea del usuario y eliges, de este catálogo de técnicas, las 3 que más van a mejorar SU landing concreta:

${TECHNIQUES.map((t) => `- ${t.id}: ${t.name}. ${t.summary}`).join('\n')}

Ten en cuenta el tipo de negocio, el público, la acción que busca y lo que el usuario pidió explícitamente (estilo, tono, vídeo, sencillez, etc.).

Responde SOLO con JSON válido, sin Markdown, con esta forma exacta:
{"recommended":[{"id":"<id>","why":"<una frase en el idioma del usuario que explique por qué encaja con su idea>"}]}
Exactamente 3 elementos, ids distintos y tomados del catálogo, del más útil al menos útil.`;

// Acepta JSON envuelto en ``` o con texto alrededor; descarta ids desconocidos o repetidos.
export function parseRecommendation(text: string): Recommendation[] {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return [];
  let data: unknown;
  try {
    data = JSON.parse(text.slice(start, end + 1));
  } catch {
    return [];
  }
  const list = (data as { recommended?: unknown }).recommended;
  if (!Array.isArray(list)) return [];
  const out: Recommendation[] = [];
  for (const item of list) {
    const id = (item as { id?: unknown })?.id;
    const why = (item as { why?: unknown })?.why;
    if (typeof id !== 'string' || !techniqueById(id) || out.some((r) => r.id === id)) continue;
    out.push({ id: id as TechniqueId, why: typeof why === 'string' ? why.trim() : '' });
  }
  return out.slice(0, 3);
}

// Bloque que se añade a la idea para que el prompt maestro aplique las técnicas elegidas.
export function techniquesBlock(ids: TechniqueId[]): string {
  const chosen = TECHNIQUES.filter((t) => ids.includes(t.id));
  if (!chosen.length) return '';
  return `Técnicas elegidas por el usuario. Aplícalas todas dentro de las secciones del prompt maestro y nómbralas en la sección 5:\n${chosen
    .map((t) => `- ${t.directive}`)
    .join('\n')}`;
}
