import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from 'src/service/auth.service';
import { jwtConfig } from 'src/jwtGuard/config';
import { CustomLogger } from 'src/logger/logger.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService,
    private readonly logger: CustomLogger,

  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
      refreshTokenSecret: jwtConfig.refreshTokenSecret,
    });
  }

  async validate(payload: any) {
    if (!payload.userId || !payload.role) {
      this.logger.error('Invalid payload: userId or role is missing');
      throw new UnauthorizedException('Invalid token payload');
    }
    return { userId: payload.userId, role: payload.role };
  }
  

}
