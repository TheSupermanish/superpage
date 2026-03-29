import { Request, Response, NextFunction } from "express";

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: AppError | Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = (err as AppError).statusCode || 500;
  const message = err.message || "Internal server error";

  console.error(`[Error] ${req.method} ${req.path}:`, {
    statusCode,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  res.status(statusCode).json({
    error: {
      code: statusCode === 404 ? "NOT_FOUND"
        : statusCode === 400 ? "BAD_REQUEST"
        : statusCode === 401 ? "UNAUTHORIZED"
        : statusCode === 403 ? "FORBIDDEN"
        : statusCode === 429 ? "RATE_LIMITED"
        : "INTERNAL_ERROR",
      message,
    },
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
