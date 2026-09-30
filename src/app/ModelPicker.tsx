import type { ModelTier } from '../../server/providers/types.ts';
import type { Health, ModelChoice } from '../providers/client.ts';

const TIER_LABEL: Record<ModelTier, string> = {
  free: 'gratis',
  pro: 'de pago',
  env: 'de tu .env',
};

const TIERS: ModelTier[] = ['env', 'free', 'pro'];

export const choiceKey = (c: ModelChoice) => `${c.provider}::${c.model}`;

export function parseChoice(key: string): ModelChoice {
  const i = key.indexOf('::');
  return { provider: key.slice(0, i), model: key.slice(i + 2) };
}

interface Props {
  health: Health;
  value: ModelChoice;
  onChange(choice: ModelChoice): void;
  disabled?: boolean;
}

export function ModelPicker({ health, value, onChange, disabled }: Props) {
  return (
    <div className="model-picker-wrap">
      <span className="model-picker-icon" aria-hidden="true">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
      </span>
      <select
        className="model-picker"
        aria-label="Modelo de IA"
        value={choiceKey(value)}
        onChange={(e) => onChange(parseChoice(e.target.value))}
        disabled={disabled}
      >
        {health.providers.flatMap((p) =>
          TIERS.map((tier) => {
            const models = p.models.filter((m) => m.tier === tier);
            if (models.length === 0) return null;
            return (
              <optgroup key={`${p.id}-${tier}`} label={`${p.id.toUpperCase()} · ${TIER_LABEL[tier]}`}>
                {models.map((m) => (
                  <option key={m.id} value={choiceKey({ provider: p.id, model: m.id })}>
                    {m.id}
                  </option>
                ))}
              </optgroup>
            );
          }),
        )}
      </select>
      <span className="model-picker-arrow" aria-hidden="true">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </span>
    </div>
  );
}
