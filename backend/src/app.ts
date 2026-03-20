import express from 'express';
import cors from 'cors';
import claimRoutes from './routes/claim.routes';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/errorHandler';
import { ocrService } from './services/ocr.service';

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    ocrAvailable: ocrService.isAvailable(),
    timestamp: new Date().toISOString()
  });
});

// Diagnostic endpoint to test Gemini API connectivity
app.get('/api/health/gemini-test', async (req, res) => {
  try {
    console.log('[Diagnostic] Testing Gemini API connectivity...');
    
    const testBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    
    const result = await ocrService.extractFromImage(testBuffer, 'image/png');
    
    if ('error' in result) {
      console.error('[Diagnostic] Gemini test failed:', result.error);
      return res.status(503).json({ 
        geminiConnectivity: 'failed',
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('[Diagnostic] Gemini API test successful');
    res.json({ 
      geminiConnectivity: 'success',
      confidence: result.confidence,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Diagnostic] Gemini connectivity test error:', message);
    res.status(503).json({ 
      geminiConnectivity: 'error',
      error: message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/claims', claimRoutes);

// Error Handler
app.use(errorHandler);

export default app;
