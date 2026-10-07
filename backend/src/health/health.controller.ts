import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Public } from '../common/decorators.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private connection: mongoose.Connection) {}

  @Public()
  @Get()
  check(@Res() res: Response) {
    const isDbConnected = this.connection.readyState === 1;
    const status = isDbConnected ? 'ok' : 'error';
    const httpStatus = isDbConnected ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(httpStatus).json({
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: isDbConnected ? 'connected' : 'disconnected',
    });
  }
}
