import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { readReplicas } from '@prisma/extension-read-replicas';
import { PrismaClient } from 'src/generated/prisma/client';

type DatabaseNodeConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  name: string;
  sslMode?: string;
};

type DatabaseConfig = {
  master: DatabaseNodeConfig;
  readReplicas: DatabaseNodeConfig[];
};

function buildConnectionString(input: DatabaseNodeConfig): string {
  const sslMode = input.sslMode ?? 'verify-full';
  return `postgres://${input.user}:${input.password}@${input.host}:${input.port}/${input.name}?sslmode=${sslMode}`;
}

export type ExtendedPrismaClient = ReturnType<
  PrismaService['createExtendedClient']
>;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  readonly client: ExtendedPrismaClient;

  constructor(private readonly configService: ConfigService) {
    this.client = this.createExtendedClient();
  }

  private createExtendedClient() {
    const database = this.configService.getOrThrow<DatabaseConfig>('database');
    const masterConnectionString = buildConnectionString(database.master);
    this.logger.log(
      `Init master DB connection host=${database.master.host} port=${database.master.port} db=${database.master.name}`,
    );
    const mainAdapter = new PrismaPg({
      connectionString: masterConnectionString,
    });
    const mainClient = new PrismaClient({ adapter: mainAdapter });
    const replicaClients: PrismaClient[] = (database.readReplicas ?? []).map(
      (replica, idx) => {
        const replicaConnectionString = buildConnectionString(replica);
        this.logger.log(
          `Init read replica DB connection ${idx} host=${replica.host} port=${replica.port} db=${replica.name}`,
        );
        const replicaAdapter = new PrismaPg({
          connectionString: replicaConnectionString,
        });
        return new PrismaClient({ adapter: replicaAdapter });
      },
    );
    if (replicaClients.length)
      return mainClient.$extends(readReplicas({ replicas: replicaClients }));
    return mainClient;
  }

  async onModuleInit() {
    await (this.client as unknown as PrismaClient).$connect();

    this.logger.log('prisma service: connect to database successfully');
  }

  async onModuleDestroy() {
    await (this.client as unknown as PrismaClient).$disconnect();
  }
}
