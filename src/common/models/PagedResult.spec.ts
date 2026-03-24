import { PagedResult, PageMeta } from './PagedResult';

const buildMeta = (overrides: Partial<PageMeta> = {}): PageMeta => ({
  pageSize: 10,
  pageNumber: 0,
  totalItems: 100,
  totalPages: 10,
  hasNextPage: true,
  hasPreviousPage: false,
  ...overrides,
});

describe('PagedResult', () => {
  describe('constructor', () => {
    it('assigns data and meta', () => {
      const data = [1, 2, 3];
      const meta = buildMeta();
      const result = new PagedResult(data, meta);

      expect(result.data).toBe(data);
      expect(result.meta).toBe(meta);
    });
  });

  describe('empty()', () => {
    it('returns a PagedResult with empty data array', () => {
      const result = PagedResult.empty<number>();

      expect(result.data).toEqual([]);
    });

    it('returns zero-valued meta', () => {
      const result = PagedResult.empty<number>();

      expect(result.meta.pageSize).toBe(0);
      expect(result.meta.pageNumber).toBe(0);
      expect(result.meta.totalItems).toBe(0);
      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(false);
    });
  });

  describe('transform()', () => {
    it('applies transformer function to each item', () => {
      const source = new PagedResult([1, 2, 3], buildMeta());
      const result = PagedResult.transform(source, (n) => n * 2);

      expect(result.data).toEqual([2, 4, 6]);
    });

    it('preserves the original meta unchanged', () => {
      const meta = buildMeta({ totalItems: 50 });
      const source = new PagedResult(['a', 'b'], meta);
      const result = PagedResult.transform(source, (s) => s.toUpperCase());

      expect(result.meta).toBe(meta);
    });

    it('returns a new PagedResult instance', () => {
      const source = new PagedResult([1], buildMeta());
      const result = PagedResult.transform(source, (n) => n + 1);

      expect(result).toBeInstanceOf(PagedResult);
      expect(result).not.toBe(source);
    });

    it('handles empty data array', () => {
      const source = PagedResult.empty<number>();
      const result = PagedResult.transform(source, (n) => n * 2);

      expect(result.data).toEqual([]);
    });
  });
});
