import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from 'src/service/auth.service';
import { jwtConfig } from 'src/jwtGuard/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
      refreshTokenSecret: jwtConfig.refreshTokenSecret,
    });
  }

  // async validate(payload: any) {
  //   return { userId: payload.userId };
  // }
  async validate(payload: any) {
    return { userId: payload.userId, role: payload.role };
  }
  
}
