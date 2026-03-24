import { Role } from '../../domain';
import { PrismaUserLookupAdapter } from './prisma-user-lookup.adapter';

const mockFindUnique = jest.fn();

const mockPrismaService = {
  client: {
    user: {
      findUnique: mockFindUnique,
    },
  },
} as any;

const prismaUserRecord = {
  id: 'usr-1',
  authId: 'auth-1',
  email: 'a@b.com',
  phone: '+1',
  firstName: 'Alice',
  lastName: 'Smith',
  avatar: 'https://example.com/avatar.png',
  roles: ['USER'],
  isActive: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-06-01'),
};

describe('PrismaUserLookupAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByAuthId', () => {
    it('returns undefined when user is not found', async () => {
      mockFindUnique.mockResolvedValue(null);
      const adapter = new PrismaUserLookupAdapter(mockPrismaService);

      const result = await adapter.findByAuthId('unknown-auth-id');

      expect(result).toBeUndefined();
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { authId: 'unknown-auth-id' },
      });
    });

    it('returns mapped User when found', async () => {
      mockFindUnique.mockResolvedValue(prismaUserRecord);
      const adapter = new PrismaUserLookupAdapter(mockPrismaService);

      const result = await adapter.findByAuthId('auth-1');

      expect(result).toEqual({
        id: 'usr-1',
        authId: 'auth-1',
        email: 'a@b.com',
        phone: '+1',
        firstName: 'Alice',
        lastName: 'Smith',
        avatar: 'https://example.com/avatar.png',
        roles: [Role.USER],
        isActive: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-06-01'),
      });
    });

    it('correctly maps nullable fields as null', async () => {
      mockFindUnique.mockResolvedValue({
        ...prismaUserRecord,
        email: null,
        phone: null,
        lastName: null,
        avatar: null,
      });
      const adapter = new PrismaUserLookupAdapter(mockPrismaService);

      const result = await adapter.findByAuthId('auth-1');

      expect(result?.email).toBeNull();
      expect(result?.phone).toBeNull();
      expect(result?.lastName).toBeNull();
      expect(result?.avatar).toBeNull();
    });

    it('maps multiple roles correctly', async () => {
      mockFindUnique.mockResolvedValue({
        ...prismaUserRecord,
        roles: ['USER', 'ADMIN'],
      });
      const adapter = new PrismaUserLookupAdapter(mockPrismaService);

      const result = await adapter.findByAuthId('auth-1');

      expect(result?.roles).toEqual([Role.USER, Role.ADMIN]);
    });
  });
});
