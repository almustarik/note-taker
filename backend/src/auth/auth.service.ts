import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service.js';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    return { token: this.signToken(user._id.toString()), user };
  }

  async login({ email, password }: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(email);
    // compare against a dummy hash when the email doesn't exist, so the response time
    // doesn't reveal which emails are registered
    const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
    if (!user || !valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const { password: _hash, ...safeUser } = user;
    return { token: this.signToken(user._id.toString()), user: safeUser };
  }

  private signToken(userId: string) {
    return this.jwtService.sign({ sub: userId });
  }
}
