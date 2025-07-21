import { ApiEndpoint } from '@/components/ApiEndpointDoc';

// Comprehensive API endpoint documentation data
export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'generate-image',
    method: 'POST',
    path: '/api/v1/generate',
    title: 'Generate Images',
    description:
      'Generate images using AI models from multiple providers with automatic fallback and smart routing.',
    authentication: 'required',
    parameters: {
      headers: [
        {
          name: 'Authorization',
          type: 'string',
          required: true,
          description: 'Bearer token for API authentication',
          format: 'Bearer YOUR_API_KEY',
          examples: ['Bearer sk-1234567890abcdef'],
        },
        {
          name: 'Content-Type',
          type: 'string',
          required: true,
          description: 'Content type of the request body',
          default: 'application/json',
          examples: ['application/json'],
        },
      ],
      body: [
        {
          name: 'prompt',
          type: 'string',
          required: true,
          description: 'Text description of the image you want to generate',
          examples: [
            'A beautiful sunset over mountains',
            'A futuristic city with flying cars',
            'A cute cat wearing a wizard hat',
          ],
        },
        {
          name: 'models',
          type: 'string | string[]',
          required: false,
          description:
            'Model selection strategy. Use "auto" for automatic selection or specify models explicitly',
          default: 'auto',
          examples: ['auto', ['openai:dall-e-3'], ['openai:dall-e-2', 'google:imagen-4-preview']],
        },
        {
          name: 'imageCount',
          type: 'integer',
          required: false,
          description: 'Number of images to generate per model',
          default: 1,
          examples: [1, 2, 4],
          format: 'Range: 1-10',
        },
      ],
    },
    responses: [
      {
        status: 200,
        description: 'Images generated successfully',
        example: {
          success: true,
          prompt: 'A beautiful sunset over mountains',
          imageCount: 1,
          totalCreditsUsed: 0.4,
          remainingCredits: 9.6,
          results: [
            {
              provider: 'openai',
              model: 'dall-e-3',
              creditsUsed: 0.4,
              images: [
                {
                  id: 'img_1234567890',
                  url: 'https://example.com/generated-image.jpg',
                  createdAt: '2024-01-15T10:30:00Z',
                },
              ],
            },
          ],
        },
      },
      {
        status: 400,
        description: 'Bad request - invalid parameters',
        example: {
          error: 'Missing or invalid prompt',
        },
      },
      {
        status: 401,
        description: 'Unauthorized - invalid or missing API key',
        example: {
          error: 'Missing or invalid Authorization header. Use: Authorization: Bearer YOUR_API_KEY',
        },
      },
      {
        status: 402,
        description: 'Insufficient credits',
        example: {
          error: 'Insufficient credits',
          required: 0.4,
          available: 0.2,
        },
      },
      {
        status: 500,
        description: 'Internal server error',
        example: {
          error: 'Internal server error',
        },
      },
    ],
    examples: {
      request: {
        method: 'POST',
        url: 'https://api.airouter.io/api/v1/generate',
        headers: {
          Authorization: 'Bearer YOUR_API_KEY',
          'Content-Type': 'application/json',
        },
        body: {
          prompt: 'A majestic dragon flying over a medieval castle',
          models: 'auto',
          imageCount: 1,
        },
      },
      response: {
        success: true,
        prompt: 'A majestic dragon flying over a medieval castle',
        imageCount: 1,
        totalCreditsUsed: 0.4,
        remainingCredits: 9.6,
        results: [
          {
            provider: 'openai',
            model: 'dall-e-3',
            creditsUsed: 0.4,
            images: [
              {
                id: 'img_1234567890',
                url: 'https://example.com/generated-image.jpg',
                createdAt: '2024-01-15T10:30:00Z',
              },
            ],
          },
        ],
      },
    },
    notes: [
      'Images are automatically stored and will be available for 7 days for free users, permanently for paid users',
      'Credit costs vary by provider and model - see pricing section for details',
      'Auto mode selects the best available models from all enabled providers',
      'Generated images are returned as secure URLs with limited-time access',
    ],
  },
  {
    id: 'get-providers',
    method: 'GET',
    path: '/api/providers',
    title: 'Get Available Providers',
    description: 'Retrieve information about available AI providers and their models.',
    authentication: 'none',
    responses: [
      {
        status: 200,
        description: 'List of available providers and models',
        example: {
          providers: {
            openai: {
              name: 'openai',
              displayName: 'OpenAI',
              shortDescription: 'OpenAI Image Generation',
              iconName: 'Wand2',
              color: 'from-pink-500 to-rose-600',
              badgeColor: 'bg-blue-500',
              enabled: true,
              models: [
                {
                  id: 'dall-e-3',
                  name: 'DALL-E 3',
                  description: 'Latest and most capable model ($0.04-$0.12/image)',
                  supportsImageCount: true,
                  maxImages: 1,
                  defaultImages: 1,
                  supportsImageEditing: false,
                },
              ],
            },
          },
          enabled: ['openai', 'google'],
          count: 2,
        },
      },
    ],
    examples: {
      request: {
        method: 'GET',
        url: 'https://api.airouter.io/api/providers',
      },
    },
    notes: [
      'This endpoint does not require authentication',
      'Use this to discover available models before making generation requests',
      'Provider availability may change based on service status',
    ],
  },
  {
    id: 'get-user-credits',
    method: 'GET',
    path: '/api/credits',
    title: 'Get User Credits',
    description: 'Retrieve current credit balance and usage information for authenticated user.',
    authentication: 'required',
    parameters: {
      headers: [
        {
          name: 'Authorization',
          type: 'string',
          required: true,
          description: 'Bearer token for API authentication',
          format: 'Bearer YOUR_API_KEY',
          examples: ['Bearer sk-1234567890abcdef'],
        },
      ],
    },
    responses: [
      {
        status: 200,
        description: 'Current credit information',
        example: {
          credits: 25.5,
          totalSpent: 14.5,
          totalEarned: 40.0,
          transactions: [
            {
              id: 'txn_123',
              type: 'usage',
              amount: -0.4,
              description: 'Generated image: A beautiful sunset',
              createdAt: '2024-01-15T10:30:00Z',
            },
          ],
        },
      },
      {
        status: 401,
        description: 'Unauthorized - invalid API key',
        example: {
          error: 'Invalid API key',
        },
      },
    ],
    examples: {
      request: {
        method: 'GET',
        url: 'https://api.airouter.io/api/credits',
        headers: {
          Authorization: 'Bearer YOUR_API_KEY',
        },
      },
    },
    notes: [
      'Credits are deducted automatically when generating images',
      'Transaction history shows recent credit usage and purchases',
      '1 credit = $0.10 USD',
    ],
  },
  {
    id: 'create-api-key',
    method: 'POST',
    path: '/api/api-key',
    title: 'Create API Key',
    description: 'Create a new API key for programmatic access to the AIRouter API.',
    authentication: 'required',
    parameters: {
      body: [
        {
          name: 'name',
          type: 'string',
          required: true,
          description: 'Descriptive name for the API key',
          examples: ['My App Integration', 'Production Key', 'Development Testing'],
        },
        {
          name: 'description',
          type: 'string',
          required: false,
          description: 'Optional description of the API key usage',
          examples: ['For production image generation', 'Testing new features'],
        },
      ],
    },
    responses: [
      {
        status: 201,
        description: 'API key created successfully',
        example: {
          id: 'key_1234567890',
          name: 'My App Integration',
          key: 'sk-1234567890abcdef',
          description: 'For production image generation',
          createdAt: '2024-01-15T10:30:00Z',
          lastUsed: null,
          isActive: true,
        },
      },
      {
        status: 400,
        description: 'Bad request - invalid parameters',
        example: {
          error: 'Name is required',
        },
      },
      {
        status: 401,
        description: 'Unauthorized - authentication required',
        example: {
          error: 'Authentication required',
        },
      },
    ],
    examples: {
      request: {
        method: 'POST',
        url: 'https://api.airouter.io/api/api-key',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          name: 'Production API Key',
          description: 'Key for production image generation service',
        },
      },
    },
    notes: [
      'API keys provide programmatic access to all generation endpoints',
      'Store API keys securely - they cannot be retrieved after creation',
      'API keys inherit the credit balance of the creating user',
      'You can create multiple API keys for different applications',
    ],
  },
  {
    id: 'list-images',
    method: 'GET',
    path: '/api/images',
    title: 'List Generated Images',
    description: 'Retrieve a list of images generated by the authenticated user.',
    authentication: 'required',
    parameters: {
      headers: [
        {
          name: 'Authorization',
          type: 'string',
          required: true,
          description: 'Bearer token for API authentication',
          format: 'Bearer YOUR_API_KEY',
          examples: ['Bearer sk-1234567890abcdef'],
        },
      ],
      query: [
        {
          name: 'limit',
          type: 'integer',
          required: false,
          description: 'Maximum number of images to return',
          default: 20,
          examples: [10, 20, 50],
          format: 'Range: 1-100',
        },
        {
          name: 'offset',
          type: 'integer',
          required: false,
          description: 'Number of images to skip for pagination',
          default: 0,
          examples: [0, 20, 40],
        },
        {
          name: 'provider',
          type: 'string',
          required: false,
          description: 'Filter by AI provider',
          enum: ['openai', 'google'],
          examples: ['openai', 'google'],
        },
        {
          name: 'model',
          type: 'string',
          required: false,
          description: 'Filter by specific model',
          examples: ['dall-e-3', 'imagen-4-preview'],
        },
      ],
    },
    responses: [
      {
        status: 200,
        description: 'List of generated images',
        example: {
          images: [
            {
              id: 'img_1234567890',
              prompt: 'A beautiful sunset over mountains',
              imageUrl: 'https://example.com/image.jpg',
              provider: 'openai',
              model: 'dall-e-3',
              width: 1024,
              height: 1024,
              createdAt: '2024-01-15T10:30:00Z',
              isFavorite: false,
            },
          ],
          total: 1,
          limit: 20,
          offset: 0,
        },
      },
      {
        status: 401,
        description: 'Unauthorized - invalid API key',
        example: {
          error: 'Invalid API key',
        },
      },
    ],
    examples: {
      request: {
        method: 'GET',
        url: 'https://api.airouter.io/api/images?limit=10&provider=openai',
        headers: {
          Authorization: 'Bearer YOUR_API_KEY',
        },
      },
    },
    notes: [
      'Images are ordered by creation date (newest first)',
      'Free users can only access images created within the last 7 days',
      'Paid users have permanent access to all generated images',
      'Image URLs are signed and have limited-time access for security',
    ],
  },
];

