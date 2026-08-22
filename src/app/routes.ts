import { Router } from "express";

export const createRoutes = (): Router => {
	const router = Router();

	router.get("/health", (_request, response) => {
		response.status(200).json({
			status: "ok",
		});
	});

	return router;
};
