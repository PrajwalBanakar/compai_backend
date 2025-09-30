/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

//Sessions Service handling DB and AI interactions
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AIService } from '../ai/ai.service';

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AIService, // inject AIService
  ) {}

  async createSession(prompt: string) {
    // 1. Create session + response records
    const session = await this.prisma.session.create({
      data: {
        prompt,
        responses: {
          create: [
            { modelName: 'gpt-5-mini', status: 'pending' },
            { modelName: 'gpt-3.5-turbo', status: 'pending' },
          ],
        },
      },
      include: { responses: true },
    });

    // 2. Trigger AI calls for each response (fire & forget)
    session.responses.forEach(response => {
      void this.generateAIResponse(response.id, prompt, response.modelName);
    });

    return session;
  }

  async getSession(id: string) {
    return this.prisma.session.findUnique({
      where: { id },
      include: { responses: true },
    });
  }

  private async generateAIResponse(
  responseId: string,
  prompt: string,
  model: string
) {
  try {
    let content = '';
    let tokenCount = 0;
    const startTime = Date.now();

    // Stream chunks from OpenAI
    for await (const chunk of this.aiService.generate(prompt, model)) {
      const chunkContent = chunk.choices?.[0]?.delta?.content ?? '';
      if (chunkContent) {
        content += chunkContent;

        // Approximate token count (simple heuristic: 1 token ≈ 4 chars)
        tokenCount += Math.ceil(chunkContent.length / 4);

        // Send chunk event with metrics via SSE if needed
        // (You could also implement an event emitter here)
      }
    }

    const latency_ms = Date.now() - startTime;

    // Estimate cost (example rates; adjust according to your plan)
    const costPer1kTokens: Record<string, number> = {
      'gpt-5-mini': 0.002, // $0.002 per 1k tokens
      'gpt-3.5-turbo': 0.0015,
    };
    const cost = ((tokenCount / 1000) * (costPer1kTokens[model] || 0)).toFixed(6);

    // Update the response record with content, status, and metrics
    await this.prisma.response.update({
      where: { id: responseId },
      data: {
        content,
        status: 'done',
        metrics: {
          latency_ms,
          tokens_output: tokenCount,
          cost: parseFloat(cost),
        },
      },
    });
  } catch (error) {
    console.error('AI generation error:', error);
      let errorMessage = 'AI generation failed';
  if (error.code === 'insufficient_quota' || error.status === 429) {
    errorMessage = 'You exceeded your current OpenAI quota.';
  }
    await this.prisma.response.update({
      where: { id: responseId },
      data: { status: 'error', content: errorMessage },
    });
  }
}
}
