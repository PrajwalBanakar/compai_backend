/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { AiModule } from 'src/ai/ai.module';
import { AIService } from 'src/ai/ai.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [AiModule],
  controllers: [SessionsController],
  providers: [SessionsService, AIService, PrismaService],
})
export class SessionsModule {}
