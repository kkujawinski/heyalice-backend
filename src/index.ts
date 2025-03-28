import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import chatRouter from './routes/chat.js'
import { config } from './config/index.js'
import { errorHandler } from './middleware/error.js'
import { messageTransformer } from './middleware/transform.js'
import { limitMessageHistory, replaceSystemMessages } from './utils/transformers.js'

// Check for required API key
if (!config.openai.apiKey) {
  console.warn('WARNING: OPENAI_API_KEY environment variable is not set')
}

// Register message transformers (examples)
messageTransformer
  // Example: Replace all system messages with a single one
  // .addTransform(replaceSystemMessages('You are a helpful AI assistant who speaks in the style of a pirate.'))
  .addTransform(limitMessageHistory(20));

const app = new Hono()

app.use('*', logger())
app.use('*', errorHandler)


app.get('/', (c) => c.text('Down the Rabbit Hole'))
app.route('', chatRouter)

serve({
  fetch: app.fetch,
  port: config.server.port
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
  console.log(`API Authentication: ${config.auth.enabled ? 'Enabled' : 'Disabled'}`)
})
