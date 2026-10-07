import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../common/decorators.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) throw new UnauthorizedException();

    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync(token, { algorithms: ['HS256'] });
    } catch {
      throw new UnauthorizedException();
    }

    // load the user so deleted/demoted accounts lose access right away
    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException();

    request.user = { id: user._id, email: user.email, role: user.role };
    return true;
  }
}
