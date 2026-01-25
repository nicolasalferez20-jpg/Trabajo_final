import fs from 'fs'

const envPath = 'C:\\Users\\Ankoku\\Documents\\REPOCITORIOS GITHUB\\Trabajo_final\\Config.env'
const envContent = `DATABASE_URL="postgresql://postgres.ocoblumeyursvefwrgjo:Proyecto_csu@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=10"`

fs.writeFileSync(envPath, envContent, 'utf-8')
console.log(`✅ Config.env creado en: ${envPath}`)
