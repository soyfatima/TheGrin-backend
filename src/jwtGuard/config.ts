// config.ts
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
config();

export const jwtConfig = {
  secret:
    process.env.JWT_SECRET ||
    '98b00ed2c4f2b3ad8d5e34428552e1d70e78e0d8845ef7ce5262a3858d5e9cb825b858a981b949ffb762b81ae9c15760378eb1f5c92408bf19cae42ef549fff6',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || uuidv4(),
  expiresIn: '15m',
  refreshTokenExpiresIn: '1d',
};
