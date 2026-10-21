import dotenv from 'dotenv';

dotenv.config();

const { default: app } = await import('./app.js');

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server backend "maduraa" berjalan di port ${port}`);
  console.log(`Health check: http://localhost:${port}/api/v1/health`);
});
