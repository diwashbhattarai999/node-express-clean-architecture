import { createServer } from "node:http";

import { createApp } from "@/app/create-app";

import { env } from "./config/env.config";

const app = createApp();
const server = createServer(app);

const port = env.PORT;

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
