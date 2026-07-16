# -*- coding: utf-8 -*-
import re

with open("C:/Users/Sake/proyects/Windsurf/Autotech/AutoTech-Frontend/src/routes/_authenticated/dashboard/services.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old = """                      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />${service.standard_price_min.toFixed(2)} —
                        ${service.standard_price_max.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isClient ? ("""

new = """                      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />${service.standard_price_min.toFixed(2)} —
                        ${service.standard_price_max.toFixed(2)}
                      </p>
                      {service.revision_cost != null && service.revision_cost > 0 && (
                        <p className="mt-0.5 text-xs text-amber-400 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />Costo de revisión: ${service.revision_cost.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isClient ? ("""

if old in content:
    content = content.replace(old, new)
    with open("C:/Users/Sake/proyects/Windsurf/Autotech/AutoTech-Frontend/src/routes/_authenticated/dashboard/services.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Pattern not found")
    idx = content.find("standard_price_min.toFixed(2)")
    if idx >= 0:
        print("Found at:", idx)
        print(repr(content[idx:idx+500]))
