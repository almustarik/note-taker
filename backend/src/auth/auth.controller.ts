import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser, Public } from '../common/decorators.js';
import type { AuthUser } from '../common/role.enum.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { LoginDto, RegisterDto, UpdateProfileDto } from './dto/auth.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.usersService.findOne(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.update(user.id, dto);
  }
}
