import fs from 'fs'
import { parse } from 'csv-parse'

import dirname from 'path'

const filePath = dirname.join(__dirname, 'ArqCSV.csv')

export async function processFile() {
  try {
    const records: string[] = []
    const parser = fs.createReadStream(filePath).pipe(
      parse({
        from_line: 2,
      }),
    )
    for await (const record of parser) {
      records.push(record)
    }
    return records
  } catch (error) {
    console.error(error + 'Erro na leitura do arquivo CSV.')
  }
}
