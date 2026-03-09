import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  
  constructor() {
    const connectionString = `${process.env.DATABASE_URL}`;
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();

    this.logger.log('prisma service: connect to database successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}