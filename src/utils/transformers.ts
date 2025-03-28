import type { ChatMessage } from '../types/index.js';
import type { MessageTransformFn } from '../middleware/transform.js';

/**
 * Example transformers for common message transformation tasks.
 * These can be registered with the messageTransformer.
 */

// Add system message at the beginning if none exists
export const addSystemMessage = (text: string): MessageTransformFn => {
  return (messages: ChatMessage[]): ChatMessage[] => {
    // Check if there's already a system message
    const hasSystemMessage = messages.some(msg => msg.role === 'system');
    
    if (!hasSystemMessage) {
      return [
        { role: 'system', content: text },
        ...messages
      ];
    }
    
    return messages;
  };
};

// Replace all system messages with a single one
export const replaceSystemMessages = (text: string): MessageTransformFn => {
  return (messages: ChatMessage[]): ChatMessage[] => {
    // Filter out existing system messages
    const nonSystemMessages = messages.filter(msg => msg.role !== 'system');
    
    // Add the new system message at the beginning
    return [
      { role: 'system', content: text },
      ...nonSystemMessages
    ];
  };
};

// Add a prefix to all user messages
export const prefixUserMessages = (prefix: string): MessageTransformFn => {
  return (messages: ChatMessage[]): ChatMessage[] => {
    return messages.map(msg => {
      if (msg.role === 'user') {
        if (typeof msg.content === 'string') {
          return {
            ...msg,
            content: `${prefix} ${msg.content}`
          };
        }
        // Handle array content case as well
        if (Array.isArray(msg.content)) {
          return {
            ...msg,
            content: msg.content.map(item => {
              if (item.type === 'text' || item.type === 'input_text') {
                return {
                  ...item,
                  text: `${prefix} ${item.text}`
                };
              }
              return item;
            })
          };
        }
      }
      return msg;
    });
  };
};

// Limit the message history length to control token usage
export const limitMessageHistory = (maxMessages: number): MessageTransformFn => {
  return (messages: ChatMessage[]): ChatMessage[] => {
    // Always preserve system messages
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const nonSystemMessages = messages.filter(msg => msg.role !== 'system');
    
    // Keep only the most recent messages (excluding system)
    const recentNonSystemMessages = nonSystemMessages.slice(-maxMessages);
    
    // Combine and return
    return [...systemMessages, ...recentNonSystemMessages];
  };
}; 