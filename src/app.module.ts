import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { AuthenticationModule } from './authentication/authentication.module';

@Module({
  imports: [
    CommonModule,
    AuthenticationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
