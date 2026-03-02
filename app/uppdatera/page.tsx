"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { addLeaderboardUpdate } from "@/lib/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Settings, Trophy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

type Competition = {
  datum: string
  bana: string | null
}

type Player = {
  spelarnamn: string
}

const COMP_TABLE = "competitions"
const PLAYERS_TABLE = "spelare"

function yearFromDate(dateStr: string) {
  return Number(dateStr.slice(0, 4))
}

export default function UppdateraPage() {
  const supabase = useMemo(() => createClient(), [])

  const [years, setYears] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [players, setPlayers] = useState<Player[]>([])

  const [tavling, setTavling] = useState<string>("")
  const [antalSpelare, setAntalSpelare] = useState<string>("")
  const [major, setMajor] = useState<"Ja" | "Nej" | "">("")
  const [placeringar, setPlaceringar] = useState<Record<string, number>>({})
  const [password, setPassword] = useState("")

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadYearsAndPlayers() {
    setLoading(true)
    setError(null)

    const [{ data: compDates, error: compErr }, { data: playerData, error: playerErr }] = await Promise.all([
      supabase.from(COMP_TABLE).select("datum"),
      supabase.from(PLAYERS_TABLE).select("spelarnamn").order("spelarnamn"),
    ])

    if (compErr) {
      setError(compErr.message)
      setLoading(false)
      return
    }
    if (playerErr) {
      setError(playerErr.message)
      setLoading(false)
      return
    }

    const uniqYears = Array.from(new Set((compDates ?? []).map((r: { datum: string }) => yearFromDate(r.datum)))).sort(
      (a, b) => b - a
    )

    setYears(uniqYears)
    setSelectedYear((prev) => prev ?? uniqYears[0] ?? null)
    setPlayers((playerData ?? []) as Player[])

    // init placements
    const names = ((playerData ?? []) as Player[]).map((p) => p.spelarnamn)
    setPlaceringar((prev) => {
      const next = { ...prev }
      for (const n of names) if (next[n] === undefined) next[n] = 0
      return next
    })

    setLoading(false)
  }

  async function loadCompetitionsForYear(year: number) {
    const from = `${year}-01-01`
    const to = `${year}-12-31`

    const { data, error } = await supabase
      .from(COMP_TABLE)
      .select("datum, bana")
      .gte("datum", from)
      .lte("datum", to)
      .order("datum", { ascending: true })

    if (error) {
      setError(error.message)
      setCompetitions([])
      return
    }

    setCompetitions((data ?? []) as Competition[])
    // default: första tävlingen i listan
    setTavling((prev) => prev || (data?.[0]?.datum ?? ""))
  }

  useEffect(() => {
    loadYearsAndPlayers().catch((e) => {
      console.error(e)
      setError(String(e))
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedYear) return
    loadCompetitionsForYear(selectedYear).catch((e) => {
      console.error(e)
      setError(String(e))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear])

  async function handleSubmit() {
    if (!tavling || !antalSpelare || !major) {
      toast.error("Välj tävling, antal spelare och major-flagga")
      return
    }

    const antal = Number(antalSpelare)
    const spelade = Object.values(placeringar).filter((p) => Number(p) > 0).length

    setSubmitting(true)
    try {
      const res = await addLeaderboardUpdate({
        tavling,
        antalSpelare: antal,
        major: major as "Ja" | "Nej",
        placeringar: players.map((p) => ({
          spelare: p.spelarnamn,
          placering: Number(placeringar[p.spelarnamn] ?? 0),
        })),
        password,
      })

      toast.success(`Leaderboard uppdaterad! (insatt ${res.inserted} rader)`)

      if (spelade !== antal) {
        toast.warning(`Du angav ${antal} spelare men du har fyllt i ${spelade} placeringar > 0.`)
      }

      setPassword("")
      setPlaceringar((prev) => {
        const next = { ...prev }
        for (const p of players) next[p.spelarnamn] = 0
        return next
      })
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Uppdatera</h1>
        <Button variant="secondary" onClick={() => loadYearsAndPlayers()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Ladda om
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="py-5">
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <div className="font-medium text-foreground">Kunde inte ladda data</div>
              <div className="text-muted-foreground">{error}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-primary" />
            Uppdatera leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Fyll i tävling och placering för respektive spelare. Om någon inte spelade, fyll i <strong>0</strong>.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>År</Label>
              <Select value={selectedYear ? String(selectedYear) : ""} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder={years.length ? "Välj år" : "Inga år"} />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Deltävling</Label>
              <Select value={tavling} onValueChange={setTavling}>
                <SelectTrigger>
                  <SelectValue placeholder={competitions.length ? "Välj tävling" : "Inga tävlingar"} />
                </SelectTrigger>
                <SelectContent>
                  {competitions.map((c) => (
                    <SelectItem key={c.datum} value={c.datum}>
                      {new Date(c.datum).toLocaleDateString("sv-SE")} {c.bana ? `– ${c.bana}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Hur många spelare var med?</Label>
              <Select value={antalSpelare} onValueChange={setAntalSpelare}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj antal" />
                </SelectTrigger>
                <SelectContent>
                  {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Var tävlingen en major?</Label>
              <Select value={major} onValueChange={(v) => setMajor(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Ja/Nej" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ja">Ja</SelectItem>
                  <SelectItem value="Nej">Nej</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {players.map((p) => (
              <div key={p.spelarnamn} className="flex flex-col gap-2">
                <Label htmlFor={`pl-${p.spelarnamn}`}>Placering: {p.spelarnamn}</Label>
                <Input
                  id={`pl-${p.spelarnamn}`}
                  type="number"
                  min={0}
                  step={1}
                  value={placeringar[p.spelarnamn] ?? 0}
                  onChange={(e) => setPlaceringar((prev) => ({ ...prev, [p.spelarnamn]: Number(e.target.value) }))}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="adminpass">Lösenord</Label>
            <Input id="adminpass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="self-start">
            <Trophy className="mr-2 h-4 w-4" />
            {submitting ? "Sparar..." : "Uppdatera leaderboard"}
          </Button>

          <p className="text-xs text-muted-foreground">
            Server-side: poängen räknas ut med samma logik som i din Streamlit-app (major: vinnare +2, tvåa +0.5).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
