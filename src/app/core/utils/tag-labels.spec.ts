import { getTagLabel, hasTagLabel } from './tag-labels';

describe('tag labels', () => {
  it('should translate common architecture labels to Spanish', () => {
    expect(getTagLabel('architecture')).toBe('Arquitectura');
    expect(getTagLabel('state-management')).toBe('Gestión de estado');
    expect(getTagLabel('real-world-scenarios')).toBe('Escenarios reales');
    expect(getTagLabel('performance')).toBe('Rendimiento');
    expect(getTagLabel('debugging')).toBe('Depuración');
  });

  it('should keep a readable fallback for unknown tags', () => {
    expect(getTagLabel('custom-widget')).toBe('Custom Widget');
  });

  it('should report whether a tag has a visible label', () => {
    expect(hasTagLabel('architecture')).toBeTruthy();
    expect(hasTagLabel('')).toBeFalsy();
  });
});