// Model-specific documentation types
interface ModelParameter {
  name: string;
  type: string;
  description: string;
  enum?: string[];
  default?: string | number | boolean;
  format?: string;
  required?: boolean;
}

interface ModelExample {
  prompt: string;
  settings: Record<string, unknown>;
  description?: string;
}

interface ModelDoc {
  name: string;
  description: string;
  capabilities: string[];
  pricing: string;
  creditCost?: number;
  parameters?: ModelParameter[];
  limitations?: string[];
  examples?: ModelExample[];
  status?: 'available' | 'unavailable' | 'limited';
  usageLimits?: {
    maxImages?: number;
    rateLimit?: string;
    concurrentRequests?: number;
  };
}

// Model-specific documentation
export const MODEL_DOCUMENTATION: Record<string, Record<string, ModelDoc>> = {
  openai: {
    'dall-e-3': {
      name: 'DALL-E 3',
      description:
        "OpenAI's most advanced image generation model with superior quality and prompt adherence. Features enhanced understanding of complex prompts and produces highly detailed, creative images with exceptional artistic quality.",
      capabilities: [
        'High-quality image generation (1024×1024, 1792×1024, 1024×1792)',
        'Excellent prompt following and understanding',
        'Creative and artistic outputs with vivid or natural styles',
        'HD quality option for enhanced detail and clarity',
        'Built-in safety filtering and content moderation',
        'Advanced understanding of artistic styles and techniques',
        'Superior handling of complex scene compositions',
        'Consistent character and object representation',
      ],
      pricing: '$0.04 for 1024×1024, $0.08 for HD quality',
      creditCost: 0.4,
      status: 'available',
      usageLimits: {
        maxImages: 1,
        rateLimit: '50 requests/minute',
        concurrentRequests: 3,
      },
      parameters: [
        {
          name: 'size',
          type: 'string',
          description:
            'Image dimensions - supports square and rectangular formats for different use cases',
          enum: ['1024x1024', '1792x1024', '1024x1792'],
          default: '1024x1024',
          required: false,
          format: 'width×height in pixels',
        },
        {
          name: 'quality',
          type: 'string',
          description:
            'Image quality level - HD provides enhanced detail and clarity at higher cost',
          enum: ['standard', 'hd'],
          default: 'standard',
          required: false,
        },
        {
          name: 'style',
          type: 'string',
          description:
            'Image style preference - vivid for hyper-real and dramatic, natural for more realistic and subdued',
          enum: ['vivid', 'natural'],
          default: 'vivid',
          required: false,
        },
      ],
      limitations: [
        'Maximum 1 image per request (no batch generation)',
        'No image editing, inpainting, or variation support',
        'Higher cost compared to DALL-E 2',
        'Cannot generate images of real people or public figures',
        'Limited to predefined aspect ratios',
        'No fine-tuning or custom model training',
      ],
      examples: [
        {
          prompt:
            'A serene Japanese garden with cherry blossoms in full bloom, traditional stone lanterns, and a peaceful koi pond',
          settings: { size: '1024x1024', quality: 'standard', style: 'natural' },
          description: 'Natural style for realistic garden scene with traditional elements',
        },
        {
          prompt:
            'A cyberpunk cityscape with neon lights and flying cars, rain-soaked streets reflecting colorful signs',
          settings: { size: '1792x1024', quality: 'hd', style: 'vivid' },
          description: 'Vivid style with HD quality for detailed futuristic scene',
        },
        {
          prompt:
            'An oil painting of a majestic mountain range at sunset, painted in the style of Albert Bierstadt',
          settings: { size: '1024x1792', quality: 'hd', style: 'natural' },
          description: 'Portrait orientation for landscape painting with artistic style reference',
        },
      ],
    },
    'dall-e-2': {
      name: 'DALL-E 2',
      description: 'Reliable and cost-effective image generation with editing capabilities.',
      capabilities: [
        'Fast image generation with multiple size options',
        'Multiple images per request (up to 10)',
        'Image editing and inpainting capabilities',
        'Image variations from existing images',
        'Cost-effective pricing',
      ],
      pricing: '$0.016-$0.02 per image depending on size',
      creditCost: 0.16,
      status: 'available',
      usageLimits: {
        maxImages: 10,
        rateLimit: '50 requests/minute',
        concurrentRequests: 5,
      },
      parameters: [
        {
          name: 'size',
          type: 'string',
          description: 'Image dimensions - smaller sizes are faster and cheaper',
          enum: ['256x256', '512x512', '1024x1024'],
          default: '1024x1024',
          required: false,
        },
        {
          name: 'n',
          type: 'integer',
          description: 'Number of images to generate in a single request',
          format: 'Range: 1-10',
          default: 1,
          required: false,
        },
      ],
      limitations: [
        'Lower quality than DALL-E 3',
        'Less accurate prompt following',
        'Limited to square image formats',
      ],
      examples: [
        {
          prompt: 'A futuristic cityscape at night with glowing skyscrapers',
          settings: { size: '1024x1024', n: 2 },
          description: 'Generate multiple variations of the same prompt',
        },
        {
          prompt: 'A cute robot playing with a cat in a cozy living room',
          settings: { size: '512x512', n: 4 },
          description: 'Smaller size for faster generation of multiple images',
        },
      ],
    },
    'gpt-image-1': {
      name: 'GPT Image 1',
      description: "OpenAI's latest model with token-based pricing and advanced capabilities.",
      capabilities: [
        'Token-based pricing model',
        'Advanced prompt understanding',
        'Image editing and manipulation',
        'Multiple images per request',
        'Integration with GPT models',
      ],
      pricing: '$0.011-$0.25 per image plus token costs',
      creditCost: 0.25,
      status: 'available',
      usageLimits: {
        maxImages: 10,
        rateLimit: '30 requests/minute',
        concurrentRequests: 3,
      },
      parameters: [
        {
          name: 'size',
          type: 'string',
          description: 'Image dimensions',
          enum: ['256x256', '512x512', '1024x1024'],
          default: '1024x1024',
          required: false,
        },
        {
          name: 'n',
          type: 'integer',
          description: 'Number of images to generate',
          format: 'Range: 1-10',
          default: 1,
          required: false,
        },
      ],
      limitations: ['Token-based pricing can be variable', 'Newer model with less usage data'],
      examples: [
        {
          prompt: 'A detailed architectural drawing of a modern house',
          settings: { size: '1024x1024', n: 1 },
          description: 'High-quality architectural visualization',
        },
      ],
    },
  },
  google: {
    'gemini-2.0-flash-preview-image-generation': {
      name: 'Gemini 2.0 Flash Preview',
      description: "Google's latest model for image generation and editing with flash speed.",
      capabilities: [
        'Ultra-fast image generation',
        'Image editing and manipulation',
        'Advanced prompt understanding',
        'Integration with Gemini AI',
        'Real-time generation capabilities',
      ],
      pricing: '$0.03 per image',
      creditCost: 0.3,
      status: 'available',
      usageLimits: {
        maxImages: 1,
        rateLimit: '60 requests/minute',
        concurrentRequests: 5,
      },
      parameters: [
        {
          name: 'sampleCount',
          type: 'integer',
          description: 'Number of images to generate',
          format: 'Range: 1-1',
          default: 1,
          required: false,
        },
      ],
      limitations: ['Preview model - may have occasional issues', 'Single image generation only'],
      examples: [
        {
          prompt: 'A lightning-fast cheetah running through a digital landscape',
          settings: { sampleCount: 1 },
          description: 'Showcase the flash speed theme',
        },
      ],
    },
    'imagen-4-preview': {
      name: 'Imagen 4 Preview',
      description: "Google's latest image generation model with improved quality and speed.",
      capabilities: [
        'High-quality generation with photorealistic results',
        'Fast processing and generation',
        'Multiple images per request (up to 8)',
        'Advanced prompt understanding and adherence',
        'Built-in safety filtering',
      ],
      pricing: '$0.04 per image',
      creditCost: 0.4,
      status: 'available',
      usageLimits: {
        maxImages: 8,
        rateLimit: '40 requests/minute',
        concurrentRequests: 4,
      },
      parameters: [
        {
          name: 'sampleCount',
          type: 'integer',
          description: 'Number of images to generate in a single request',
          format: 'Range: 1-8',
          default: 1,
          required: false,
        },
        {
          name: 'safetySetting',
          type: 'string',
          description: 'Content safety level - controls filtering strictness',
          enum: ['block_most', 'block_some', 'block_few'],
          default: 'block_few',
          required: false,
        },
      ],
      limitations: [
        'No image editing support',
        'Preview model - may have occasional issues',
        'Limited to square formats',
      ],
      examples: [
        {
          prompt: 'A magical forest with glowing mushrooms and fairy lights',
          settings: { sampleCount: 1, safetySetting: 'block_few' },
          description: 'Fantasy scene with minimal safety filtering',
        },
        {
          prompt: 'A professional headshot of a business person',
          settings: { sampleCount: 4, safetySetting: 'block_some' },
          description: 'Generate multiple professional portraits',
        },
      ],
    },
    'imagen-4-standard': {
      name: 'Imagen 4 Standard',
      description: 'Standard quality generation with reliable performance.',
      capabilities: [
        'Consistent quality generation',
        'Reliable performance',
        'Multiple images per request',
        'Good prompt adherence',
      ],
      pricing: '$0.04 per image',
      creditCost: 0.4,
      status: 'available',
      usageLimits: {
        maxImages: 8,
        rateLimit: '40 requests/minute',
        concurrentRequests: 4,
      },
      parameters: [
        {
          name: 'sampleCount',
          type: 'integer',
          description: 'Number of images to generate',
          format: 'Range: 1-8',
          default: 1,
          required: false,
        },
      ],
      limitations: ['No image editing support'],
      examples: [
        {
          prompt: 'A cozy coffee shop interior with warm lighting',
          settings: { sampleCount: 2 },
          description: 'Standard quality interior scene',
        },
      ],
    },
    'imagen-4-ultra': {
      name: 'Imagen 4 Ultra',
      description: 'Highest quality, premium tier with exceptional detail.',
      capabilities: [
        'Exceptional image quality',
        'Ultra-high detail and resolution',
        'Premium processing',
        'Best-in-class prompt adherence',
      ],
      pricing: '$0.06 per image',
      creditCost: 0.6,
      status: 'available',
      usageLimits: {
        maxImages: 8,
        rateLimit: '30 requests/minute',
        concurrentRequests: 2,
      },
      parameters: [
        {
          name: 'sampleCount',
          type: 'integer',
          description: 'Number of images to generate',
          format: 'Range: 1-8',
          default: 1,
          required: false,
        },
      ],
      limitations: [
        'Higher cost than other models',
        'Lower rate limits due to processing intensity',
      ],
      examples: [
        {
          prompt: 'An ultra-detailed macro photograph of a butterfly wing',
          settings: { sampleCount: 1 },
          description: 'Showcase ultra-high quality detail',
        },
      ],
    },
    'imagen-4-fast': {
      name: 'Imagen 4 Fast',
      description: 'Fast generation with good quality for rapid prototyping.',
      capabilities: [
        'Rapid image generation',
        'Good quality output',
        'Cost-effective pricing',
        'Multiple images per request',
      ],
      pricing: '$0.02 per image',
      creditCost: 0.2,
      status: 'available',
      usageLimits: {
        maxImages: 8,
        rateLimit: '60 requests/minute',
        concurrentRequests: 6,
      },
      parameters: [
        {
          name: 'sampleCount',
          type: 'integer',
          description: 'Number of images to generate',
          format: 'Range: 1-8',
          default: 1,
          required: false,
        },
      ],
      limitations: ['Lower quality than standard/ultra models'],
      examples: [
        {
          prompt: 'Quick concept art of a space station',
          settings: { sampleCount: 4 },
          description: 'Fast generation for concept iteration',
        },
      ],
    },
    'imagen-3': {
      name: 'Imagen 3',
      description: 'Stable version with reliable performance and proven results.',
      capabilities: [
        'Proven reliability',
        'Stable performance',
        'Good quality generation',
        'Multiple images per request',
      ],
      pricing: '$0.04 per image',
      creditCost: 0.4,
      status: 'available',
      usageLimits: {
        maxImages: 8,
        rateLimit: '40 requests/minute',
        concurrentRequests: 4,
      },
      parameters: [
        {
          name: 'sampleCount',
          type: 'integer',
          description: 'Number of images to generate',
          format: 'Range: 1-8',
          default: 1,
          required: false,
        },
      ],
      limitations: ['Older model with less advanced features'],
      examples: [
        {
          prompt: 'A traditional landscape painting of mountains and lakes',
          settings: { sampleCount: 2 },
          description: 'Reliable generation for traditional art styles',
        },
      ],
    },
    'imagen-3-fast': {
      name: 'Imagen 3 Fast',
      description: 'Fast generation with Imagen 3 quality.',
      capabilities: [
        'Fast generation speed',
        'Imagen 3 quality',
        'Cost-effective',
        'Multiple images per request',
      ],
      pricing: '$0.02 per image',
      creditCost: 0.2,
      status: 'available',
      usageLimits: {
        maxImages: 8,
        rateLimit: '60 requests/minute',
        concurrentRequests: 6,
      },
      parameters: [
        {
          name: 'sampleCount',
          type: 'integer',
          description: 'Number of images to generate',
          format: 'Range: 1-8',
          default: 1,
          required: false,
        },
      ],
      limitations: ['Older model base'],
      examples: [
        {
          prompt: 'A simple cartoon character design',
          settings: { sampleCount: 6 },
          description: 'Fast generation for character concepts',
        },
      ],
    },
  },
};

