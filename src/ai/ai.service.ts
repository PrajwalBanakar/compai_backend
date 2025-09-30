/* eslint-disable prettier/prettier */
// src/ai/ai.service.ts

// Service to interact with OpenAI API
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import type { ChatCompletionChunk } from "openai/resources/chat/completions";

@Injectable()
export class AIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async *generate(prompt: string, model: string): AsyncGenerator<ChatCompletionChunk> {
    const response = await this.client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    // Forward the async iterator
    for await (const chunk of response) {
      yield chunk;
    }
  }
}
