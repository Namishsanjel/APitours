# Re-encode the new photos in gallery/ for the web and lay them out as a
# balanced 3-column masonry, ready to paste into src/data/pages.js.
#
# Each source is scaled so its long edge is at most $MaxEdge px, written to
# public/img/gallery/NN.jpg, and the columns are packed shortest-first so all
# three come out the same height.
Add-Type -AssemblyName System.Drawing

$MaxEdge = 1600
$Quality = 82
$OutDir = 'public\img\gallery'
$Cols = 3
$Gap = 24

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq 'image/jpeg' }
$enc = New-Object System.Drawing.Imaging.EncoderParameters(1)
$enc.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)

# --- measure ---------------------------------------------------------------
$items = foreach ($f in Get-ChildItem gallery -File | Sort-Object Name) {
  $img = [System.Drawing.Image]::FromFile($f.FullName)
  $w = $img.Width; $h = $img.Height
  $img.Dispose()
  [pscustomobject]@{ Name = $f.Name; W = $w; H = $h; Ar = $w / $h; Inv = $h / $w }
}

# --- pack shortest column first -------------------------------------------
$buckets = @()
for ($i = 0; $i -lt $Cols; $i++) { $buckets += ,@() }
$heights = @(0.0) * $Cols
$counts = @(0) * $Cols

foreach ($it in $items) {
  $target = 0
  for ($i = 1; $i -lt $Cols; $i++) { if ($heights[$i] -lt $heights[$target]) { $target = $i } }
  $buckets[$target] += $it
  $heights[$target] += $it.Inv
  $counts[$target]++
}

# --- encode, numbered in final column order --------------------------------
$n = 0
$rows = @()
foreach ($col in $buckets) {
  foreach ($it in $col) {
    $n++
    $num = '{0:d2}' -f $n
    $out = Join-Path $OutDir "$num.jpg"

    $img = [System.Drawing.Image]::FromFile((Resolve-Path (Join-Path 'gallery' $it.Name)))
    $scale = [Math]::Min(1.0, $MaxEdge / [double][Math]::Max($img.Width, $img.Height))
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
    $bmp.Save($out, $codec, $enc)
    $bmp.Dispose()
    $img.Dispose()

    $kb = [int][Math]::Round((Get-Item $out).Length / 1KB)
    $rows += [pscustomobject]@{ Num = $num; Source = $it.Name; W = $w; H = $h; KB = $kb }
  }
}

# --- report ----------------------------------------------------------------
Write-Output "encoded $($rows.Count) files into $OutDir (long edge <= $MaxEdge, q$Quality)"
Write-Output ''
foreach ($r in $rows) { "{0}  {1,5}x{2,-5} {3,5} KB   <- {4}" -f $r.Num, $r.W, $r.H, $r.KB, $r.Source }
Write-Output ''
Write-Output ("column balance (relative height incl. {0}px gaps): {1}" -f $Gap, ($heights -join ' | '))

Write-Output ''
Write-Output '--- paste into src/data/pages.js ---'
Write-Output '  columns: ['
foreach ($col in $buckets) {
  $lines = foreach ($it in $col) {
    $num = '{0:d2}' -f $rows.Where({ $_.Source -eq $it.Name })[0].Num
    $img = [System.Drawing.Image]::FromFile((Resolve-Path (Join-Path $OutDir "$num.jpg")))
    $w = $img.Width; $h = $img.Height
    $img.Dispose()
    '      {{ src: "/img/gallery/{0}.jpg", w: {1}, h: {2} }},' -f $num, $w, $h
  }
  Write-Output '    ['
  $lines | ForEach-Object { Write-Output $_ }
  Write-Output '    ],'
}
Write-Output '  ],'