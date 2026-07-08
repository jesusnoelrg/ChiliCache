declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: number;
      MODE: string;
    }
  }
}
export {};   