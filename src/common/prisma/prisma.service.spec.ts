jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@prisma/extension-read-replicas', () => ({
  readReplicas: jest.fn().mockReturnValue({}),
}));

const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockDisconnect = jest.fn().mockResolvedValue(undefined);
const mockExtends = jest.fn().mockImplementation(function (this: unknown) {
  return this;
});

jest.mock('src/generated/prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: mockConnect,
    $disconnect: mockDisconnect,
    $extends: mockExtends,
  })),
}));

import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PrismaService();
  });

  it('exposes a client property after construction', () => {
    expect(service.client).toBeDefined();
  });

  describe('onModuleInit()', () => {
    it('calls $connect on the underlying PrismaClient', async () => {
      await service.onModuleInit();

      expect(mockConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('onModuleDestroy()', () => {
    it('calls $disconnect on the underlying PrismaClient', async () => {
      await service.onModuleDestroy();

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });
});
