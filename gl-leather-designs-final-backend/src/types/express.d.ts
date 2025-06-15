// src/types/express.d.ts
declare namespace Express {
  interface Request {
    file?: import('multer').File;
    user?: {
      id: number;
      email: string;
      role: string;
    };
  }
}