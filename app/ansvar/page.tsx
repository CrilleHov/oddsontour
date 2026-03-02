import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList } from "lucide-react"

const RESPONSIBILITIES = [
  { area: "Youtube", who: "Dempa" },
  { area: "Sociala medier", who: "Benne & Dempa" },
  { area: "Sponsor", who: "Alvin & Frasse" },
  { area: "Ekonomi", who: "Axel & Crille" },
  { area: "IT", who: "Crille" },
  { area: "Merch", who: "Löken" },
]

export default function AnsvarPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">Ansvarsområden</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            Säsongens ansvar
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {RESPONSIBILITIES.map((r) => (
            <div key={r.area} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2">
              <span className="font-medium text-foreground">{r.area}</span>
              <span className="text-muted-foreground">{r.who}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
