import createCors from "cors";
import { env } from "./env.js";

const origin = env.isProduction
  ? env.corsOrigin
    ? env.corsOrigin.split(",").map((s) => s.trim())
    : false
  : true;

const cors = createCors({
  origin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

export { cors };
