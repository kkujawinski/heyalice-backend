// Types supporting both chat completion and responses API formats
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: MessageContent[] | string;
}

// Support both the old chat completion format and the new responses format
export type MessageContent = 
  // Chat completions API format
  | { type: 'text', text: string }
  | { type: 'image_url', image_url: string | { url: string } }
  // Responses API format
  | { type: 'input_text', text: string }
  | { type: 'input_image', image_url: string };

export interface ChatRequest {
  conversation_id?: string;
  messages: ChatMessage[];
  stream?: boolean;
  model?: string;
  tools?: any[];
  max_tokens?: number;
}

export interface ChatResponse {
  id: string;
  object: string;
  created_at: number;
  model: string;
  output: any[];
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
} 