/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SessionsModule } from './sessions/sessions.module';
import { PrismaService } from './prisma.service';
import { AIService } from './ai/ai.service';
import { PrismaModule } from './prisma.module';
import { AiModule } from './ai/ai.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),SessionsModule, PrismaModule, AiModule],
  controllers: [AppController],
  providers: [AppService, PrismaService, AIService],
})
export class AppModule {}