// Authentication documentation
export const AUTH_DOCUMENTATION = {
  overview: {
    title: 'API Authentication',
    description:
      "AIRouter uses API keys for authentication. Include your API key in the Authorization header of all requests. API keys provide secure access to all AIRouter API endpoints and are tied to your account's credit balance.",
    methods: [
      {
        name: 'Bearer Token',
        description: 'Include your API key as a Bearer token in the Authorization header',
        example: 'Authorization: Bearer YOUR_API_KEY',
      },
    ],
  },
  security: {
    title: 'Security Best Practices',
    practices: [
      'Store API keys securely and never expose them in client-side code',
      'Use environment variables to manage API keys in your applications',
      'Rotate API keys regularly for enhanced security',
      'Monitor API key usage through the dashboard',
      'Revoke unused or compromised API keys immediately',
      'Use separate API keys for different environments (development, staging, production)',
      'Set up IP restrictions for production API keys when possible',
      'Implement proper error handling to avoid exposing sensitive information',
      'Use HTTPS for all API requests to ensure encrypted communication',
      'Audit API key usage regularly to detect unusual patterns',
    ],
  },
  keyManagement: {
    title: 'API Key Management',
    description: 'Best practices for creating and managing your API keys',
    steps: [
      {
        title: 'Creating API Keys',
        description: 'Generate API keys from your AIRouter dashboard',
        instructions: [
          'Navigate to the API Keys section in your dashboard',
          'Click "New API Key" and provide a descriptive name',
          'Copy and securely store the generated key - it will only be shown once',
          "Consider adding a description to track the key's purpose",
        ],
      },
      {
        title: 'Using Multiple API Keys',
        description: 'Create separate keys for different applications or environments',
        benefits: [
          'Isolate usage and track consumption per application',
          'Limit exposure if a key is compromised',
          'Simplify key rotation without affecting all systems',
          'Apply different usage patterns and monitoring',
        ],
      },
      {
        title: 'Revoking API Keys',
        description: 'Immediately revoke keys that are no longer needed or compromised',
        instructions: [
          'Go to the API Keys section in your dashboard',
          'Find the key you want to revoke',
          'Click the delete button to permanently revoke access',
          'Generate a new key if needed for the same application',
        ],
      },
    ],
  },
  implementation: {
    title: 'Implementation Examples',
    examples: [
      {
        language: 'Node.js',
        code: `// Using environment variables for API key
const apiKey = process.env.AIROUTER_API_KEY;

// Making an authenticated request
const response = await fetch('https://api.airouter.io/api/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${apiKey}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'A beautiful sunset over mountains'
  })
});`,
      },
      {
        language: 'Python',
        code: `import os
import requests

# Using environment variables for API key
api_key = os.environ.get('AIROUTER_API_KEY')

# Making an authenticated request
response = requests.post(
    'https://api.airouter.io/api/v1/generate',
    headers={
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    },
    json={
        'prompt': 'A beautiful sunset over mountains'
    }
)`,
      },
    ],
  },
  errors: {
    title: 'Authentication Errors',
    common: [
      {
        code: 401,
        message: 'Missing or invalid Authorization header',
        solution: 'Ensure you include "Authorization: Bearer YOUR_API_KEY" in request headers',
        example: 'Authorization: Bearer sk-1234567890abcdef',
      },
      {
        code: 401,
        message: 'Invalid API key',
        solution: 'Verify your API key is correct and active in the dashboard',
        details:
          "Check for typos, ensure you're using the full key, and verify it's active in your dashboard",
      },
      {
        code: 403,
        message: 'API key disabled',
        solution: 'Check if your API key has been disabled in your dashboard',
        details: 'API keys can be disabled manually or automatically due to security concerns',
      },
      {
        code: 403,
        message: 'API key rate limit exceeded',
        solution: 'Reduce request frequency or wait until rate limit resets',
        details: 'Rate limits are applied per API key to ensure fair usage of the platform',
      },
      {
        code: 429,
        message: 'Too many requests',
        solution: 'Implement exponential backoff and retry logic in your application',
        details:
          'This error occurs when you exceed the allowed number of requests in a time period',
      },
    ],
    troubleshooting: [
      {
        issue: 'API key suddenly not working',
        steps: [
          'Check if the key has been revoked or disabled in your dashboard',
          "Verify you're using the correct key for the environment",
          "Check if you've reached your credit limit",
          'Review recent API usage for unusual patterns',
        ],
      },
      {
        issue: 'Getting intermittent authentication errors',
        steps: [
          'Implement proper error handling with retry logic',
          'Check your network connectivity and DNS resolution',
          'Verify your API key is properly stored and not being truncated',
          'Ensure your system clock is synchronized (for timestamp validation)',
        ],
      },
      {
        issue: 'API key exposed or compromised',
        steps: [
          'Immediately revoke the exposed API key',
          'Generate a new API key with a different name',
          'Update all applications to use the new key',
          'Review your code and deployment practices to prevent future exposure',
          'Consider implementing IP restrictions for additional security',
        ],
      },
    ],
  },
  bestPractices: {
    title: 'Authentication Best Practices',
    practices: [
      {
        title: 'Environment-specific Keys',
        description: 'Use different API keys for development, staging, and production environments',
        benefits:
          'Isolates usage tracking and prevents development testing from affecting production limits',
      },
      {
        title: 'Secure Storage',
        description:
          'Store API keys in environment variables or secure credential stores, never in code repositories',
        benefits: 'Prevents accidental exposure in version control or public repositories',
      },
      {
        title: 'Regular Rotation',
        description: 'Periodically generate new API keys and phase out old ones',
        benefits:
          'Limits the impact of undetected key exposure and improves overall security posture',
      },
      {
        title: 'Least Privilege',
        description:
          'Create specific API keys for specific purposes with minimal required permissions',
        benefits: 'Reduces potential damage if a key is compromised',
      },
      {
        title: 'Monitoring and Alerts',
        description: 'Set up usage monitoring and alerts for unusual API key activity',
        benefits: 'Early detection of potential security incidents or unexpected usage patterns',
      },
    ],
  },
};
