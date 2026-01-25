import { closePool, testConnection } from './connection.js'

async function main() {
  console.log('Probando conexión con la base de datos...')
  const result = await testConnection()
  console.log('Conexión exitosa:')
  console.table(result)
}

main()
  .then(() => closePool())
  .catch(async (error) => {
    console.error('Error al conectar:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    await closePool()
    process.exitCode = 1
  })
