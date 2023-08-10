'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { kv } from '@vercel/kv'
import {Client, connect} from '@/lib/database/redis';
import { auth } from '@/auth'
import { type Chat } from '@/lib/types'

export async function getChats(userId?: string | null) {

  if (!userId) {
    return []
  }
  await connect();

  try{ 
   
    const chats: string[] = await Client.zRange(`user:chat:${userId}`, 0, -1, {REV: true})
      let getChats = []
      for (const chat of chats) {
         const response = await Client.hGetAll(chat)
         response?.chat ? getChats.push(JSON.parse(response.chat)): null
      }
      console.log(getChats, 'GetAllChats...')
      // await Client.disconnect();
    return getChats as Chat[]
  
  }catch(error){
    return []
  }

  
  // try {
  //   const pipeline = kv.pipeline()
  //   const chats: string[] = await kv.zrange(`user:chat:${userId}`, 0, -1, {rev: true})
   
  //   for (const chat of chats) {
  //     pipeline.hgetall(chat)
  //   }

  //   const results = await pipeline.exec()

  //   return results as Chat[]
  // } catch (error) {
  //   return []
  // }
}

export async function getChat(id: string, userId: string) {

  // const chat = await kv.hgetall<Chat>(`chat:${id}`)

  await connect();
  const response = await Client.hGetAll(`chat:${id}`)
  const chat = response.chat ? JSON.parse(response.chat) : null
  console.log( chat ,'GetChat...')
  if (!chat || (userId && chat.userId !== userId)) {
    return null
  }
  // await Client.disconnect();
  return chat
}

export async function removeChat({ id, path }: { id: string; path: string }) {

  const session = await auth()

  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  await connect();

  // const uid = await kv.hget<string>(`chat:${id}`, 'userId')
  const chat = await Client.hGet(`chat:${id}`, 'chat')
  const uid = chat? JSON.parse(chat).userId : null
  console.log(uid,  "RemoveChat...")

  if (uid !== session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }


  // await kv.del(`chat:${id}`)
  // await kv.zrem(`user:chat:${session.user.id}`, `chat:${id}`)

  await Client.hDel(`chat:${id}`, 'chat')
  await Client.zRem(`user:chat:${session.user.id}`, `chat:${id}`)
  // await Client.disconnect();
  revalidatePath('/')
  return revalidatePath(path)
}

export async function clearChats() {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  // const chats: string[] = await kv.zrange(`user:chat:${session.user.id}`, 0, -1)
  
  await connect();

  const chats: string[] = await Client.zRange(`user:chat:${session.user.id}`, 0, -1, {REV: true})

  if (!chats.length) {
  return redirect('/')
  }

  console.log(chats, 'clearChats' )

  for (const chat of chats) {
    await Client.hDel(chat, 'chat')
    await Client.zRem(`user:chat:${session.user.id}`, chat)
  }


  // const pipeline = kv.pipeline()

  // for (const chat of chats) {
  //   pipeline.del(chat)
  //   pipeline.zrem(`user:chat:${session.user.id}`, chat)
  // }

  // await pipeline.exec()

  revalidatePath('/')
  return redirect('/')
}

export async function getSharedChat(id: string) {


  await connect();
  const response = await Client.hGetAll(`chat:${id}`)
  const chat = response.chat ? JSON.parse(response.chat) : null
  console.log( chat ,'getSharedChat...')


  // const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || !chat.sharePath) {
    return null
  }

  return chat
}

export async function shareChat(chat: Chat) {
  const session = await auth()

  if (!session?.user?.id || session.user.id !== chat.userId) {
    return {
      error: 'Unauthorized'
    }
  }

  const payload = {
    ...chat,
    sharePath: `/share/${chat.id}`
  }

  await connect();
  await Client.hSet(`chat:${chat.id}`, 'chat', JSON.stringify(payload));

  // await kv.hmset(`chat:${chat.id}`, payload)

  return payload
}
