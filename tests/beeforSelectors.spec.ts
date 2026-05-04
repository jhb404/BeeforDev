import { describe, it, expect } from 'vitest';
import { Selectors } from '../src/automation/beefor/beeforSelectors';

describe('Beefor selectors', () => {
  it('login email selectors include input[type=email]', () => {
    expect(Selectors.login.emailInput).toContain('input[type="email"]');
  });

  it('mood toggleByText scopes to component', () => {
    const sel = Selectors.mood.toggleByText('Dia feliz');
    expect(sel).toContain('app-personal-mood-card');
    expect(sel).toContain('Dia feliz');
  });

  it('autoLancamento has component + text + css fallbacks', () => {
    expect(Selectors.autoLancamento.component).toBe(
      'app-time-sheet-beefor-button',
    );
    expect(Selectors.autoLancamento.buttonByText).toBe('Auto lançamento');
    expect(Selectors.autoLancamento.buttonCss.length).toBeGreaterThan(0);
  });
});
