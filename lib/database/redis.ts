import { createClient } from 'redis';

export const Client = createClient({
    url: process.env.REDIS_URL
});

export async function connect() {
  if (!Client.isOpen) {
      await Client.connect();
  }
}

Client.on('connect', () => {
  console.log('Connected to Redis');
});

Client.on('error', err => {
  console.error('Error connecting to Redis:', err);
});

Client.on('end', () => {
  console.log('Connection to Redis has ended');
});


