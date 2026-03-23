import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { readReplicas } from '@prisma/extension-read-replicas';
import { PrismaClient } from 'src/generated/prisma/client';

function createExtendedClient() {
  const mainAdapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  const mainClient = new PrismaClient({ adapter: mainAdapter });

  const replicaAdapter = new PrismaPg({
    connectionString: process.env.REPLICA_URL!,
  });
  const replicaClient = new PrismaClient({ adapter: replicaAdapter });

  return mainClient.$extends(readReplicas({ replicas: [replicaClient] }));
}
export type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  readonly client: ExtendedPrismaClient;

  constructor() {
    this.client = createExtendedClient();
  }

  async onModuleInit() {
    await (this.client as unknown as PrismaClient).$connect();

    this.logger.log('prisma service: connect to database successfully');
  }

  async onModuleDestroy() {
    await (this.client as unknown as PrismaClient).$disconnect();
  }
}
