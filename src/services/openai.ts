import type { ChatRequest, ChatResponse } from '../types/index.js';
import { config } from '../config/index.js';

export class OpenAIService {
  private apiKey: string;
  private apiUrl = 'https://api.openai.com/v1/responses';
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || config.openai.apiKey;
    if (!this.apiKey) {
      console.warn('WARNING: No OpenAI API key provided');
    }
  }
  
  // Transform ChatGPT message format to Responses API format
  private transformMessages(messages: any[]): any[] {
    return messages.map(message => {
      // Only keep allowed fields for each message
      const { role, content } = message;
      const newMsg: any = { role };
      
      // Determine content type prefix based on role
      const isAssistant = role === 'assistant';
      const textType = isAssistant ? 'output_text' : 'input_text';
      const imageType = isAssistant ? null : 'input_image';
      
      // Transform content if it exists and is an array
      if (Array.isArray(content)) {
        newMsg.content = content.map((item: any) => {
          // For text content
          if (item.type === 'text') {
            return { type: textType, text: item.text };
          } 
          
          // For image content (only valid for user messages)
          if (item.type === 'image_url' && item.image_url && !isAssistant) {
            return { 
              type: 'input_image', 
              image_url: typeof item.image_url === 'string' 
                ? item.image_url 
                : item.image_url.url 
            };
          }
          
          // Already in correct format - check if compatible with role
          if (
            (item.type === 'input_text' && !isAssistant) || 
            (item.type === 'input_image' && !isAssistant) ||
            (item.type === 'output_text' && isAssistant) ||
            (item.type === 'refusal' && isAssistant)
          ) {
            return item;
          }
          
          // Content type not compatible with role
          if (isAssistant && (item.type === 'input_text' || item.type === 'input_image')) {
            // Convert input_text to output_text for assistant
            if (item.type === 'input_text') {
              return { type: 'output_text', text: item.text };
            }
            // Skip input_image for assistant
            return null;
          }
          
          // Skip unknown content types
          // console.warn(`Skipping unknown/incompatible content type: ${item.type} for role ${role}`);
          return null;
        }).filter(Boolean); // Remove null/undefined items
      } else if (typeof content === 'string') {
        // Convert string content to properly formatted array
        newMsg.content = [{ type: textType, text: content }];
      }
      
      return newMsg;
    });
  }
  
  async generateResponse(request: ChatRequest): Promise<ChatResponse> {
    try {
      const { 
        conversation_id, 
        messages, 
        model = 'gpt-4o', 
        tools = [],
        max_tokens,
        stream = false
      } = request;
      
      // Construct payload with only supported parameters
      const payload: Record<string, any> = {
        model,
        input: this.transformMessages(messages),
        stream
      };
      
      // Only add optional parameters if they exist
      if (conversation_id) {
        payload.previous_response_id = conversation_id;
      }
      
      if (tools && tools.length > 0) {
        payload.tools = this.prepareToolsConfig(tools as string[]);
      }
      
      if (max_tokens) {
        payload.max_output_tokens = max_tokens;
      }
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error details:', errorData);
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }
  
  async generateStreamedResponse(request: ChatRequest): Promise<ReadableStream> {
    try {
      // Set stream to true and use the same generate method
      const modifiedRequest = {
        ...request,
        stream: true
      };
      
      // Use the same payload construction logic
      const { 
        conversation_id, 
        messages, 
        model = 'gpt-4o', 
        tools = [],
        max_tokens
      } = modifiedRequest;
      
      // Construct payload with only supported parameters
      const payload: Record<string, any> = {
        model,
        input: this.transformMessages(messages),
        stream: true
      };
      
      // Only add optional parameters if they exist
      if (conversation_id) {
        payload.previous_response_id = conversation_id;
      }
      
      if (tools && tools.length > 0) {
        payload.tools = this.prepareToolsConfig(tools as string[]);
      }
      
      if (max_tokens) {
        payload.max_output_tokens = max_tokens;
      }
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error details:', errorData);
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }
      
      return response.body as ReadableStream;
    } catch (error) {
      console.error('Error generating streamed response:', error);
      throw error;
    }
  }
  
  prepareToolsConfig(toolNames: string[] = []): any[] {
    const toolsMap: Record<string, any> = {
      web_search: { type: 'web_search_preview' }
    };
    
    // Handle case where tools are already in correct format
    if (toolNames.length === 1 && typeof toolNames[0] === 'object') {
      return toolNames as any[];
    }
    
    return toolNames.map(name => toolsMap[name]).filter(Boolean);
  }
} 