import { createClient } from 'redis';

export const Client = createClient({
  password: 'obQxh0adx2WS97N7ua8jorG6q7auAsu8',
  socket: {
      host: 'redis-10536.c262.us-east-1-3.ec2.cloud.redislabs.com',
      port: 10536
  }
});


