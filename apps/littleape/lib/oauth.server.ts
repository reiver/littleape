import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
export const getInstanceClientCredentials = async (instance: string) => {
  const credentials = await redis.get<string>(`instance_${process.env.NEXT_PUBLIC_IS_DEBUG_MODE}_${instance}`.toLowerCase());
  if (credentials) {
    try {
      return credentials as unknown as { client_id: string, client_secret: string };
    } catch {
      return undefined;
    }
  }
}

export const setInstanceClientCredentials = async (instance: string, clientId: string, clientSecret: string) => {
  const credentials = JSON.stringify({ client_id: clientId, client_secret: clientSecret });
  await redis.set(`instance_${process.env.NEXT_PUBLIC_IS_DEBUG_MODE}_${instance}`.toLowerCase(), credentials);
};
