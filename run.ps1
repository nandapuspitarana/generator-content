param(
    [Parameter(Position=0)]
    [string]$Action = "run",
    [switch]$TtsOnly
)

$argsList = @($Action)
if ($TtsOnly) {
    $argsList += "--tts-only"
}

python "$PSScriptRoot\run.py" @argsList
