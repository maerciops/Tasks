import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { checkTaskExists } from '../middlewares/check-tasks-exist'
import { z } from 'zod'
import { randomUUID } from 'crypto'

export async function tasksRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkSessionIdExists] }, async (request) => {
    const { sessionID } = request.cookies

    const tasks = await knex('tasks').where('session_id', sessionID).select()

    return { tasks }
  })

  app.get(
    '/search',
    { preHandler: [checkSessionIdExists] },
    async (request) => {
      const getTasksQuerySchema = z.object({
        title: z.string(),
        description: z.string().optional(),
      })

      const { sessionID } = request.cookies
      try {
        const { title, description } = getTasksQuerySchema.parse(request.query)

        const task = await knex('tasks')
          .where((builder) => {
            if (sessionID) builder.andWhere('session_id', sessionID)
            if (title) builder.orWhere('title', 'like', `%${title}%`)
            if (description !== undefined)
              builder.orWhere('description', 'like', `%${description}%`)
          })
          .first()

        return { task }
      } catch (error) {
        console.error(error)
        return { error: 'Erro na validação dos parâmetros da consulta' }
      }
    },
  )

  app.post(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const createTasksBodySchema = z.object({
        title: z.string(),
        description: z.string(),
      })

      const { title, description } = createTasksBodySchema.parse(request.body)

      let sessionID = request.cookies.sessionID

      if (!sessionID) {
        sessionID = randomUUID()

        reply.cookie('sessionID', sessionID, {
          path: './',
          maxAge: 60 * 60 * 24 * 7,
        })
      }

      await knex('tasks').insert({
        id: randomUUID(),
        session_id: sessionID,
        title,
        description,
      })

      return reply.status(201).send()
    },
  )

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExists, checkTaskExists] },
    async (request, reply) => {
      const getTaskParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getTaskParamsSchema.parse(request.params)

      try {
        await knex('tasks').where({ id }).del()

        return reply.send({ message: 'Tarefa excluída com sucesso' })
      } catch (error) {
        console.error(error)
        return reply.status(500).send({ error: 'Erro ao excluir a tarefa' })
      }
    },
  )

  app.patch(
    '/:id/complete',
    { preHandler: [checkSessionIdExists, checkTaskExists] },
    async (request, reply) => {
      const getTaskParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getTaskParamsSchema.parse(request.params)

      try {
        const resultCompletAt = await knex('tasks')
          .select('completed_at')
          .where({ id })

        await knex('tasks')
          .where({ id })
          .update({
            completed_at:
              resultCompletAt.length > 0 &&
              resultCompletAt[0].completed_at !== null
                ? (null as never)
                : knex.fn.now(),
          })

        return reply.send({ message: 'Tarefa atualizada com sucesso' })
      } catch (error) {
        console.error(error)
        return reply.status(500).send({ error: 'Erro ao atualizar a tarefa' })
      }
    },
  )

  app.put(
    '/:id',
    { preHandler: [checkSessionIdExists, checkTaskExists] },
    async (request, reply) => {
      const getTaskParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getTaskParamsSchema.parse(request.params)

      const getTasksQuerySchema = z.object({
        title: z.string(),
        description: z.string().optional(),
      })

      const { title, description } = getTasksQuerySchema.parse(request.query)

      try {
        if (title) await knex('tasks').where({ id }).update({ title })

        if (description)
          await knex('tasks').where({ id }).update({ description })

        return reply.send({ message: 'Tarefa atualizada com sucesso' })
      } catch (error) {
        console.error(error)
        return reply.status(500).send({ error: 'Erro ao atualizar a tarefa' })
      }
    },
  )
}
