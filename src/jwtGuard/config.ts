// config.ts
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
config();

export const jwtConfig = {
  secret:
    process.env.JWT_SECRET ||
    '40d6d29df5c74a8424a0e0a58b9e8ad5f9537c91d4182a8dedf6f2f33bcba7bf26e5c4251ad5095858868233dbc3416cc6713aaacb5f41389efb8e0c23c3b951',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || uuidv4(),
  expiresIn: '15m',
  refreshTokenExpiresIn: '1d',
};
