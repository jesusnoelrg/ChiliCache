declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      MODE?: string;
      API_URL?: string;
      REDIS_URL?: string;
      DATA_DIR?: string;
      ADMIN_PASSWORD?: string;
      NODE_ENV?: string;
      FLY_APP_NAME?: string;
      RENDER_EXTERNAL_HOSTNAME?: string;
    }
  }
}
export {};
