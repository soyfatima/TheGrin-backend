// config.ts
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
config();

export const jwtConfig = {
  secret:
    process.env.JWT_SECRET ||
    '87b848ba45e17a8a9e8f9b9076e50a8c3c80d24ac24c0525679cb3ef0d896177679d66b29188e73c3064165003609f3b95146bc37aca5ecde607e297c7f53af6',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || uuidv4(),
  expiresIn: '15m',
  refreshTokenExpiresIn: '1d',
};
