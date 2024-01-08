import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import { tasksRoutes } from './routes/tasks'
import { processFile } from './utils/csv-parser'

export const app = Fastify()

app.register(cookie)
app.register(tasksRoutes, { prefix: 'tasks' })

async function EnviarArquivoCSV() {
  const tasks = await processFile()
  const cookiesDefault = 'sessionID=d4ca4903-e4b3-46ce-b7ef-5e2622106e80'
  const tasksArray = tasks ?? []
  const jsonTasks = tasksArray.map(([title, description]) => ({
    title,
    description,
  }))
  for await (const record of jsonTasks) {
    try {
      app.inject({
        method: 'POST',
        url: '/tasks',
        payload: record,
        headers: { cookie: cookiesDefault },
      })
    } catch (error) {
      console.error(error + 'Erro ao enviar a task: ' + record.title)
    }
  }
}

EnviarArquivoCSV()
