# =============================================================
# Script de deploy a AWS S3 + invalidación de CloudFront
# =============================================================
# USO:
#   .\deploy-s3.ps1 -Bucket "mi-bucket-name" -DistributionId "EXXXXXXXXXXXX"
#
# Si no usas CloudFront, omite el parámetro -DistributionId
# =============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$Bucket,

    [Parameter(Mandatory=$false)]
    [string]$DistributionId = ""
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EmoCheck - Deploy a AWS S3" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Build de producción
Write-Host "`n[1/4] Construyendo la app en modo producción..." -ForegroundColor Yellow
ng build --configuration production
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: El build falló." -ForegroundColor Red
    exit 1
}
Write-Host "Build completado." -ForegroundColor Green

# 2. Subir archivos con hash (JS, CSS) con cache larga (1 año)
Write-Host "`n[2/4] Subiendo archivos estáticos con hash (JS/CSS)..." -ForegroundColor Yellow
aws s3 sync dist/fuse/browser "s3://$Bucket" `
    --delete `
    --exclude "index.html" `
    --cache-control "max-age=31536000,public,immutable" `
    --metadata-directive REPLACE
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Falló la subida de archivos estáticos." -ForegroundColor Red
    exit 1
}
Write-Host "Archivos estáticos subidos." -ForegroundColor Green

# 3. Subir index.html SIN caché (siempre fresco)
Write-Host "`n[3/4] Subiendo index.html sin caché..." -ForegroundColor Yellow
aws s3 cp dist/fuse/browser/index.html "s3://$Bucket/index.html" `
    --cache-control "no-cache,no-store,must-revalidate" `
    --content-type "text/html" `
    --metadata-directive REPLACE
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Falló la subida de index.html." -ForegroundColor Red
    exit 1
}
Write-Host "index.html subido sin caché." -ForegroundColor Green

# 4. Invalidar CloudFront (si se proporcionó Distribution ID)
if ($DistributionId -ne "") {
    Write-Host "`n[4/4] Invalidando caché de CloudFront ($DistributionId)..." -ForegroundColor Yellow
    aws cloudfront create-invalidation `
        --distribution-id $DistributionId `
        --paths "/*"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ADVERTENCIA: Falló la invalidación de CloudFront." -ForegroundColor Red
    } else {
        Write-Host "Invalidación de CloudFront iniciada." -ForegroundColor Green
    }
} else {
    Write-Host "`n[4/4] Sin CloudFront configurado, omitiendo invalidación." -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Deploy completado exitosamente!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
