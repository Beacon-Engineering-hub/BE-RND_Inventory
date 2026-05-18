$word = New-Object -ComObject Word.Application
if ($null -ne $word) {
    Write-Host 'Word is installed'
    $word.Quit()
} else {
    Write-Host 'Not installed'
}
