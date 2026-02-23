/**
 * Sanity test to verify Jest is configured correctly
 */

describe('Jest Configuration', () => {
  it('should run a basic test', () => {
    expect(true).toBe(true);
  });

  it('should perform basic arithmetic', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('hello');
    expect(result).toBe('hello');
  });

  it('should have access to Jest globals', () => {
    expect(jest).toBeDefined();
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });

  it('should support mock functions', () => {
    const mockFn = jest.fn(() => 42);
    expect(mockFn()).toBe(42);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
