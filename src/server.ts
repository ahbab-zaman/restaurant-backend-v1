const APP_NAME = "Course Marketplace Backend";

async function startServer() {
  try {
    // Validate environment variables before loading the app (fail fast)
    const { env } = await import("./config/env.js");
    console.log(`[startup] Booting ${APP_NAME} in ${env.node_env} mode`);

    const [{ setupAuth }, { checkDatabaseConnection }, { default: app }] =
      await Promise.all([
        import("./modules/auth/auth.js"),
        import("./database/checkConnection.js"),
        import("./app.js"),
      ]);

    await setupAuth();
    console.log("[startup] Better Auth initialized");
    await checkDatabaseConnection();
    console.log("[startup] Database connection verified");

    app.listen(env.port, () => {
      console.log(
        `[startup] ${APP_NAME} listening on http://localhost:${env.port}`,
      );
    });
  } catch (err) {
    console.error(`[startup] Failed to start ${APP_NAME}:`, err);
    process.exit(1);
  }
}

startServer();
