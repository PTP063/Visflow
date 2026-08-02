import { extractVariables, measureTextWidth, longestLineWidth } from './textUtils';

describe('extractVariables', () => {
  test('returns empty array for text with no variables', () => {
    expect(extractVariables('hello world')).toEqual([]);
  });

  test('extracts a single variable', () => {
    expect(extractVariables('Hello {{name}}')).toEqual(['name']);
  });

  test('extracts multiple distinct variables in order of first appearance', () => {
    expect(extractVariables('{{greeting}} {{name}}, welcome to {{place}}')).toEqual([
      'greeting',
      'name',
      'place',
    ]);
  });

  test('deduplicates repeated variables', () => {
    expect(extractVariables('{{name}} is {{name}}')).toEqual(['name']);
  });

  test('tolerates extra whitespace inside braces', () => {
    expect(extractVariables('{{  spaced_out  }}')).toEqual(['spaced_out']);
  });

  test('ignores invalid identifiers (cannot start with a digit)', () => {
    expect(extractVariables('{{1invalid}}')).toEqual([]);
  });

  test('handles empty or falsy input safely', () => {
    expect(extractVariables('')).toEqual([]);
    expect(extractVariables(undefined)).toEqual([]);
  });
});
describe('measureTextWidth', () => {
  test('returns 0 for empty text', () => {
    expect(measureTextWidth('')).toBe(0);
  });

  test('longer text measures wider than shorter text', () => {
    const short = measureTextWidth('hi');
    const long = measureTextWidth('hello world, this is a much longer string');
    expect(long).toBeGreaterThan(short);
  });

  test('falls back gracefully when no canvas 2D context is available', () => {
    // jsdom (the test environment) doesn't implement canvas, so this
    // exercises the fallback path directly rather than mocking it.
    expect(() => measureTextWidth('fallback path')).not.toThrow();
    expect(measureTextWidth('fallback path')).toBeGreaterThan(0);
  });
});

describe('longestLineWidth', () => {
  test('picks the widest line, not the first or last', () => {
    const text = 'short\na much longer line here\nmed';
    const widest = longestLineWidth(text);
    expect(widest).toBeCloseTo(measureTextWidth('a much longer line here'), 5);
  });

  test('handles a single line with no newlines', () => {
    expect(longestLineWidth('just one line')).toBeCloseTo(measureTextWidth('just one line'), 5);
  });
});
