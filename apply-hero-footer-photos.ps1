# Re-encode the new hero and footer photos from img/ for the web.
#
# Sizes are chosen for how each one is actually displayed:
#   hero   — full-bleed background, so the long edge (2560px) is the budget;
#            it covers a 1920px viewport at roughly 1.3x.
#   footer — a portrait source that object-cover crops to a horizontal band,
#            so the WIDTH (1600px) is what has to be sharp, not the long edge.
Add-Type -AssemblyName System.Drawing

$Quality = 84

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq 'image/jpeg' }
$enc = New-Object System.Drawing.Imaging.EncoderParameters(1)
$enc.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)

# name -> how to fit it: 'long' caps the long edge, 'width' caps the width
$jobs = [ordered]@{
  'hero.jpg'   = @{ max = 2560; axis = 'long' }
  'footer.jpg' = @{ max = 1600; axis = 'width' }
}

foreach ($name in $jobs.Keys) {
  $job = $jobs[$name]
  $inPath = Join-Path 'img' $name
  $outPath = Join-Path 'public\img' $name

  $old = Get-Item $outPath -ErrorAction SilentlyContinue
  $oldName = $old.Name
  $oldSize = if ($old) { $old.Length } else { 0 }

  $img = [System.Drawing.Image]::FromFile((Resolve-Path $inPath))
  $limit = if ($job.axis -eq 'long') { [Math]::Max($img.Width, $img.Height) } else { $img.Width }
  $scale = [Math]::Min(1.0, $job.max / [double]$limit)
  $w = [int][Math]::Round($img.Width * $scale)
  $h = [int][Math]::Round($img.Height * $scale)

  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $bmp.SetResolution(96, 96)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.DrawImage($img, 0, 0, $w, $h)
  $g.Dispose()
  $bmp.Save($outPath, $codec, $enc)
  $bmp.Dispose()
  $img.Dispose()

  $new = Get-Item $outPath
  "{0,-12} {1,5}x{2,-5} {3,8:N0} KB   (replaces {4} at {5:N0} KB)" -f `
    $name, $w, $h, ($new.Length / 1KB), $oldName, ($oldSize / 1KB)
}