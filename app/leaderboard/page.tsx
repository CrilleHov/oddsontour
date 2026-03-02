"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trophy } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

type LeaderboardRow = {
  tavling: string // YYYY-MM-DD
  spelare: string
  poang: number
  placering: number
  antal_spelare: number
}

type SummaryRow = {
  spelare: string
  totalPoang: number
  antalComps: number
  antalVinster: number
  antalSistaplatser: number
}

const COMP_TABLE = "competitions"
const LB_TABLE = "leaderboard"

function yearFromDate(dateStr: string) {
  return Number(dateStr.slice(0, 4))
}

const SERIES_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
]

export default function LeaderboardPage() {
  const supabase = useMemo(() => createClient(), [])

  const [years, setYears] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Hämta vilka år som finns (från competitions.datum)
  useEffect(() => {
    let cancelled = false

    async function loadYears() {
      setError(null)
      const { data, error } = await supabase.from(COMP_TABLE).select("datum")

      if (cancelled) return

      if (error) {
        setError(error.message)
        setYears([])
        setSelectedYear(null)
        return
      }

      const uniq = Array.from(new Set((data ?? []).map((r: { datum: string }) => yearFromDate(r.datum)))).sort(
        (a, b) => b - a
      )

      setYears(uniq)
      setSelectedYear((prev) => prev ?? uniq[0] ?? null)
    }

    loadYears()
    return () => {
      cancelled = true
    }
  }, [supabase])

  // Hämta leaderboard för valt år
  useEffect(() => {
    if (!selectedYear) return

    let cancelled = false

    async function loadLeaderboard() {
      setLoading(true)
      setError(null)

      const from = `${selectedYear}-01-01`
      const to = `${selectedYear}-12-31`

      const { data, error } = await supabase
        .from(LB_TABLE)
        .select(`
    tavling:tävling,
    spelare,
    poang:poäng,
    placering,
    antal_spelare
  `)
        .gte("tävling", from)
        .lte("tävling", to)
        .order("tävling", { ascending: true })
        .returns<LeaderboardRow[]>()

      if (error) {
        setError(error.message)
        setRows([])
        setLoading(false)
        return
      }

      setRows(data ?? [])
      setLoading(false)
    }

    loadLeaderboard()
    return () => {
      cancelled = true
    }
  }, [supabase, selectedYear])

  const { summary, chartData, players } = useMemo(() => {
    const byPlayer = new Map<string, SummaryRow>()

    for (const r of rows) {
      const name = r.spelare
      const cur = byPlayer.get(name) ?? {
        spelare: name,
        totalPoang: 0,
        antalComps: 0,
        antalVinster: 0,
        antalSistaplatser: 0,
      }

      const points = Number(r.poang ?? 0)

      cur.totalPoang += points
      if (points !== 0) cur.antalComps += 1
      if (Number(r.placering) === 1) cur.antalVinster += 1
      if (Number(r.placering) === Number(r.antal_spelare)) cur.antalSistaplatser += 1

      byPlayer.set(name, cur)
    }

    const summary = Array.from(byPlayer.values()).sort((a, b) => b.totalPoang - a.totalPoang)

    // Chart: kumulativa poäng per tävlingsdatum
    const dates = Array.from(new Set(rows.map((r) => r.tavling))).sort()
    const players = Array.from(new Set(rows.map((r) => r.spelare))).sort()

    const rowsByDate = new Map<string, LeaderboardRow[]>()
    for (const r of rows) {
      const d = r["tavling"]
      const arr = rowsByDate.get(d) ?? []
      arr.push(r)
      rowsByDate.set(d, arr)
    }

    const cumulative = new Map(players.map((p) => [p, 0]))
    const chartData = dates.map((d) => {
      const bucket = rowsByDate.get(d) ?? []
      for (const r of bucket) {
        cumulative.set(r.spelare, (cumulative.get(r.spelare) ?? 0) + Number(r["poang"] ?? 0))
      }
      const point: Record<string, any> = {
        datum: new Date(d).toLocaleDateString("sv-SE"),
        _rawDate: d,
      }
      for (const p of players) {
        point[p] = cumulative.get(p) ?? 0
      }
      return point
    })

    return { summary, chartData, players }
  }, [rows])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>

        <div className="w-full sm:w-56">
          <Select
            value={selectedYear ? String(selectedYear) : ""}
            onValueChange={(v) => setSelectedYear(Number(v))}
            disabled={years.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={years.length === 0 ? "Inga år" : "Välj år"} />
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
      </div>

      {error && (
        <Card>
          <CardContent className="py-5">
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <div className="font-medium text-foreground">Kunde inte hämta leaderboard</div>
              <div className="text-muted-foreground">{error}</div>
              <div className="mt-2 text-muted-foreground">
                Kolla RLS/policies i Supabase, och att tabellen heter <code className="rounded bg-secondary px-1">{LB_TABLE}</code>.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      ) : summary.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Trophy className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Inga resultat hittades för {selectedYear}.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Poängutveckling</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="datum" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    {players.map((p, i) => (
                      <Line
                        key={p}
                        type="monotone"
                        dataKey={p}
                        stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ställning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 pr-4 font-semibold text-muted-foreground">#</th>
                      <th className="pb-3 pr-4 font-semibold text-muted-foreground">Spelare</th>
                      <th className="pb-3 pr-4 font-semibold text-muted-foreground">Totala poäng</th>
                      <th className="pb-3 pr-4 font-semibold text-muted-foreground">Tävlingar</th>
                      <th className="pb-3 pr-4 font-semibold text-muted-foreground">Vinster</th>
                      <th className="pb-3 font-semibold text-muted-foreground">Sistaplatser</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((s, idx) => (
                      <tr key={s.spelare} className="border-b border-border/50 last:border-0">
                        <td className="py-3 pr-4">
                          <span
                            className={
                              idx === 0
                                ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-chart-2 font-bold text-accent-foreground"
                                : idx === 1
                                  ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted font-bold text-muted-foreground"
                                  : idx === 2
                                    ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-chart-5 font-bold text-foreground"
                                    : "inline-flex h-7 w-7 items-center justify-center font-medium text-muted-foreground"
                            }
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-medium text-foreground">{s.spelare}</td>
                        <td className="py-3 pr-4 font-bold text-foreground">{s.totalPoang}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{s.antalComps}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{s.antalVinster}</td>
                        <td className="py-3 text-muted-foreground">{s.antalSistaplatser}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
