import cookieParser from "cookie-parser";
import type { RequestHandler } from "express";

import { env } from "@/config/env";

export const cookieMiddleware: RequestHandler = cookieParser(env.COOKIES_SECRET);
