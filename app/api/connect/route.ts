import {Client, connect} from '@/lib/database/redis';
import { NextResponse } from "next/server";

export async function GET(request: Request) {

  await connect();

  await Client.hSet('key:125', 'field', 'value');

  const value = await Client.hGetAll('key:123');

  return NextResponse.json({ message: "This Worked", success: true , value});
  
}