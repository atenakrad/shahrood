$ErrorActionPreference='Stop'
$files=@(
@{name='Tehran BRT bus transport system.jpg';out='transit.jpg'},
@{name='Bus Tehran.jpg';out='parking.jpg'},
@{name='Recycling Bins.jpg';out='recycling.jpg'},
@{name='Iranian Handicraft.JPG';out='craft.jpg'},
@{name='کلاس کامپیوتر.jpg';out='learning.jpg'}
)
foreach($f in $files){$filename=$f.name.Replace(' ','_');$hash=[Convert]::ToHexString([Security.Cryptography.MD5]::HashData([Text.Encoding]::UTF8.GetBytes($filename))).ToLower();$url='https://upload.wikimedia.org/wikipedia/commons/'+$hash.Substring(0,1)+'/'+$hash.Substring(0,2)+'/'+[Uri]::EscapeDataString($filename);& curl.exe --fail -L --max-time 40 --user-agent 'ShahroodProposal/1.0' $url -o (Join-Path $PSScriptRoot ('dist/assets/'+$f.out)) --silent --show-error;if($LASTEXITCODE -ne 0){throw ('Download failed '+$f.name)};Write-Output ('Downloaded '+$f.out)}
