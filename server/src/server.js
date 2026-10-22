import { env } from './config/env.js';

const { default: app } = await import('./app.js');

const port = env.port;

app.listen(port, () => {
  console.log(`Server backend "maduraa" berjalan di port ${port}`);
  console.log(`Health check: http://localhost:${port}/api/v1/health`);
});
