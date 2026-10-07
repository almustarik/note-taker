import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { mongo } from 'mongoose';

@Catch(mongo.MongoServerError)
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: mongo.MongoServerError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception.code === 11000) {
      const keys = Object.keys(exception.keyPattern || {});
      const field = keys[0] || 'field';
      const formattedField = field.charAt(0).toUpperCase() + field.slice(1);
      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: `${formattedField} already in use`,
        error: 'Conflict',
      });
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
