# upload_to_supabase.ps1
# Script PowerShell para criar bucket "conecta_ebd" no Supabase, compactar o projeto e enviar o arquivo ZIP.

# Tokens fornecidos (substitua se necessário)
$anonToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2eHJ5dXRhZm9mbXZ6aXFlYWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2MDMxOTksImV4cCI6MjEwMzE3OTE5OX0.TKlCeOuyRnfUqzxhiWCNsRECw_gMCi7dL2gsrvgoDpA"
$serviceRoleToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2eHJ5dXRhZm9mbXZ6aXFlYWh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzYwMzE5OSwiZXhwIjoyMTAzMTc5MTk5fQ.OU1I6EQ1T1RMYxYGhcz_4_KMSqn0QTRH7DvJMCZ6cjY"

# Configurações do Supabase
$projectRef = "bvxryutafofmvziqeahu"
$baseUrl = "https://${projectRef}.supabase.co"
$bucketName = "conecta_ebd"

function Create-BucketIfNotExists {
    $uri = "$baseUrl/storage/v1/bucket"
    $headers = @{"Authorization" = "Bearer $serviceRoleToken"}
    $body = @{name = $bucketName} | ConvertTo-Json
    # Verifica se o bucket já existe
    $listUri = "$uri?name=$bucketName"
    $existing = Invoke-RestMethod -Method Get -Uri $listUri -Headers $headers -ErrorAction SilentlyContinue
    if ($existing -and $existing.buckets -and $existing.buckets.Count -gt 0) {
        Write-Host "Bucket '$bucketName' já existe."
        return
    }
    Write-Host "Criando bucket '$bucketName'..."
    Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "Bucket criado."
}

function Compress-Project {
    $zipPath = "project.zip"
    # Remove zip antigo se existir
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    # Exclui a pasta .git se existir e o próprio script
    $exclude = @(".git", "scripts")
    $items = Get-ChildItem -Path . -Recurse -File | Where-Object { $exclude -notcontains $_.Directory.Name }
    Write-Host "Compactando projeto em $zipPath..."
    Compress-Archive -Path $items.FullName -DestinationPath $zipPath -Force
    Write-Host "Compactação concluída."
    return $zipPath
}

function Upload-FileToBucket($filePath) {
    $fileName = [System.IO.Path]::GetFileName($filePath)
    $uri = "$baseUrl/storage/v1/object/$bucketName/$fileName"
    $headers = @{"Authorization" = "Bearer $serviceRoleToken"}
    Write-Host "Enviando $fileName para o bucket..."
    Invoke-WebRequest -Method Put -Uri $uri -Headers $headers -InFile $filePath -ContentType "application/zip"
    Write-Host "Upload concluído."
}

# Execução
Create-BucketIfNotExists
$zipFile = Compress-Project
Upload-FileToBucket $zipFile
