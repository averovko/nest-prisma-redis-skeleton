import { plainToInstance } from 'class-transformer';
import { PageOptionsDto } from './page-options.dto';

describe('PageOptionsDto', () => {
  describe('defaults', () => {
    it('initializes pageNumber to 0 when no args given', () => {
      const dto = new PageOptionsDto();

      expect(dto.pageNumber).toBe(0);
    });

    it('initializes pageSize to 10 when no args given', () => {
      const dto = new PageOptionsDto();

      expect(dto.pageSize).toBe(10);
    });
  });

  describe('constructor', () => {
    it('sets pageNumber from first argument', () => {
      const dto = new PageOptionsDto(2, 20);

      expect(dto.pageNumber).toBe(2);
    });

    it('sets pageSize from second argument', () => {
      const dto = new PageOptionsDto(0, 25);

      expect(dto.pageSize).toBe(25);
    });

    it('uses defaults for undefined arguments', () => {
      const dto = new PageOptionsDto(undefined, undefined);

      expect(dto.pageNumber).toBe(0);
      expect(dto.pageSize).toBe(10);
    });
  });

  describe('toDatabaseQuery()', () => {
    it('returns skip=0 and take=pageSize for first page', () => {
      const dto = new PageOptionsDto(0, 10);
      const query = dto.toDatabaseQuery();

      expect(query.skip).toBe(0);
      expect(query.take).toBe(10);
    });

    it('calculates skip as pageNumber * pageSize', () => {
      const dto = new PageOptionsDto(3, 20);
      const query = dto.toDatabaseQuery();

      expect(query.skip).toBe(60);
      expect(query.take).toBe(20);
    });

    it('returns skip=0 for page 0 with any page size', () => {
      const dto = new PageOptionsDto(0, 50);
      const query = dto.toDatabaseQuery();

      expect(query.skip).toBe(0);
    });
  });

  describe('toResponseMeta()', () => {
    it('calculates totalPages as ceil(totalItems / pageSize)', () => {
      const dto = new PageOptionsDto(0, 10);
      const meta = dto.toResponseMeta(25);

      expect(meta.totalPages).toBe(3);
    });

    it('reflects pageNumber and pageSize in meta', () => {
      const dto = new PageOptionsDto(1, 15);
      const meta = dto.toResponseMeta(45);

      expect(meta.pageNumber).toBe(1);
      expect(meta.pageSize).toBe(15);
    });

    it('sets hasNextPage=true when not on last page', () => {
      const dto = new PageOptionsDto(0, 10);
      const meta = dto.toResponseMeta(30);

      expect(meta.hasNextPage).toBe(true);
    });

    it('sets hasNextPage=false on last page', () => {
      const dto = new PageOptionsDto(2, 10);
      const meta = dto.toResponseMeta(30);

      expect(meta.hasNextPage).toBe(false);
    });

    it('sets hasPreviousPage=false on first page', () => {
      const dto = new PageOptionsDto(0, 10);
      const meta = dto.toResponseMeta(100);

      expect(meta.hasPreviousPage).toBe(false);
    });

    it('sets hasPreviousPage=true on subsequent pages', () => {
      const dto = new PageOptionsDto(1, 10);
      const meta = dto.toResponseMeta(100);

      expect(meta.hasPreviousPage).toBe(true);
    });

    describe('@Transform callbacks via class-transformer', () => {
      it('transforms string pageNumber to integer', () => {
        const dto = plainToInstance(PageOptionsDto, { pageNumber: '3' });

        expect(dto.pageNumber).toBe(3);
      });

      it('transforms string pageSize to integer', () => {
        const dto = plainToInstance(PageOptionsDto, { pageSize: '25' });

        expect(dto.pageSize).toBe(25);
      });

      it('transforms both fields from strings simultaneously', () => {
        const dto = plainToInstance(PageOptionsDto, {
          pageNumber: '2',
          pageSize: '50',
        });

        expect(dto.pageNumber).toBe(2);
        expect(dto.pageSize).toBe(50);
      });
    });

    it('handles totalItems=0 correctly', () => {
      const dto = new PageOptionsDto(0, 10);
      const meta = dto.toResponseMeta(0);

      expect(meta.totalItems).toBe(0);
      expect(meta.totalPages).toBe(0);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPreviousPage).toBe(false);
    });

    it('includes totalItems in meta', () => {
      const dto = new PageOptionsDto(0, 10);
      const meta = dto.toResponseMeta(77);

      expect(meta.totalItems).toBe(77);
    });
  });
});
