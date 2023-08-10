import { kv } from '@vercel/kv'
import {Client, connect} from '@/lib/database/redis';
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { Configuration, OpenAIApi } from 'openai-edge'
import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

// export const runtime = 'edge'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})

const openai = new OpenAIApi(configuration)

export async function POST(req: Request) {

  const json = await req.json()
  const { messages, previewToken } = json
  const userId = (await auth())?.user.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  if (previewToken) {
    configuration.apiKey = previewToken
  }

  const res = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.7,
    stream: true
  })

  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
      const title = json.messages[0].content.substring(0, 100)
      const id = json.id ?? nanoid()
      const createdAt = Date.now()
      const path = `/chat/${id}`
      const payload = {
        id,
        title,
        userId,
        createdAt,
        path,
        messages: [
          ...messages,
          {
            content: completion,
            role: 'assistant'
          }
        ]
      }

      await connect();
      await Client.hSet(`chat:${id}`, 'chat', JSON.stringify(payload));
      await Client.zAdd(`user:chat:${userId}`, {
        score: createdAt,
        value: `chat:${id}`
      })
      // await Client.disconnect();
      

      // const payloadN = {
      //   id: 'cpygw5Y',
      //   title: 'What is a "serverless function"?',
      //   userId: 87199809,
      //   createdAt: 1691669925285,
      //   path: '/chat/cpygw5Y',
      //   messages: [
      //     { role: 'user', content: 'What is a "serverless function"?' },
      //     {
      //       content: 'A serverless function, also known as a function as a service (FaaS), is a cloud computing model where developers can write and execute code without needing to manage or provision servers. In a serverless architecture, the cloud provider takes care of the infrastructure, automatically scaling the resources based on demand.\n' +
      //         '\n' +
      //         "Serverless functions are event-driven and execute in a stateless manner. They are typically used for small, self-contained tasks or microservices. Developers can write code for specific functions, upload it to the cloud provider's platform, and then trigger the execution of those functions through events such as HTTP requests, database changes, or timers.\n" +
      //         '\n' +
      //         'Serverless functions offer several benefits, including reduced operational overhead, automatic scalability, and pay-as-you-go pricing based on actual usage. They allow developers to focus on writing code and building applications without worrying about server management or infrastructure provisioning.',
      //       role: 'assistant'
      //     }
      //   ]
      // }

      // await Client.hSet(`chat:cpygw5Y`, "dataset", JSON.stringify(payloadN));
      
      // await Client.hSet(`chat:${id}`, 'chat', JSON.stringify(payload));


      // await Client.zAdd(`user:chat:87199809`, JSON.stringify({ score: 1691669925285, members: "chat:cpygw5Y"}));
     
      // await Client.zAdd('user:chat:87199809', {score: 1691669925285  , value : `chat:${id}`})

      // await Client.disconnect();
      
      // await kv.hmset(`chat:${id}`, payload)
      // await kv.zadd(`user:chat:${userId}`, {
      //   score: createdAt,
      //   member: `chat:${id}`
      // })
    }
  })

  return new StreamingTextResponse(stream)
}
