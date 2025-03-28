import { Context, Next } from 'hono';
import { config } from '../config/index.js';

export const authMiddleware = async (c: Context, next: Next) => {
  // Skip auth check if auth is disabled
  if (!config.auth.enabled) {
    return next();
  }

  const authHeader = c.req.header('Authorization');
  
  if (!authHeader) {
    return c.json({ error: 'Authorization header missing' }, 401);
  }
  
  const [scheme, token] = authHeader.split(' ');
  
  if (scheme !== 'Bearer' || !token) {
    return c.json({ error: 'Invalid authorization format. Use: Bearer TOKEN' }, 401);
  }
  
  if (token !== config.auth.apiKey) {
    return c.json({ error: 'Invalid API key' }, 401);
  }
  
  // If authentication succeeded, continue
  await next();
}; 