import { createClient } from 'redis';

export const Client = createClient({
    url: process.env.REDIS_URL
});

export async function connect() {
  console.log(!Client.isOpen)
  if (!Client.isOpen) {
      await Client.connect();
  }
}

