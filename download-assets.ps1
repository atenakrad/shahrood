$ErrorActionPreference = 'Stop'
$assets = Join-Path $PSScriptRoot 'dist/assets'
$files = @(
  @{name='Abr Jungle in Iran by Pouria Afkhami pixoos 05.jpg'; out='abr.jpg'},
  @{name='Abr Jungle in Iran by Pouria Afkhami pixoos 02.jpg'; out='forest.jpg'},
  @{name='Bayazid Bastami 21.jpg'; out='bastam.jpg'},
  @{name='خانۀ یغمایی شاهرود 1.jpg'; out='yaghmaei.jpg'},
  @{name='Mojen - Shahvar - panoramio.jpg'; out='shahvar.jpg'}
)
foreach ($f in $files) {
  $filename = $f.name.Replace(' ','_')
  $hash = [Convert]::ToHexString([System.Security.Cryptography.MD5]::HashData([Text.Encoding]::UTF8.GetBytes($filename))).ToLower()
  $url = 'https://upload.wikimedia.org/wikipedia/commons/' + $hash.Substring(0,1) + '/' + $hash.Substring(0,2) + '/' + [Uri]::EscapeDataString($filename)
  & curl.exe --fail -L --retry 2 --max-time 60 $url -o (Join-Path $assets $f.out) --silent --show-error
  if ($LASTEXITCODE -ne 0) { throw ('Failed: '+$f.name) }
  Write-Output ('Downloaded '+$f.out)
}
& curl.exe --fail -L --max-time 45 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js' -o (Join-Path $PSScriptRoot 'dist/vendor/three.module.js') --silent --show-error
& curl.exe --fail -L --max-time 45 'https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js' -o (Join-Path $PSScriptRoot 'dist/vendor/d3.min.js') --silent --show-error
& curl.exe --fail -L --max-time 45 'https://cdn.jsdelivr.net/npm/@fontsource/vazirmatn@5.1.1/files/vazirmatn-arabic-400-normal.woff2' -o (Join-Path $assets 'vazirmatn-regular.woff2') --silent --show-error
& curl.exe --fail -L --max-time 45 'https://cdn.jsdelivr.net/npm/@fontsource/vazirmatn@5.1.1/files/vazirmatn-arabic-700-normal.woff2' -o (Join-Path $assets 'vazirmatn-bold.woff2') --silent --show-error
