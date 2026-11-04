# Replace the trail photos in public/img with the new originals from img/,
# re-encoded for the web (max 1920px on the long edge, JPEG q86).
# The site already references the kebab-case names, so only the files change.
Add-Type -AssemblyName System.Drawing

$map = [ordered]@{
  'abc.jpg'                             = 'abc.jpg'
  'inca trail to machu picchu.jpg'      = 'machu-picchu.jpg'
  'Cinque Terre Coastal Trail.jpg'      = 'cinque-terre-coastal-trail.jpg'
  'Mount Kilimanjaro.jpg'               = 'mount-kilimanjaro.jpg'
  'Black Forest Ridge Trail.jpg'        = 'black-forest-ridge-trail.jpg'
  'Milford Track.jpg'                   = 'milford-track.jpg'
  'Torres del Paine Circuit.jpg'        = 'torres-del-paine-circuit.jpg'
  'Tour du Mont Blanc.jpg'              = 'tour-du-mont-blanc.jpg'
  'West Highland Way.jpg'               = 'west-highland-way.jpg'
  'Laugavegur Trail.jpg'                = 'laugavegur-trail.jpg'
}

$MAX = 1920
$QUALITY = 86

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq 'image/jpeg' }
$enc = New-Object System.Drawing.Imaging.EncoderParameters(1)
$enc.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality, [long]$QUALITY)

$totalBefore = 0
$totalAfter = 0

foreach ($src in $map.Keys) {
  $inPath = Join-Path 'img' $src
  $outName = $map[$src]
  $outPath = Join-Path 'public\img' $outName

  if (-not (Test-Path $inPath)) { Write-Output "MISSING source: $inPath"; continue }

  $before = (Get-Item $outPath -ErrorAction SilentlyContinue).Length
  if ($null -eq $before) { $before = 0 }

  $img = [System.Drawing.Image]::FromFile((Resolve-Path $inPath))
  $scale = [Math]::Min(1.0, $MAX / [double][Math]::Max($img.Width, $img.Height))
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

  $after = (Get-Item $outPath).Length
  $totalBefore += $before
  $totalAfter += $after
  "{0,-34} {1,5}x{2,-5} {3,9:N0} -> {4,9:N0} bytes" -f $outName, $w, $h, $before, $after
}

"{0,-34} {1,9:N0} -> {2,9:N0} bytes ({3:P0} smaller)" -f 'TOTAL', $totalBefore, $totalAfter, (1 - $totalAfter / $totalBefore)