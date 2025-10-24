# Script untuk menjalankan init-database.sql ke Railway PostgreSQL
# Pastikan psql sudah terinstall atau gunakan Railway CLI

# Method 1: Menggunakan psql langsung
# psql "postgresql://postgres:NlqNrkkfhgrxPcIhmEZYfRLYNeNWFVJE@postgres.railway.internal:5432/railway" -f scripts/init-database.sql

# Method 2: Menggunakan Railway CLI (jika sudah login)
# railway connect postgres
# psql -f scripts/init-database.sql

# Method 3: Copy-paste manual ke Railway Dashboard
# 1. Buka Railway Dashboard
# 2. Pilih project PostgreSQL
# 3. Klik "Query" tab
# 4. Copy isi file scripts/init-database.sql
# 5. Paste dan klik "Run"

Write-Host "File SQL sudah dibuat di: scripts/init-database.sql"
Write-Host "Cara menjalankan:"
Write-Host "1. Buka Railway Dashboard -> PostgreSQL -> Query tab"
Write-Host "2. Copy isi file scripts/init-database.sql"
Write-Host "3. Paste dan klik Run"
Write-Host ""
Write-Host "Atau gunakan psql command:"
Write-Host 'psql "postgresql://postgres:NlqNrkkfhgrxPcIhmEZYfRLYNeNWFVJE@postgres.railway.internal:5432/railway" -f scripts/init-database.sql'
