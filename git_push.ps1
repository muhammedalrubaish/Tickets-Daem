$OutputEncoding = [System.Text.Encoding]::UTF8
$env:LANG = "en_US.UTF-8"

$appDirs = Get-ChildItem -Path "$env:LocalAppData\GitHubDesktop\app-*" -Directory
$gitPath = ""
foreach ($dir in $appDirs) {
    $potentialPath = Join-Path $dir.FullName "resources\app\git\cmd\git.exe"
    if (Test-Path $potentialPath) {
        $gitPath = $potentialPath
        break
    }
}
if (-not $gitPath) {
    $gitPath = "git.exe"
}

Write-Output "Using Git path: $gitPath"
& $gitPath add .
& $gitPath commit -m "AI autofill for circulars upload"
& $gitPath push
