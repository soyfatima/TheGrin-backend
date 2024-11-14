// jwtmodule.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from 'src/jwtGuard/config';
import { BannedGuard } from './banned.guard'; 
@Module({
  imports: [
    JwtModule.register({
      secret: jwtConfig.secret,
      signOptions: { expiresIn: jwtConfig.expiresIn },
    }),
  ],
  exports: [JwtModule],
})
export class JwtConfigModule {}
