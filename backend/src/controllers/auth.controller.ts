/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { validateCredentials, signToken } from '../services/auth.service';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const email = typeof req.body?.email === 'string' ? req.body.email : '';
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      if (!email.trim() || !password) {
        res.status(400).json({ error: 'Validation failed', message: 'Email and password are required' });
        return;
      }
      const result = await validateCredentials(email, password);
      if ('error' in result) {
        res.status(401).json({ error: 'Unauthorized', message: result.error });
        return;
      }
      const { user } = result;
      const token = signToken({
        userId: user.id,
        role: user.role,
        email: user.email.toLowerCase(),
      });
      res.json({
        token,
        user: {
          email: user.email,
          role: user.role,
        },
      });
    } catch (e) {
      console.error('login error:', e);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const authController = new AuthController();
