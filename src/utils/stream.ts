/**
 * Transforms OpenAI Response API events into Chat Completion API format
 */
export function formatAsSSE(stream: ReadableStream): ReadableStream {
  const reader = stream.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      let jsonBuffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // Send final [DONE] message
            const doneEvent = encoder.encode('data: [DONE]\n\n');
            controller.enqueue(doneEvent);
            break;
          }

          // Decode the chunk
          const chunk = decoder.decode(value);

          // Handle multiple events in one chunk
          const events = chunk.split('\n\n').filter(Boolean);

          for (const event of events) {
            // Skip empty events
            if (!event.trim()) continue;

            console.log('Full event:', event);

            // Parse the event data
            const lines = event.split('\n');
            const eventType = lines[0].startsWith('event: ')
              ? lines[0].slice(7)
              : 'message';

            const dataLine = lines.find(line => line.startsWith('data: '));
            if (!dataLine) continue;
            const jsonString = dataLine.slice(6).trim();
            if (!jsonString) continue;

            // Buffering logic for incomplete JSON
            jsonBuffer += jsonString;
            let responseData;
            try {
              responseData = JSON.parse(jsonBuffer);
              jsonBuffer = ''; // Clear buffer on success
            } catch (error) {
              // If error is due to incomplete JSON, wait for more data
              if (error instanceof SyntaxError) {
                // Wait for next chunk to complete JSON
                continue;
              } else {
                console.error('Error processing event:', error, '\nProblematic JSON:', jsonBuffer);
                jsonBuffer = '';
                continue;
              }
            }

            // Transform to chat completion format
            let completionEvent;

            if (eventType === 'response.output_text.delta') {
              // Handle text delta
              completionEvent = {
                id: responseData.item_id || 'chatcmpl-unknown',
                object: 'chat.completion.chunk',
                choices: [{
                  delta: {
                    content: responseData.delta || ''
                  }
                }]
              };
            } else if (eventType === 'response.created') {
              // Initial response - send empty delta
              completionEvent = {
                id: responseData.response?.id || 'chatcmpl-unknown',
                object: 'chat.completion.chunk',
                choices: [{
                  delta: {
                    role: 'assistant'
                  }
                }]
              };
            } else if (eventType === 'response.completed') {
              // Skip completion event as we'll send [DONE] instead
              continue;
            } else {
              // Skip other event types
              continue;
            }

            // Format as SSE
            const formattedEvent = `data: ${JSON.stringify(completionEvent)}\n\n`;
            controller.enqueue(encoder.encode(formattedEvent));
          }

          controller.close();
        }
      } catch (error) {
        console.error('Error processing stream:', error);
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },

    cancel() {
      reader.releaseLock();
    }
  });
}

/**
 * Utility to convert a server-sent events (SSE) ReadableStream to a more usable format
 * for frontend consumption, transforming and parsing the event data
 */
export async function* processSSEStream(stream: ReadableStream): AsyncGenerator<any, void, unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process complete events in buffer
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        if (!event.trim()) continue;

        // Extract event type and data
        const lines = event.split('\n');
        const eventType = lines[0].startsWith('event: ')
          ? lines[0].slice(7)
          : 'message';

        const dataLine = lines.find(line => line.startsWith('data: '));

        if (dataLine) {
          try {
            const data = JSON.parse(dataLine.slice(6));
            yield { type: eventType, data };
          } catch (error) {
            console.error('Error parsing SSE data:', error);
          }
        }
      }
    }

    // Process any remaining data in buffer
    if (buffer.trim()) {
      const lines = buffer.split('\n');
      const dataLine = lines.find(line => line.startsWith('data: '));

      if (dataLine) {
        try {
          const data = JSON.parse(dataLine.slice(6));
          yield { type: 'message', data };
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
} 