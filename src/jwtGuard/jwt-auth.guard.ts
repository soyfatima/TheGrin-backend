import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy'; // Import your custom JwtStrategy

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly jwtStrategy: JwtStrategy) {
    super();
  }
  // Override the handleRequest method to use the custom JwtStrategy
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const request = context.switchToHttp().getRequest();
    // Validate the token with the custom JwtStrategy
    await this.jwtStrategy.validate(request.user);

    return true;
  }
}
