$ErrorActionPreference='Stop'
$items=@(
@{file='transit';url='https://unsplash.com/photos/buses-parked-at-a-station-with-overhead-lights-AYcjSwz8xsY';author='Zhen Yao'},
@{file='parking';url='https://unsplash.com/photos/an-aerial-view-of-a-parking-lot-with-buses-0utnOMDeXV4';author='Phil Desforges'},
@{file='recycling';url='https://unsplash.com/photos/two-bins-one-blue-and-one-green-filled-with-trash-leZsanu5wrk';author='Polina Kuzovkova'},
@{file='craft';url='https://unsplash.com/photos/colorful-woven-textiles-and-crafts-displayed-at-a-market-87SyqXItCA4';author='Will Goodman'},
@{file='produce';url='https://unsplash.com/photos/fresh-produce-at-an-outdoor-market-stall-dgBkyp5znHU';author='Artur Ament'},
@{file='learning';url='https://unsplash.com/photos/teacher-lecturing-students-in-a-classroom-setting-vBg0dxwfIYM';author='Vitaly Gariev'},
@{file='digital';url='https://unsplash.com/photos/smartphone-tablet-payment-terminal-and-coins-on-table-AqwNyRKpD2Y';author='Vagaro'}
)
foreach($item in $items){
 $htmlFile=Join-Path $PSScriptRoot ($item.file+'-source.html')
 & curl.exe --fail -L --max-time 40 $item.url -o $htmlFile --silent --show-error
 if($LASTEXITCODE -ne 0){throw ('Page failed '+$item.file)}
 $html=[IO.File]::ReadAllText($htmlFile)
 $m=[regex]::Match($html,'property="og:image"\s+content="([^"]+)"')
 if(-not $m.Success){$m=[regex]::Match($html,'(https://images.unsplash.com/photo-[^"<>\s\\]+)')}
 if(-not $m.Success){throw ('No photo for '+$item.file)}
 $url=[Net.WebUtility]::HtmlDecode($m.Groups[1].Value).Split('?')[0]+'?auto=format&fit=crop&w=1600&q=85'
 & curl.exe --fail -L --max-time 50 $url -o (Join-Path $PSScriptRoot ('dist/assets/'+$item.file+'.jpg')) --silent --show-error
 if($LASTEXITCODE -ne 0){throw ('Image failed '+$item.file)}
 Write-Output ('Downloaded '+$item.file)
}
$items | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'dist/assets/station-photo-sources.json') -Encoding utf8
