import { generateSlug } from './slug-generator';

describe('generateSlug', () => {
  it('should convert title to lowercase slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('should remove accents', () => {
    expect(generateSlug('¿Qué es Angular?')).toBe('que-es-angular');
  });

  it('should handle special Spanish characters', () => {
    expect(generateSlug('¿Qué hace el hook useEffect?')).toBe('que-hace-el-hook-useeffect');
  });

  it('should replace multiple spaces with single dash', () => {
    expect(generateSlug('Hello   World')).toBe('hello-world');
  });

  it('should remove leading and trailing dashes', () => {
    expect(generateSlug('  hello world  ')).toBe('hello-world');
  });
});
