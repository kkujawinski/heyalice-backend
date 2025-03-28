import { Context, Next } from 'hono';
import type { ChatRequest, ChatMessage } from '../types/index.js';

export type MessageTransformFn = (messages: ChatMessage[]) => ChatMessage[];

export class MessageTransformer {
  private transformFunctions: MessageTransformFn[] = [];

  // Add a transformation function to the pipeline
  addTransform(fn: MessageTransformFn) {
    this.transformFunctions.push(fn);
    return this;
  }

  // Apply all registered transformations to messages
  transform(messages: ChatMessage[]): ChatMessage[] {
    return this.transformFunctions.reduce(
      (msgs, fn) => fn(msgs), 
      [...messages] // Create a copy to avoid modifying the original
    );
  }

  // Clear all transformation functions
  clearTransforms() {
    this.transformFunctions = [];
    return this;
  }
}

// Create a singleton instance for app-wide use
export const messageTransformer = new MessageTransformer();

// Middleware to apply message transformations
export const transformMessages = async (c: Context, next: Next) => {
  const request = c.get('chatRequest') as ChatRequest;
  
  if (request && Array.isArray(request.messages)) {
    // Apply all registered transformations
    const transformedMessages = messageTransformer.transform(request.messages);
    
    // Update the request with transformed messages
    request.messages = transformedMessages;
    
    // Store back in context
    c.set('chatRequest', request);
    
    console.log('Messages transformed:', {
      originalCount: request.messages.length,
      transformedCount: transformedMessages.length
    });
  }
  
  await next();
}; 