require("dotenv").config();

import app from "./app";
import { config } from "./config/env";
import { prisma } from "./shared/prisma/client";
import { createServer } from "http";

let isShuttingDown = false;

const httpServer = createServer(app);

const start = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log("Database connected");

    await new Promise<void>((resolve) => {
      httpServer.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
        resolve();
      });
    });

    // Keep the process alive explicitly
    httpServer.on("close", () => {
      console.log("HTTP server closed");
    });
  } catch (error) {
    console.error("Failed to start server", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: NodeJS.Signals): Promise<void> => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`${signal} received. Shutting down gracefully...`);

  await new Promise<void>((resolve, reject) => {
    httpServer.close((error?: Error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});

start();
