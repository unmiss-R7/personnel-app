Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\public\icons\logo.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source logo not found at $srcPath"
    exit 1
}

$srcImage = [System.Drawing.Image]::FromFile($srcPath)
Write-Output "Source logo loaded: $($srcImage.Width)x$($srcImage.Height)"

function Resize-And-Save {
    param(
        [System.Drawing.Image]$source,
        [int]$width,
        [int]$height,
        [string]$destPath,
        [System.Drawing.Imaging.ImageFormat]$format
    )

    $destBmp = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($destBmp)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $graphics.DrawImage($source, 0, 0, $width, $height)
    $graphics.Dispose()

    # If destination directory doesn't exist, create it
    $dir = [System.IO.Path]::GetDirectoryName($destPath)
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    if (Test-Path $destPath) {
        Remove-Item $destPath -Force
    }

    $destBmp.Save($destPath, $format)
    $destBmp.Dispose()
    Write-Output "Generated: $destPath ($width x $height)"
}

$pngFormat = [System.Drawing.Imaging.ImageFormat]::Png
$icoFormat = [System.Drawing.Imaging.ImageFormat]::Icon

# 1. Favicons
Resize-And-Save $srcImage 64 64 (Join-Path $PSScriptRoot "..\public\favicon.png") $pngFormat
Resize-And-Save $srcImage 32 32 (Join-Path $PSScriptRoot "..\public\favicon.ico") $icoFormat

# 2. Apple Touch Icons
Resize-And-Save $srcImage 180 180 (Join-Path $PSScriptRoot "..\public\icons\apple-touch-icon.png") $pngFormat
Resize-And-Save $srcImage 180 180 (Join-Path $PSScriptRoot "..\public\apple-touch-icon.png") $pngFormat

# 3. PWA Icons
Resize-And-Save $srcImage 192 192 (Join-Path $PSScriptRoot "..\public\icons\icon-192x192.png") $pngFormat
Resize-And-Save $srcImage 512 512 (Join-Path $PSScriptRoot "..\public\icons\icon-512x512.png") $pngFormat
Resize-And-Save $srcImage 512 512 (Join-Path $PSScriptRoot "..\public\icons\icon-maskable-512x512.png") $pngFormat

# 4. Next.js App router icon
Resize-And-Save $srcImage 128 128 (Join-Path $PSScriptRoot "..\app\icon.png") $pngFormat
Resize-And-Save $srcImage 32 32 (Join-Path $PSScriptRoot "..\app\favicon.ico") $icoFormat

$srcImage.Dispose()
Write-Output "All icons successfully generated from new logo!"
