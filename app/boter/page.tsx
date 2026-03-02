"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { addFees } from "@/lib/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Banknote } from "lucide-react"
import { toast } from "sonner"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type PlayerRow = {
  spelarnamn: string
  golfid?: string | null
}

type FeeRow = {
  spelare: string
  "bötesbelopp": number
  created_at?: string
}

const PLAYERS_TABLE = "spelare"
const FEES_TABLE = "fees"

const RULES = [
  { rule: "Streck/0 poäng", amount: "10 kr" },
  { rule: "Kissar på golfbanan", amount: "50 kr" },
  { rule: "Kastar utrustning", amount: "50 kr/gång" },
  { rule: "Kastar boll", amount: "15 kr/boll" },
  { rule: "Tappar bort järnheadcovers", amount: "50 kr/st" },
  { rule: "Inte på golfbanan 30 min innan FÖRSTA starttid", amount: "50 kr" },
  { rule: "Har ej straffutrustning", amount: "1000 kr" },
  { rule: "Inte har minst ett Race to Sand-plagg på sig", amount: "100 kr" },
  { rule: "Bira-boll", amount: "20 kr" },
  { rule: "HIO/Albatross: de andra spelarna böter", amount: "100 kr" },
  { rule: "Ej tillgänglig att scoreföra på Gamebook", amount: "100 kr" },
  { rule: "Host har inte med priset till deltävling", amount: "500 kr" },
]

export default function BoterPage() {
  const supabase = useMemo(() => createClient(), [])

  const [players, setPlayers] = useState<string[]>([])
  const [fees, setFees] = useState<FeeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formFees, setFormFees] = useState<Record<string, number>>({})
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)

    const [{ data: playersData, error: playersError }, { data: feesData, error: feesError }] = await Promise.all([
      supabase.from(PLAYERS_TABLE).select("spelarnamn").order("spelarnamn"),
      supabase.from(FEES_TABLE).select("spelare, bötesbelopp, created_at").order("created_at", { ascending: false }),
    ])

    if (playersError) {
      setError(playersError.message)
      setLoading(false)
      return
    }
    if (feesError) {
      setError(feesError.message)
      setLoading(false)
      return
    }

    const names = ((playersData ?? []) as PlayerRow[]).map((p) => p.spelarnamn)
    setPlayers(names)
    setFees((feesData ?? []) as FeeRow[])

    // init form
    setFormFees((prev) => {
      const next = { ...prev }
      for (const n of names) {
        if (next[n] === undefined) next[n] = 0
      }
      return next
    })

    setLoading(false)
  }

  useEffect(() => {
    load().catch((e) => {
      console.error(e)
      setError(String(e))
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totals = useMemo(() => {
    const map = new Map<string, number>()
    for (const f of fees) {
      map.set(f.spelare, (map.get(f.spelare) ?? 0) + Number(f["bötesbelopp"] ?? 0))
    }

    const rows = Array.from(map.entries())
      .map(([spelare, total]) => ({ spelare, total: Math.round(total) }))
      .sort((a, b) => b.total - a.total)

    const totalAll = rows.reduce((s, r) => s + r.total, 0)

    return { rows, totalAll }
  }, [fees])

  const chartData = useMemo(() => totals.rows.map((r) => ({ name: r.spelare, value: r.total })), [totals.rows])

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const payload = players.map((p) => ({ spelare: p, belopp: Number(formFees[p] ?? 0) }))
      const res = await addFees({ fees: payload, password })
      toast.success(`Uppdaterat! (insatt ${res.inserted} rader)`)
      setPassword("")
      setFormFees((prev) => {
        const next = { ...prev }
        for (const p of players) next[p] = 0
        return next
      })
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Böteskassa</h1>
        <span className="rounded-full bg-destructive/10 px-3 py-1 text-sm font-semibold text-destructive">
          Totalt: {totals.totalAll} kr
        </span>
      </div>

      {error && (
        <Card>
          <CardContent className="py-5">
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <div className="font-medium text-foreground">Kunde inte hämta data</div>
              <div className="text-muted-foreground">{error}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        </div>
      ) : (
        <>
          {/* Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Banknote className="h-5 w-5 text-primary" />
                Bötesregler
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {RULES.map((r) => (
                <div key={r.rule} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2">
                  <span className="text-foreground">{r.rule}</span>
                  <span className="font-medium text-muted-foreground">{r.amount}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Totals list + chart */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Totalt per spelare</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                {totals.rows.length === 0 ? (
                  <p className="text-muted-foreground">Inga böter ännu. Mirakel.</p>
                ) : (
                  totals.rows.map((r) => (
                    <div key={r.spelare} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2">
                      <span className="font-medium text-foreground">{r.spelare}</span>
                      <span className="font-semibold text-destructive">{r.total} kr</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Diagram</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Uppdatera böter</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Fyll i böter efter deltävlingen. Lämna 0 om ingen böter.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {players.map((p) => (
                  <div key={p} className="flex flex-col gap-2">
                    <Label htmlFor={`fee-${p}`}>Böter för {p}</Label>
                    <Input
                      id={`fee-${p}`}
                      type="number"
                      min={0}
                      step={1}
                      value={formFees[p] ?? 0}
                      onChange={(e) => setFormFees((prev) => ({ ...prev, [p]: Number(e.target.value) }))}
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="adminpass">Lösenord</Label>
                <Input id="adminpass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <Button onClick={handleSubmit} disabled={submitting} className="self-start">
                {submitting ? "Sparar..." : "Uppdatera böter"}
              </Button>

              <p className="text-xs text-muted-foreground">
                Säkerhet: lösenordet valideras server-side via <code className="rounded bg-secondary px-1">ADMIN_PASSWORD</code>.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
