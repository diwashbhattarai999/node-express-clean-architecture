import { createServer } from 'node:http';

import { createApp } from "@/app/create-app";

const app = createApp();
const server = createServer(app);

const port = Number(process.env.PORT ?? 3000);

server.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
