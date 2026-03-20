/**
 * OpenAPI 3 spec for Swagger UI — keep in sync with routes in app.ts and route modules.
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Etihad Claims API',
    version: '1.0.0',
    description:
      'Backend API for claim intake, booking validation, receipt OCR preview, and case management. ' +
      'Most claim routes require a JWT from `POST /api/auth/login` (use **Authorize** with `Bearer <token>`).',
  },
  servers: [{ url: '/', description: 'Current host' }],
  tags: [
    { name: 'Health', description: 'Liveness and diagnostics' },
    { name: 'Auth', description: 'Authentication' },
    { name: 'Claims', description: 'Claims pipeline (JWT required)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorMessage: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              email: { type: 'string' },
              role: { type: 'string', enum: ['customer', 'admin'] },
            },
          },
        },
      },
      ValidateBookingRequest: {
        type: 'object',
        properties: {
          pnr: { type: 'string', description: 'Passenger booking reference' },
          lastName: { type: 'string' },
        },
      },
      ClaimPipelineEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          caseNumber: { type: 'string', nullable: true },
          status: { type: 'string', nullable: true },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
        },
      },
      UpdateClaimStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['Approved', 'Rejected', 'Pending Review', 'High Priority'],
          },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    ocrAvailable: { type: 'boolean' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/health/gemini-test': {
      get: {
        tags: ['Health'],
        summary: 'Gemini / OCR connectivity test',
        description: 'Runs a minimal OCR call to verify Generative AI is reachable.',
        responses: {
          '200': { description: 'Gemini reachable' },
          '503': { description: 'Gemini unavailable or error' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'JWT issued',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          '400': { description: 'Validation failed' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/api/claims/validate-booking': {
      post: {
        tags: ['Claims'],
        summary: 'Validate PNR / booking',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidateBookingRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Booking valid',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ClaimPipelineEnvelope' } },
            },
          },
          '400': { description: 'Validation failed' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/claims/preview-receipts': {
      post: {
        tags: ['Claims'],
        summary: 'Preview receipts (OCR only, no persistence)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  receipts: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'Receipt image files (max 20, 10 MB each)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'OCR results' },
          '400': { description: 'Bad request' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/claims/submit-with-receipts': {
      post: {
        tags: ['Claims'],
        summary: 'Submit claim with receipt files',
        description:
          'Multipart: `receipts[]`, `pnr`, `passengerName`, `email` (or from JWT for customers), optional `phone`, `flightDetails` (JSON string).',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  receipts: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                  },
                  pnr: { type: 'string' },
                  passengerName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  flightDetails: {
                    type: 'string',
                    description: 'JSON string of flight details object',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Claim created' },
          '400': { description: 'Validation / pipeline error' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/claims/submit-claim': {
      post: {
        tags: ['Claims'],
        summary: 'JSON claim submit (disabled)',
        deprecated: true,
        security: [{ bearerAuth: [] }],
        responses: {
          '410': { description: 'Use submit-with-receipts instead' },
        },
      },
    },
    '/api/claims': {
      get: {
        tags: ['Claims'],
        summary: 'List claims',
        description: 'Admins see all; customers see their own by email.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'List of claims' },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Claims'],
        summary: 'JSON body submit (disabled)',
        deprecated: true,
        security: [{ bearerAuth: [] }],
        responses: {
          '410': { description: 'Use submit-with-receipts instead' },
        },
      },
    },
    '/api/claims/{id}': {
      get: {
        tags: ['Claims'],
        summary: 'Get claim detail',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Claim detail' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not found' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/claims/{id}/status': {
      patch: {
        tags: ['Claims'],
        summary: 'Update claim status (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateClaimStatusRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Updated' },
          '400': { description: 'Invalid status' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not found' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
  },
};
