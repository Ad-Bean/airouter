# AIRouter API Testing Guide

## Testing the Image Generation API

You can test the AIRouter API using curl, Postman, or any HTTP client.

### Prerequisites

1. Start the development server:

```bash
npm run dev
```

2. Set up your API keys in `.env.local`:

```bash
OPENAI_API_KEY=your_key_here
STABILITY_API_KEY=your_key_here
REPLICATE_API_TOKEN=your_key_here
```

### Check Available Providers

```bash
curl http://localhost:3000/api/providers
```

Expected response:

```json
{
  "providers": {
    "openai": {
      "name": "openai",
      "displayName": "OpenAI DALL-E",
      "enabled": true,
      "models": [...]
    }
  },
  "enabled": ["openai"],
  "count": 1
}
```

### Generate an Image

#### Using OpenAI DALL-E

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A futuristic cityscape at sunset",
    "provider": "openai",
    "width": 1024,
    "height": 1024
  }'
```

#### Using Stability AI

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cute robot reading a book",
    "provider": "stability",
    "width": 1024,
    "height": 1024,
    "steps": 20
  }'
```

#### Using Replicate

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Abstract geometric patterns",
    "provider": "replicate",
    "width": 1024,
    "height": 1024,
    "steps": 20
  }'
```

### Expected Response

```json
{
  "success": true,
  "provider": "openai",
  "model": "dall-e-3",
  "images": ["https://oaidalleapiprodscus.blob.core.windows.net/..."],
  "usage": {
    "total_tokens": 25
  }
}
```

### Error Handling

If an API key is missing or invalid:

```json
{
  "error": "Provider openai is not available. Please check your API configuration."
}
```

If the prompt is missing:

```json
{
  "error": "Prompt is required"
}
```

## Testing the Web Interface

1. Open http://localhost:3000 in your browser
2. Enter a prompt in the text field
3. Select a provider from the dropdown
4. Click "Generate"
5. Wait for the image to be generated and displayed

The interface includes:

- Real-time loading indicators
- Error handling with user-friendly messages
- Image preview with zoom functionality
- Provider status checking

## Performance Notes

- **OpenAI DALL-E**: ~5-15 seconds
- **Stability AI**: ~10-30 seconds
- **Replicate**: ~15-45 seconds (varies by model)

Generation times depend on:

- Provider server load
- Image complexity
- Selected model
- Image dimensions
