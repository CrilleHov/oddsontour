import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Trophy } from "lucide-react"

const WINNERS = [
  { year: 2019, winner: "Alvin Andersson" },
  { year: 2020, winner: "Christian Hovstadius" },
  { year: 2021, winner: "Jesper Fransson" },
  { year: 2022, winner: "Lukas Hafström" },
  { year: 2023, winner: "Alvin Andersson" },
  { year: 2024, winner: "Jesper Fransson" },
  { year: 2025, winner: "Viktor Andersson" },
]

export default function HistoriaPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">Historia</h1>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            Om Odds on Tour
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
          <p>Välkommen till samlingssidan för Odds on Tour.</p>
          <p>
            Odds on Tour (tidigare Race to Sand) drog igång 2019 och har sedan dess växt och
            cementerats till en av de mest prestigefyllda tävlingarna inom golfvärlden. Varje år
            består vanligtvis av strax under 10 deltävlingar där poäng samlas ihop inför finalen där
            allt ska avgöras. Väl mött!
          </p>
        </CardContent>
      </Card>

      {/* Historiska vinnare */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Tidigare vinnare
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <div className="flex flex-col gap-2">
            {WINNERS.map((w) => (
              <div key={w.year} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2">
                <span className="font-medium text-foreground">{w.year}</span>
                <span>{w.winner}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
