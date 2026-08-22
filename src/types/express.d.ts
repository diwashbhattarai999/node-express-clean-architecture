import "node:http";

declare module "http" {
  interface IncomingMessage {
    requestId: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}
