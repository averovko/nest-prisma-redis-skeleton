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

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { ConfigService } from '@nestjs/config';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue({
              master: {
                host: 'localhost',
                port: 5432,
                user: 'postgres',
                password: 'postgres',
                name: 'postgres',
              },
              readReplicas: [],
            }),
          },
        },
      ],
    }).compile();

    service = module.get(PrismaService);
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
