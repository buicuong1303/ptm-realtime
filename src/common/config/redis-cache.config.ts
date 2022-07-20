import { ConfigModule } from '@nestjs/config';
export default class RedisCacheConfig {
  static getRedisConfig() {
    return {
      host: process.env.RDC_HOST,
      port: +process.env.RDC_PORT,
      password: process.env.RDC_PASSWD,
    }
  }
}
export const redisCacheConfigAsync = {
  imports: [ConfigModule],
  useFactory: async () => RedisCacheConfig.getRedisConfig(),
};
