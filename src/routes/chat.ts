import { Hono } from 'hono';
import type { Context } from 'hono';
import { OpenAIService } from '../services/openai.js';
import { validateChatRequest } from '../middleware/validation.js';
import { errorHandler } from '../middleware/error.js';
import { authMiddleware } from '../middleware/auth.js';
import { transformMessages } from '../middleware/transform.js';
import { formatAsSSE } from '../utils/stream.js';
import type { ChatRequest } from '../types/index.js';
import { debugResponse } from '../utils/debug.js';

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
  
  // Debug incoming request
  console.log('\n📥 [Chat API] ===== INCOMING REQUEST DEBUG =====');
  console.log(`Method: ${c.req.method}`);
  console.log(`Path: ${c.req.path}`);
  console.log(`User-Agent: ${c.req.header('User-Agent') || 'Unknown'}`);
  console.log(`Content-Type: ${c.req.header('Content-Type') || 'Unknown'}`);
  console.log('\n📋 HEADERS:');
  Object.entries(c.req.header()).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  console.log('\n📄 BODY:');
  console.log(JSON.stringify(body, null, 2));
  console.log('===== END INCOMING REQUEST DEBUG =====\n');

  if (body.stream) {
    console.log('🌊 Generating streamed response');
    const rawStream = await openaiService.generateStreamedResponse(body);
    const formattedStream = formatAsSSE(rawStream);
    
    const responseHeaders = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    };

    // Debug outgoing streaming response headers
    console.log('\n📤 [Chat API] ===== OUTGOING STREAMING RESPONSE DEBUG =====');
    console.log('Status: 200 OK');
    console.log('Type: Streaming Response');
    console.log('\n📋 HEADERS:');
    Object.entries(responseHeaders).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('📄 BODY: [STREAMING - will be logged by stream debugger]');
    console.log('===== END OUTGOING STREAMING RESPONSE DEBUG =====\n');

    // For streaming in Hono, return the ReadableStream directly with proper headers
    return new Response(formattedStream, { headers: responseHeaders });
  } 
  
  console.log('📝 Generating standard response');
  const response = await openaiService.generateResponse(body);

  let finalResponse;
  // Ensure response is properly serializable
  if (response instanceof Response) {
    const jsonData = await response.json();
    finalResponse = c.json(jsonData);
  } else {
    finalResponse = c.json(response);
  }

  // Debug outgoing JSON response
  console.log('\n📤 [Chat API] ===== OUTGOING JSON RESPONSE DEBUG =====');
  console.log('Status: 200 OK');
  console.log('Type: JSON Response');
  console.log('\n📋 HEADERS:');
  console.log('  Content-Type: application/json');
  console.log('\n📄 BODY:');
  console.log(JSON.stringify(response instanceof Response ? await response.clone().json() : response, null, 2));
  console.log('===== END OUTGOING JSON RESPONSE DEBUG =====\n');

  return finalResponse;
});

export default router; 