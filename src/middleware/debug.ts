import { Context, Next } from 'hono';

export interface DebugMiddlewareOptions {
    includeRequestBody?: boolean;
    includeResponseBody?: boolean;
    includeHeaders?: boolean;
    maxBodyLength?: number;
    logLevel?: 'info' | 'debug' | 'verbose';
}

/**
 * Debug middleware to log request and response details
 */
export const debugMiddleware = (options: DebugMiddlewareOptions = {}) => {
    const {
        includeRequestBody = true,
        includeResponseBody = true,
        includeHeaders = true,
        maxBodyLength = 10000,
        logLevel = 'info'
    } = options;

    return async (c: Context, next: Next) => {
        const startTime = Date.now();

        // Log incoming request
        if (logLevel === 'verbose' || logLevel === 'debug') {
            console.log('\n🔍 [DEBUG MIDDLEWARE] ===== INCOMING REQUEST =====');
            console.log(`${c.req.method} ${c.req.path}`);
            console.log(`Timestamp: ${new Date().toISOString()}`);

            if (includeHeaders) {
                console.log('\n📋 REQUEST HEADERS:');
                Object.entries(c.req.header()).forEach(([key, value]) => {
                    // Mask sensitive headers
                    if (key.toLowerCase().includes('authorization')) {
                        console.log(`  ${key}: ${value.substring(0, 10)}...`);
                    } else {
                        console.log(`  ${key}: ${value}`);
                    }
                });
            }

            if (includeRequestBody && c.req.method !== 'GET') {
                try {
                    // Clone the request to avoid consuming it
                    const body = await c.req.text();
                    console.log('\n📄 REQUEST BODY:');
                    if (body.length > maxBodyLength) {
                        console.log(`${body.substring(0, maxBodyLength)}...\n[TRUNCATED - Body length: ${body.length} chars]`);
                    } else {
                        console.log(body || '[EMPTY BODY]');
                    }
                } catch (error) {
                    console.log('\n📄 REQUEST BODY: [ERROR READING BODY]');
                }
            }
        }

        // Continue with the request
        await next();

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Log outgoing response
        if (logLevel === 'verbose' || logLevel === 'debug') {
            console.log('\n📤 [DEBUG MIDDLEWARE] ===== OUTGOING RESPONSE =====');
            console.log(`Status: ${c.res.status}`);
            console.log(`Duration: ${duration}ms`);
            console.log(`Timestamp: ${new Date().toISOString()}`);

            if (includeHeaders) {
                console.log('\n📋 RESPONSE HEADERS:');
                c.res.headers.forEach((value, key) => {
                    console.log(`  ${key}: ${value}`);
                });
            }

            if (includeResponseBody) {
                try {
                    // Clone the response to avoid consuming it
                    const clonedResponse = c.res.clone();
                    const contentType = c.res.headers.get('content-type') || '';

                    console.log('\n📄 RESPONSE BODY:');
                    console.log(`Content-Type: ${contentType}`);

                    if (contentType.includes('application/json')) {
                        const jsonBody = await clonedResponse.json();
                        const bodyStr = JSON.stringify(jsonBody, null, 2);

                        if (bodyStr.length > maxBodyLength) {
                            console.log(`${bodyStr.substring(0, maxBodyLength)}...\n[TRUNCATED - Body length: ${bodyStr.length} chars]`);
                        } else {
                            console.log(bodyStr);
                        }
                    } else if (contentType.includes('text/')) {
                        const textBody = await clonedResponse.text();

                        if (textBody.length > maxBodyLength) {
                            console.log(`${textBody.substring(0, maxBodyLength)}...\n[TRUNCATED - Body length: ${textBody.length} chars]`);
                        } else {
                            console.log(textBody);
                        }
                    } else if (contentType.includes('text/event-stream')) {
                        console.log('[STREAMING RESPONSE - Body will be logged by stream handlers]');
                    } else {
                        console.log(`[BINARY/OTHER CONTENT - Content-Type: ${contentType}]`);
                        console.log(`Content-Length: ${c.res.headers.get('content-length') || 'unknown'}`);
                    }
                } catch (error) {
                    console.log(`[ERROR READING RESPONSE BODY: ${error}]`);
                }
            }

            console.log('===== END DEBUG MIDDLEWARE =====\n');
        } else if (logLevel === 'info') {
            // Simple one-line log for info level
            console.log(`🔍 ${c.req.method} ${c.req.path} → ${c.res.status} (${duration}ms)`);
        }
    };
};

/**
 * Quick debug middleware with default settings
 */
export const quickDebug = debugMiddleware({
    logLevel: 'debug',
    maxBodyLength: 5000
});

/**
 * Verbose debug middleware that logs everything
 */
export const verboseDebug = debugMiddleware({
    logLevel: 'verbose',
    maxBodyLength: 20000,
    includeRequestBody: true,
    includeResponseBody: true,
    includeHeaders: true
});

/**
 * Minimal debug middleware for production
 */
export const minimalDebug = debugMiddleware({
    logLevel: 'info',
    includeRequestBody: false,
    includeResponseBody: false,
    includeHeaders: false
}); 