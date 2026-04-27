import { Router } from "express";
import { healthController } from "./health.controller.js";

const router = Router();

// demo route
router.get("/", healthController.health);

export const healthRoutes = router;
