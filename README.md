<img src="https://cloud.overment.com/alice-1743156021.png" width="150" style="border-radius: 8px;" />

# Alice app custom back-end

The following project is a starter template that you can use with heyalice.app and its "Custom Apps" feature; when connected, the Alice app becomes a UI for your own back-end, which you can fully customize to your needs.

## Features

- Chat Response API with Chat Completion conversion for Alice app
- Image support via OpenAI
- Web search integration
- Stream and non-stream response options

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and add your OpenAI API key; if you want to secure the connection, put a random string in API_KEY
3. Install dependencies:
   ```
   bun install
   ```
4. Start the development server:
   ```
   bun run dev
   ```
   
## Connect to the Alice app

1. In the Alice app go to the Settings -> Apps
2. Add new connection
3. Set server URL to localhost:3000 (or whenever this app will be available)
4. Add model from [OpenAI](https://platform.openai.com/docs/models)
5. Open new chat and switch to this model using list in the left bottom corner
6. Customize this back-end however you want. Just make sure that responses will match OpenAI Chat completion format. 

<img src="https://cloud.overment.com/2025-03-28/alice-apps-5abce342-c.png" width="600" />

## License

MIT
