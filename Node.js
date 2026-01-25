import { closePool, pool, testConnection } from './Proyecto de Software CSU - COLSOF/db/connection.js'

export { pool }
export default pool

if (import.meta.url === `file://${process.argv[1]}`) {
  ;(async () => {
    console.log('Probando conexión con la base de datos...')
    try {
      const result = await testConnection()
      console.log('Conexión exitosa:')
      console.table(result)
    } catch (error) {
      console.error('Error al conectar:', error.message)
      if (error.stack) {
        console.error(error.stack)
      }
      process.exitCode = 1
    } finally {
      await closePool()
    }
  })()
}