import {Client} from '@/lib/database/redis';
import { NextResponse } from "next/server";

export async function GET(request: Request) {

  Client.connect();
  Client.on('error', err => console.log('Redis Client Error', err));
  await Client.hSet('key:123', 'field', 'value');
  const value = await Client.hGetAll('key:123');
  await Client.disconnect();
  return NextResponse.json({ message: "This Worked", success: true , value});
  
}