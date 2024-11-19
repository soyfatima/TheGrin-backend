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
//    console.log('Decoded JWT Payload:', JSON.stringify(payload, null, 2)); 
    if (!payload.userId || !payload.role) {
      this.logger.error('Invalid payload: userId or role is missing');
      throw new UnauthorizedException('Invalid token payload');
    }
    //this.logger.log(`UserId: ${payload.userId}, Role: ${payload.role}`);
    return { userId: payload.userId, role: payload.role };
  }
  

}
