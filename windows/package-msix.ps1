<#
.SYNOPSIS
    Creates an MSIX package from the Electron build for Microsoft Store submission.
.DESCRIPTION
    This script wraps dist/System-Cloud-win32-x64 into an MSIX installer.
    Requires: Windows SDK (makeappx.exe + signtool.exe)

    Install Windows SDK: https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/
.PARAMETER AppxManifest
    Path to the AppxManifest.xml (generated if not provided)
.PARAMETER OutputDir
    Where to save the .msix file
#>

param(
    [string]$AppxManifest = "$PSScriptRoot\AppxManifest.xml",
    [string]$OutputDir = "$PSScriptRoot\..\dist"
)

$ErrorActionPreference = "Stop"

# ── Configuration ──
$AppName     = "SystemCloud"
$Publisher   = "CN=YourName"
$Version     = "1.0.0.0"
$AppDir      = "$PSScriptRoot\..\dist\System-Cloud-win32-x64"
$OutputMsix  = "$OutputDir\System-Cloud.msix"

# ── Check for Windows SDK tools ──
$makeappx    = Get-Command "makeappx.exe" -ErrorAction SilentlyContinue
$signtool    = Get-Command "signtool.exe" -ErrorAction SilentlyContinue

if (-not $makeappx) {
    Write-Warning "makeappx.exe not found. Install Windows SDK or add it to PATH."
    Write-Warning "Typical path: C:\Program Files (x86)\Windows Kits\10\bin\10.0.XXXXX.0\x64\"
}

if (-not $signtool) {
    Write-Warning "signtool.exe not found. You'll need it to sign the MSIX for Store submission."
}

# ── Generate AppxManifest if missing ──
if (-not (Test-Path $AppxManifest)) {
    Write-Host "Generating AppxManifest.xml ..."
    @"
<?xml version="1.0" encoding="utf-8"?>
<Package
  xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
  xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
  xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
  IgnorableNamespaces="uap rescap">

  <Identity Name="SystemCloud"
            Publisher="$Publisher"
            Version="$Version" />

  <Properties>
    <DisplayName>System Cloud</DisplayName>
    <PublisherDisplayName>Your Name</PublisherDisplayName>
    <Logo>..\icons\icon-512.png</Logo>
    <Description>A personal dashboard to manage alters, fronters, and account profiles.</Description>
  </Properties>

  <Resources>
    <Resource Language="en-us" />
  </Resources>

  <Dependencies>
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.17763.0" MaxVersionTested="10.0.22621.0" />
  </Dependencies>

  <Applications>
    <Application Id="SystemCloud" Executable="System-Cloud.exe" EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements
        DisplayName="System Cloud"
        Description="A personal dashboard to manage alters, fronters, and account profiles."
        Square150x150Logo="..\icons\icon-192.png"
        Square44x44Logo="..\icons\icon-192.png"
        BackgroundColor="transparent">
        <uap:DefaultTile Wide310x150Logo="..\icons\icon-512.png" Square71x71Logo="..\icons\icon-192.png" />
      </uap:VisualElements>
    </Application>
  </Applications>

  <Capabilities>
    <rescap:Capability Name="runFullTrust" />
    <Capability Name="internetClient" />
  </Capabilities>
</Package>
"@ | Out-File -FilePath $AppxManifest -Encoding utf8
}

# ── Package into MSIX ──
if ($makeappx) {
    Write-Host "Creating MSIX package ..."
    & $makeappx pack /d "$AppDir" /p "$OutputMsix" /l

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MSIX created: $OutputMsix"

        if ($signtool) {
            Write-Host "Signing package (you need a code signing certificate) ..."
            & $signtool sign /a /fd SHA256 /f "path\to\your.pfx" /p "YourPassword" "$OutputMsix"
        } else {
            Write-Warning "Package is unsigned. Sign it before Store submission:"
            Write-Warning "  signtool sign /a /fd SHA256 /f your-cert.pfx /p password `"$OutputMsix`""
        }
    } else {
        Write-Error "MSIX packaging failed!"
    }
} else {
    Write-Host ""
    Write-Host "To create the MSIX manually:"
    Write-Host "  1. Open a Developer Command Prompt"
    Write-Host "  2. Run:"
    Write-Host "     makeappx pack /d `"$AppDir`" /p `"$OutputMsix`" /l"
    Write-Host "  3. Sign with:"
    Write-Host "     signtool sign /a /fd SHA256 /f cert.pfx /p password `"$OutputMsix`""
}
