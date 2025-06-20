import { Hono } from 'hono';
import type { Context } from 'hono';
import { OpenAIService } from '../services/openai.js';
import { validateChatRequest } from '../middleware/validation.js';
import { errorHandler } from '../middleware/error.js';
import { authMiddleware } from '../middleware/auth.js';
import { transformMessages } from '../middleware/transform.js';
import { formatAsSSE } from '../utils/stream.js';
import type { ChatRequest } from '../types/index.js';

// Create router with types
type Variables = {
  chatRequest: ChatRequest;
};

const router = new Hono<{ Variables: Variables }>();
const openaiService = new OpenAIService();

// Apply error handler to all routes
router.use('*', errorHandler);

// Apply auth middleware to all API routes
router.use('/api/*', authMiddleware);

// Apply transformation after validation but before handling
router.post('/api/chat', validateChatRequest, transformMessages, async (c: Context<{ Variables: Variables }>) => {
  const body = c.get('chatRequest');
  
  if (body.stream) {
    console.log('Generating streamed response');
    const rawStream = await openaiService.generateStreamedResponse(body);
    const formattedStream = formatAsSSE(rawStream);
    
    // For streaming in Hono, return the ReadableStream directly with proper headers
    return new Response(formattedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });
  } 
  
  console.log('Generating standard response');
  const response = await openaiService.generateResponse(body);

  // Transform to OpenAI-compatible format
  let openAIResponse;
  // Map all output_text from the assistant's content array to choices
  const choices = response.output
    .filter((item: any) => item.role === 'assistant' && Array.isArray(item.content))
    .flatMap((item: any) =>
      item.content
        .filter((c: any) => c.type === 'output_text' && typeof c.text === 'string')
        .map((c: any) => ({ message: { content: c.text } }))
    );
  openAIResponse = {
    choices: choices.length > 0 ? choices : [ { message: { content: '' } } ]
  };

  return c.json(openAIResponse);
});

export default router; 