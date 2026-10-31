import { Redis } from "ioredis";

export type CreateBullMqConnectionOptions = {
  url: string;
  maxRetriesPerRequest: number | null;
  enableOfflineQueue: boolean;
};

export const createBullMqConnection = (options: CreateBullMqConnectionOptions): Redis =>
  new Redis(options.url, {
    maxRetriesPerRequest: options.maxRetriesPerRequest,
    enableOfflineQueue: options.enableOfflineQueue,
  });

export const createProducerConnection = (url: string): Redis =>
  createBullMqConnection({
    url,
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
  });

export const createWorkerConnection = (url: string): Redis =>
  createBullMqConnection({
    url,
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
  });
