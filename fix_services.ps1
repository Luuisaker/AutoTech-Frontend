$content = Get-Content "C:\Users\Sake\proyects\Windsurf\Autotech\AutoTech-Frontend\src\routes\_authenticated\dashboard\services.tsx" -Raw

$old = '                      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />${service.standard_price_min.toFixed(2)} \u2014
                        ${service.standard_price_max.toFixed(2)}
                      </p>'

$new = '                      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />${service.standard_price_min.toFixed(2)} \u2014
                        ${service.standard_price_max.toFixed(2)}
                      </p>
                      {service.revision_cost != null && service.revision_cost > 0 && (
                        <p className="mt-0.5 text-xs text-amber-400 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />Costo de revisión: ${service.revision_cost.toFixed(2)}
                        </p>
                      )}'

$content = $content -replace [regex]::Escape($old), $new
Set-Content "C:\Users\Sake\proyects\Windsurf\Autotech\AutoTech-Frontend\src\routes\_authenticated\dashboard\services.tsx" -Value $content -Encoding UTF8
Write-Host "Done"
