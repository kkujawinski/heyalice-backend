export interface DebugOptions {
    includeBody?: boolean;
    includeHeaders?: boolean;
    maxBodyLength?: number;
    label?: string;
}

/**
 * Debug utility to print HTTP response details including headers and content
 */
export const debugResponse = async (
    response: Response,
    options: DebugOptions = {}
): Promise<void> => {
    const {
        includeBody = true,
        includeHeaders = true,
        maxBodyLength = 10000,
        label = 'Response Debug'
    } = options;

    console.log(`\n🔍 [${label}] ===== RESPONSE DEBUG =====`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`URL: ${response.url}`);
    console.log(`Type: ${response.type}`);
    console.log(`OK: ${response.ok}`);
    console.log(`Redirected: ${response.redirected}`);

    if (includeHeaders) {
        console.log('\n📋 HEADERS:');
        response.headers.forEach((value, key) => {
            console.log(`  ${key}: ${value}`);
        });
    }

    if (includeBody) {
        try {
            // Clone the response to avoid consuming the body
            const clonedResponse = response.clone();
            const contentType = response.headers.get('content-type') || '';

            console.log('\n📄 BODY:');
            console.log(`Content-Type: ${contentType}`);

            if (contentType.includes('application/json')) {
                const jsonBody = await clonedResponse.json();
                const bodyStr = JSON.stringify(jsonBody, null, 2);

                if (bodyStr.length > maxBodyLength) {
                    console.log(`${bodyStr.substring(0, maxBodyLength)}...\n[TRUNCATED - Body length: ${bodyStr.length} chars]`);
                } else {
                    console.log(bodyStr);
                }
            } else if (contentType.includes('text/') || contentType.includes('application/javascript')) {
                const textBody = await clonedResponse.text();

                if (textBody.length > maxBodyLength) {
                    console.log(`${textBody.substring(0, maxBodyLength)}...\n[TRUNCATED - Body length: ${textBody.length} chars]`);
                } else {
                    console.log(textBody);
                }
            } else if (contentType.includes('text/event-stream')) {
                console.log('[STREAMING RESPONSE - Cannot display full content]');
                console.log('Stream will be processed separately');
            } else {
                console.log(`[BINARY/OTHER CONTENT - Content-Type: ${contentType}]`);
                console.log(`Content-Length: ${response.headers.get('content-length') || 'unknown'}`);
            }
        } catch (error) {
            console.log(`[ERROR READING BODY: ${error}]`);
        }
    }

    console.log(`===== END ${label} =====\n`);
};

/**
 * Debug utility for streaming responses
 */
export const debugStreamResponse = (
    stream: ReadableStream,
    options: DebugOptions = {}
): ReadableStream => {
    const { label = 'Stream Debug' } = options;

    console.log(`\n🌊 [${label}] ===== STREAM DEBUG =====`);

    return new ReadableStream({
        start(controller) {
            const reader = stream.getReader();

            const pump = (): Promise<void> => {
                return reader.read().then(({ done, value }) => {
                    if (done) {
                        console.log(`===== END ${label} =====\n`);
                        controller.close();
                        return;
                    }

                    // Log the chunk content
                    if (value) {
                        const chunk = new TextDecoder().decode(value);
                        console.log(`📦 Stream Chunk: ${chunk}`);
                    }

                    controller.enqueue(value);
                    return pump();
                });
            };

            return pump();
        }
    });
};

/**
 * Debug utility to print request details before making API calls
 */
export const debugRequest = (
    url: string,
    options: RequestInit,
    debugOptions: DebugOptions = {}
): void => {
    const {
        includeBody = true,
        includeHeaders = true,
        maxBodyLength = 10000,
        label = 'Request Debug'
    } = debugOptions;

    console.log(`\n📤 [${label}] ===== REQUEST DEBUG =====`);
    console.log(`Method: ${options.method || 'GET'}`);
    console.log(`URL: ${url}`);

    if (includeHeaders && options.headers) {
        console.log('\n📋 HEADERS:');
        const headers = options.headers as Record<string, string>;
        Object.entries(headers).forEach(([key, value]) => {
            // Mask sensitive headers
            if (key.toLowerCase().includes('authorization')) {
                console.log(`  ${key}: ${value.substring(0, 10)}...`);
            } else {
                console.log(`  ${key}: ${value}`);
            }
        });
    }

    if (includeBody && options.body) {
        console.log('\n📄 BODY:');
        const bodyStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body, null, 2);

        if (bodyStr.length > maxBodyLength) {
            console.log(`${bodyStr.substring(0, maxBodyLength)}...\n[TRUNCATED - Body length: ${bodyStr.length} chars]`);
        } else {
            console.log(bodyStr);
        }
    }

    console.log(`===== END ${label} =====\n`);
};

/**
 * Convenience function to debug both request and response
 */
export const debugFetch = async (
    url: string,
    options: RequestInit = {},
    debugOptions: DebugOptions = {}
): Promise<Response> => {
    debugRequest(url, options, { ...debugOptions, label: `${debugOptions.label || 'Fetch'} - Request` });

    const response = await fetch(url, options);

    await debugResponse(response, { ...debugOptions, label: `${debugOptions.label || 'Fetch'} - Response` });

    return response;
}; 