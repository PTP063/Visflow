import { wouldCreateCycle } from './graphUtils';

describe('wouldCreateCycle', () => {
  test('a self-loop is always a cycle', () => {
    expect(wouldCreateCycle('a', 'a', [])).toBe(true);
  });

  test('connecting two unrelated nodes is not a cycle', () => {
    const edges = [{ source: 'x', target: 'y' }];
    expect(wouldCreateCycle('a', 'b', edges)).toBe(false);
  });

  test('closing a simple chain back on itself is a cycle', () => {
    // a -> b -> c already exists; connecting c -> a closes the loop
    const edges = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
    ];
    expect(wouldCreateCycle('c', 'a', edges)).toBe(true);
  });

  test('connecting further down an existing chain is not a cycle', () => {
    // a -> b already exists; connecting a -> c is fine
    const edges = [{ source: 'a', target: 'b' }];
    expect(wouldCreateCycle('a', 'c', edges)).toBe(false);
  });

  test('a diamond shape (shared descendant) is not flagged as a cycle', () => {
    const edges = [
      { source: 'a', target: 'b' },
      { source: 'a', target: 'c' },
    ];
    // connecting b -> d and c -> d both feed the same node; neither closes a loop
    expect(wouldCreateCycle('b', 'd', edges)).toBe(false);
    expect(wouldCreateCycle('c', 'd', edges)).toBe(false);
  });

  test('an empty graph never has a cycle for a new edge between different nodes', () => {
    expect(wouldCreateCycle('a', 'b', [])).toBe(false);
  });
});
