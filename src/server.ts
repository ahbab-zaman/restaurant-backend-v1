import app from './app';
import { config } from './config/env';
import { prisma } from './shared/prisma/client';

const start = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('Database connected');
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();