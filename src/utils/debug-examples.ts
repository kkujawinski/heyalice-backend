/**
 * Examples of how to use the debug utilities
 * 
 * This file shows various ways to implement debug logging for:
 * - HTTP requests and responses
 * - Streaming responses
 * - Using debug middleware
 */

import { debugResponse, debugRequest, debugFetch, debugStreamResponse } from './debug.js';

// Example 1: Debug a simple fetch request
export async function exampleDebugFetch() {
    try {
        const response = await debugFetch('https://api.example.com/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer your-token-here'
            },
            body: JSON.stringify({ message: 'Hello World' })
        }, {
            label: 'Example API Call',
            maxBodyLength: 2000
        });

        const data = await response.json();
        console.log('✅ Request completed successfully:', data);
    } catch (error) {
        console.error('❌ Request failed:', error);
    }
}

// Example 2: Debug just the response from an existing fetch
export async function exampleDebugResponse() {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');

        // Debug the response
        await debugResponse(response, {
            label: 'JSONPlaceholder API',
            includeHeaders: true,
            includeBody: true,
            maxBodyLength: 1000
        });

        // You can still use the response normally
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('❌ Failed to fetch data:', error);
    }
}

// Example 3: Debug a streaming response
export async function exampleDebugStream() {
    try {
        const response = await fetch('https://api.example.com/stream', {
            method: 'POST',
            headers: { 'Accept': 'text/event-stream' }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Debug the stream response
        const debuggedStream = debugStreamResponse(response.body!, {
            label: 'Streaming API Response'
        });

        // Process the debugged stream
        const reader = debuggedStream.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Process each chunk
            const chunk = new TextDecoder().decode(value);
            console.log('📦 Processing chunk:', chunk);
        }
    } catch (error) {
        console.error('❌ Stream processing failed:', error);
    }
}

// Example 4: Debug outgoing request only
export function exampleDebugRequestOnly() {
    const requestData = {
        messages: [
            { role: 'user', content: 'Hello, how are you?' }
        ],
        model: 'gpt-4',
        stream: false
    };

    debugRequest('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sk-...'
        },
        body: JSON.stringify(requestData)
    }, {
        label: 'OpenAI API Request',
        maxBodyLength: 3000
    });
}

// Example 5: Usage patterns for different scenarios
export const debugPatterns = {
    // For API calls with minimal logging
    minimal: {
        includeBody: false,
        includeHeaders: false,
        label: 'Quick Check'
    },

    // For development debugging
    development: {
        includeBody: true,
        includeHeaders: true,
        maxBodyLength: 10000,
        label: 'Dev Debug'
    },

    // For production troubleshooting
    production: {
        includeBody: false,
        includeHeaders: true,
        maxBodyLength: 1000,
        label: 'Prod Debug'
    },

    // For streaming responses
    streaming: {
        includeBody: false, // Don't try to read stream body
        includeHeaders: true,
        label: 'Stream Debug'
    }
};

// Example 6: How to integrate with existing error handling
export async function exampleWithErrorHandling() {
    try {
        const response = await fetch('https://api.example.com/data');

        // Always debug the response
        await debugResponse(response, {
            label: 'API Response',
            includeHeaders: true,
            includeBody: true
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('🚨 API call failed with error:', error);
        throw error;
    }
} 