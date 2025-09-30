/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

// Sessions Controller with SSE streaming for AI responses
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { SessionsService } from './sessions.service';
import { AIService } from '../ai/ai.service';

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly aiService: AIService,
  ) {}

  @Post()
  async createSession(@Body('prompt') prompt: string) {
    return this.sessionsService.createSession(prompt);
  }

  @Get(':id')
  async getSession(@Param('id') id: string) {
    return this.sessionsService.getSession(id);
  }

  // SSE streaming endpoint
  @Sse(':id/stream')
  streamSession(@Param('id') id: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((observer) => {
      void (async () => {
        const session = await this.sessionsService.getSession(id);

        if (!session) {
          observer.error(new Error('Session not found'));
          return;
        }

        try {
          for (const response of session.responses) {
            const model = response.modelName;

            // Emit initial pending status
            observer.next({
              data: JSON.stringify({
                type: 'status',
                providerId: model,
                status: 'pending',
              }),
            });

            let content = '';
            const startTime = Date.now();

            try {
              // Stream chunks from AI
              for await (const chunk of this.aiService.generate(
                session.prompt,
                model,
              )) {
                const chunkContent = chunk.choices?.[0]?.delta?.content ?? '';
                if (chunkContent) {
                  content += chunkContent;

                  observer.next({
                    data: JSON.stringify({
                      type: 'chunk',
                      providerId: model,
                      chunk: chunkContent,
                    }),
                  });
                }
              }

              // Update DB response
              await this.sessionsService['prisma'].response.update({
                where: { id: response.id },
                data: { content, status: 'done' },
              });

              // Simple metrics
              const metrics = {
                latency_ms: Date.now() - startTime,
                tokens_output: Math.ceil(content.length / 4),
                cost: 0,
              };

              observer.next({
                data: JSON.stringify({
                  type: 'complete',
                  providerId: model,
                  metrics,
                }),
              });

              observer.next({
                data: JSON.stringify({
                  type: 'status',
                  providerId: model,
                  status: 'complete',
                }),
              });
            } catch (error: any) {
              console.error('AI generation error:', error);

              let errorMessage = 'Streaming failed';
              if (error.code === 'insufficient_quota' || error.status === 429) {
                errorMessage = 'You exceeded your current OpenAI quota.';
              }

              // Update DB with error
              await this.sessionsService['prisma'].response.update({
                where: { id: response.id },
                data: { status: 'error', content: errorMessage },
              });

              // Emit error event
              observer.next({
                data: JSON.stringify({
                  type: 'error',
                  providerId: model,
                  message: errorMessage,
                }),
              });
            }
          }

          observer.complete();
        } catch (err) {
          console.error('SSE streaming outer error:', err);
          observer.next({
            data: JSON.stringify({
              type: 'error',
              providerId: 'all',
              message: 'Streaming failed',
            }),
          });
          observer.complete();
        }
      })();

      return () => {
        console.log(`SSE connection closed for session ${id}`);
      };
    });
  }
}
