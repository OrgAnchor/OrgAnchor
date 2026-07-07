param(
  [string]$OutDir = "public-assets/video-90s",
  [string]$Voice = "Microsoft Zira Desktop",
  [int]$Rate = 1
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Speech

$ResolvedOutDir = Join-Path (Get-Location) $OutDir
New-Item -ItemType Directory -Force -Path $ResolvedOutDir | Out-Null

$Voiceover = @'
Not long ago, a polished website, a professional video, or a detailed product page still meant something. It meant effort. It meant cost. It gave people a reason to believe there might be a real organization behind it.

But AI is changing that. The look of credibility is becoming cheap. And at the same time, real organizations can lose their visible history overnight: a domain expires, a platform account is disabled, a website moves, or an old trail disappears.

OrgAnchor is built for that gap. It lets an organization publish signed records of who it is, where its official presence can be found now, what it claims, what evidence supports those claims, and what has changed over time.

The website can still be the front door. But the website no longer has to be the only proof. People can read a public verify page, while AI agents and verification tools can inspect the underlying package, check signatures and hashes, surface evidence gaps, and show what to verify next.

OrgAnchor is not a trust badge. It is not a marketplace, not a certification authority, and not a final score. It does not tell you who to trust. It makes the material easier to verify.

OrgAnchor is now in Fireseed Alpha. We are looking for people to test it, question it, run it on real organizations, and help build a lower-cost, non-monopolistic way to verify organization identity and evidence.
'@

$Synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
$Synthesizer.SelectVoice($Voice)
$Synthesizer.Rate = $Rate
$Synthesizer.Volume = 100

$WavPath = Join-Path $ResolvedOutDir "organchor-90s-voice.en-US.wav"
$Synthesizer.SetOutputToWaveFile($WavPath)
$Synthesizer.Speak($Voiceover)
$Synthesizer.Dispose()

$Bytes = [System.IO.File]::ReadAllBytes($WavPath)
$DataIndex = -1
for ($i = 12; $i -lt $Bytes.Length - 8; $i++) {
  if ($Bytes[$i] -eq 100 -and $Bytes[$i + 1] -eq 97 -and $Bytes[$i + 2] -eq 116 -and $Bytes[$i + 3] -eq 97) {
    $DataIndex = $i
    break
  }
}

$FmtIndex = -1
for ($i = 12; $i -lt $Bytes.Length - 8; $i++) {
  if ($Bytes[$i] -eq 102 -and $Bytes[$i + 1] -eq 109 -and $Bytes[$i + 2] -eq 116 -and $Bytes[$i + 3] -eq 32) {
    $FmtIndex = $i
    break
  }
}

if ($DataIndex -lt 0 -or $FmtIndex -lt 0) {
  throw "Could not parse WAV duration."
}

$DataSize = [BitConverter]::ToInt32($Bytes, $DataIndex + 4)
$Channels = [BitConverter]::ToInt16($Bytes, $FmtIndex + 10)
$SampleRate = [BitConverter]::ToInt32($Bytes, $FmtIndex + 12)
$Bits = [BitConverter]::ToInt16($Bytes, $FmtIndex + 22)
$Duration = $DataSize / ($SampleRate * $Channels * ($Bits / 8))

[PSCustomObject]@{
  Path = $WavPath
  Bytes = (Get-Item -LiteralPath $WavPath).Length
  DurationSeconds = [math]::Round($Duration, 2)
  Voice = $Voice
  Rate = $Rate
} | Format-List
