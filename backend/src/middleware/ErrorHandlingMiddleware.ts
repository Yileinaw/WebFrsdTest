import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

// Basic error handling middleware
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[ErrorHandler] An error occurred:', err.stack); // Log the full error stack

  // Check if the error is from Multer (e.g., file size limit)
  if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `上传错误: ${err.message}` });
  } 
  // Check for custom error messages (e.g., file type filter)
  else if (err.message.includes('文件类型错误')) {
       return res.status(400).json({ message: err.message });
  }
  // Handle other errors
  else {
      // Avoid sending detailed internal errors to the client in production
      const statusCode = res.statusCode !== 200 ? res.statusCode : 500; // Use existing status code if set, otherwise 500
      const message = process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message || '服务器发生未知错误';
      
      res.status(statusCode).json({
          message: message,
          // Optionally include stack trace in development
          stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
      });
  }
}; 