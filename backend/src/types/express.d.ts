declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: 'customer' | 'admin'; email: string };
    }
  }
}

export {};
