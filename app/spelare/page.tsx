import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, History } from "lucide-react"

type SimplePlayer = {
  name: string
  golfId: string
  hcp?: number
}

const PLAYERS: SimplePlayer[] = [
  { name: "Alvin Andersson", golfId: "961029-001" },
  { name: "Jesper Fransson", golfId: "980422-030" },
  { name: "Lukas Hafström", golfId: "981226-002" },
  { name: "Johan Rantzow", golfId: "990314-001" },
  { name: "Johannes Sandholm", golfId: "990920-005" },
  { name: "Axel Carlsson Hagel", golfId: "980512-009" },
  { name: "Viktor Andersson", golfId: "980703-003" },
  { name: "Benjamin Abbe", golfId: "980627-033" },
  { name: "Christian Hovstadius", golfId: "970317-002" },
  // Lägg till fler...
]

const HISTORICAL_PLAYERS: SimplePlayer[] = [
  { name: "Albin Ohlsson", golfId: "960919-013" },
  { name: "Sebastian Classon", golfId: "970920-028" },
  { name: "Dennis Järnåsen", golfId: "981124-006" },
  { name: "Elliot Björk", golfId: "" },
  // Historiska spelare som alltid ska synas här
]

function PlayerGrid({ players }: { players: SimplePlayer[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {players.map((p) => (
        <Card key={`${p.name}-${p.golfId}`}>
          <CardContent className="flex flex-col gap-2 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{p.name}</h3>
                <p className="text-sm text-muted-foreground">Golf-ID: {p.golfId}</p>
              </div>

              {typeof p.hcp === "number" && (
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  HCP {p.hcp}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function SpelarePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Spelare</h1>
        <span className="text-sm text-muted-foreground">{PLAYERS.length} spelare</span>
      </div>

      {/* Aktiva spelare */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Aktiva spelare
          </CardTitle>
        </CardHeader>
        <CardContent>
          {PLAYERS.length === 0 ? (
            <p className="text-sm text-muted-foreground">Lägg in spelare i listan PLAYERS.</p>
          ) : (
            <PlayerGrid players={PLAYERS} />
          )}
        </CardContent>
      </Card>

      {/* Historiska spelare (alltid med) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Historiska spelare
          </CardTitle>
        </CardHeader>
        <CardContent>
          {HISTORICAL_PLAYERS.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Lägg in historiska spelare i listan HISTORICAL_PLAYERS.
            </p>
          ) : (
            <PlayerGrid players={HISTORICAL_PLAYERS} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
