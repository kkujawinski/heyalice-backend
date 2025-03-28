import { Context, Next } from 'hono';
import type { ChatRequest } from '../types/index.js';

export const validateChatRequest = async (c: Context, next: Next) => {
  try {
    const body = await c.req.json() as ChatRequest;
    
    // Validate request
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return c.json({ error: 'Messages are required and must be an array' }, 400);
    }
    
    // Validate each message has required fields
    const invalidMessage = body.messages.find(msg => 
      !msg.role || 
      (typeof msg.content !== 'string' && (!Array.isArray(msg.content) || msg.content.length === 0))
    );
    
    if (invalidMessage) {
      return c.json({ 
        error: 'Each message must have a role and content (string or non-empty array)' 
      }, 400);
    }
    
    // Store validated request in context for handlers to use
    c.set('chatRequest', body);
    
    await next();
  } catch (error) {
    return c.json({ 
      error: 'Invalid JSON payload' 
    }, 400);
  }
}; 