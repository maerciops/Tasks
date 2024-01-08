import { FastifyReply, FastifyRequest } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'

export async function checkTaskExists(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const getTaskParamsSchema = z.object({
    id: z.string().uuid(),
  })
  const { id } = getTaskParamsSchema.parse(request.params)
  const existingTask = await knex('tasks').where({ id }).first()

  if (!existingTask) {
    return reply.status(404).send({ error: 'Tarefa não encontrada' })
  }
}
