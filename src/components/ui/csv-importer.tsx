/**
 * csv-importer.tsx
 * Drag-drop CSV/Excel paste with a visual column-mapping step.
 * Usage: <CsvImporter open onClose onImport={async (rows) => ...} />
 */
import { useState, useCallback, useRef } from "react"
import { Modal } from "./modal"
import { Button } from "./button"
import { Upload, FileDown, ClipboardPaste, AlertCircle, CheckCircle, ChevronRight } from "lucide-react"

export type MappedRow = {
  name: string
  phone?: string
  email?: string
  preferred_language?: string
}

type RawRow = Record<string, string>

type ColumnKey = "name" | "phone" | "email" | "preferred_language" | "ignore"

const COLUMN_LABELS: Record<ColumnKey, string> = {
  name:               "Customer name",
  phone:              "Phone number",
  email:              "Email address",
  preferred_language: "Language code",
  ignore:             "— Ignore this column —",
}

const FIELD_REQUIRED: ColumnKey[] = ["name"]

const LANG_CODES = new Set(["en","ha","yo","ig","pcm","ar","fr"])

function normalisePhone(s: string): string {
  const d = s.replace(/\D/g, "")
  if (!d) return s
  if (d.startsWith("0") && d.length === 11) return "+234" + d.slice(1)
  if (d.startsWith("234") && d.length === 13) return "+" + d
  return s
}

function autoDetectMapping(headers: string[]): Record<string, ColumnKey> {
  const map: Record<string, ColumnKey> = {}
  for (const h of headers) {
    const l = h.toLowerCase().trim()
    if (l.includes("name") || l.includes("customer") || l.includes("student") || l.includes("debtor"))
      map[h] = "name"
    else if (l.includes("phone") || l.includes("mobile") || l.includes("tel") || l.includes("gsm") || l.includes("number"))
      map[h] = "phone"
    else if (l.includes("email") || l.includes("mail"))
      map[h] = "email"
    else if (l.includes("lang") || l.includes("language"))
      map[h] = "preferred_language"
    else
      map[h] = "ignore"
  }
  return map
}

function parseRawCsv(text: string): { headers: string[]; rows: RawRow[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (!lines.length) return { headers: [], rows: [] }

  const sep = lines[0].includes("\t") ? "\t" : ","
  const splitLine = (l: string) =>
    l.split(sep).map(s => s.trim().replace(/^["']|["']$/g, ""))

  const firstCols = splitLine(lines[0])
  // Detect header row: if first row contains non-numeric strings
  const hasHeader = firstCols.some(c => isNaN(Number(c)) && c.length > 0 && !/^\+?\d/.test(c))

  const headers = hasHeader
    ? firstCols.map((h, i) => h || `Column ${i + 1}`)
    : firstCols.map((_, i) => `Column ${i + 1}`)

  const dataLines = hasHeader ? lines.slice(1) : lines
  const rows: RawRow[] = dataLines.map(l => {
    const parts = splitLine(l)
    const row: RawRow = {}
    headers.forEach((h, i) => { row[h] = parts[i] || "" })
    return row
  }).filter(r => Object.values(r).some(v => v.trim()))

  return { headers, rows }
}

function applyMapping(rows: RawRow[], mapping: Record<string, ColumnKey>): MappedRow[] {
  return rows.map(row => {
    const m: MappedRow = { name: "" }
    for (const [col, field] of Object.entries(mapping)) {
      if (field === "ignore") continue
      const val = row[col]?.trim() ?? ""
      if (!val) continue
      if (field === "name") m.name = val
      else if (field === "phone") m.phone = normalisePhone(val)
      else if (field === "email") m.email = val
      else if (field === "preferred_language") {
        const code = val.toLowerCase().slice(0, 5)
        m.preferred_language = LANG_CODES.has(code) ? code : "en"
      }
    }
    return m
  }).filter(r => r.name.trim())
}

type Step = "upload" | "map" | "preview" | "done"

interface Props {
  open: boolean
  onClose: () => void
  onImport: (rows: MappedRow[]) => Promise<{ created: number; failed: number }>
}

export function CsvImporter({ open, onClose, onImport }: Props) {
  const [step, setStep] = useState<Step>("upload")
  const [inputTab, setInputTab] = useState<"file" | "paste">("file")
  const [rawText, setRawText] = useState("")
  const [pasteText, setPasteText] = useState("")
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<RawRow[]>([])
  const [mapping, setMapping] = useState<Record<string, ColumnKey>>({})
  const [mappedRows, setMappedRows] = useState<MappedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ created: number; failed: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep("upload"); setRawText(""); setPasteText("")
    setHeaders([]); setRawRows([]); setMapping({}); setMappedRows([])
    setResult(null); setImporting(false)
  }

  const close = () => { reset(); onClose() }

  const processText = useCallback((text: string) => {
    const { headers, rows } = parseRawCsv(text)
    if (!rows.length) return false
    setRawText(text)
    setHeaders(headers)
    setRawRows(rows)
    setMapping(autoDetectMapping(headers))
    setStep("map")
    return true
  }, [])

  const handleFile = async (file: File) => {
    const text = await file.text()
    processText(text)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const confirmMapping = () => {
    const rows = applyMapping(rawRows, mapping)
    setMappedRows(rows)
    setStep("preview")
  }

  const runImport = async () => {
    setImporting(true)
    try {
      const res = await onImport(mappedRows)
      setResult(res)
      setStep("done")
    } finally {
      setImporting(false)
    }
  }

  const canConfirmMap = headers.some(h => mapping[h] === "name")
  const validationIssues = mappedRows.filter(r => !r.name || (!r.phone && !r.email)).length

  const downloadSample = () => {
    const csv = "name,phone,email,preferred_language\nMusa Ibrahim,08031234567,musa@example.com,ha\nFatima Ali,08039876543,,en\nChinedu Okafor,08051234567,chinedu@example.com,ig"
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: "collectnaija_sample.csv",
    })
    a.click(); URL.revokeObjectURL(a.href)
  }

  return (
    <Modal open={open} onClose={close} title="Import customers">
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-5">
        {(["upload","map","preview","done"] as Step[]).map((s, i) => {
          const labels = ["1. Upload","2. Map columns","3. Preview","4. Done"]
          const done = ["upload","map","preview","done"].indexOf(step) > i
          const active = step === s
          return (
            <div key={s} className="flex items-center gap-1">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                active ? "bg-brand-600 text-white" : done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}>{labels[i]}</span>
              {i < 3 && <ChevronRight className="w-3 h-3 text-slate-300" />}
            </div>
          )
        })}
      </div>

      {/* ── Step 1: Upload ── */}
      {step === "upload" && (
        <div className="space-y-4">
          <div className="flex gap-1">
            {(["file","paste"] as const).map(t => (
              <button key={t} onClick={() => setInputTab(t)}
                className={`px-3 py-2 rounded-xl text-sm font-medium border flex items-center gap-1.5 ${inputTab === t ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200"}`}>
                {t === "file" ? <><Upload className="w-3.5 h-3.5"/> Upload CSV</> : <><ClipboardPaste className="w-3.5 h-3.5"/> Paste from Excel</>}
              </button>
            ))}
          </div>

          {inputTab === "file" ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                dragging ? "border-brand-500 bg-brand-50" : "border-slate-300 hover:border-brand-400 hover:bg-slate-50"
              }`}
            >
              <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Drop your CSV file here, or click to browse</p>
              <p className="text-xs text-slate-500 mt-1">
                Accepts <code>.csv</code>, <code>.txt</code>, tab-separated exports from Excel / Google Sheets
              </p>
              <p className="text-xs text-slate-400 mt-2">Up to 500 customers per import</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                Copy any columns from Excel/Sheets and paste below.
                Works with <strong>Tab</strong> or <strong>comma</strong> separated data.
              </p>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder={"Name\tPhone\tEmail\nMusa Ibrahim\t08031234567\tmusa@example.com\nFatima Ali\t08039876543"}
                rows={7}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                autoFocus
              />
              <Button
                onClick={() => { if (!processText(pasteText)) alert("No rows found — check your format") }}
                disabled={!pasteText.trim()}
                className="w-full"
              >
                Parse pasted data
              </Button>
            </div>
          )}

          <button onClick={downloadSample} className="flex items-center gap-1.5 text-xs text-brand-600 font-medium hover:underline">
            <FileDown className="w-3.5 h-3.5" /> Download sample CSV to see the expected format
          </button>
        </div>
      )}

      {/* ── Step 2: Map columns ── */}
      {step === "map" && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border text-xs text-slate-600">
            <strong>{rawRows.length} rows</strong> found · <strong>{headers.length} columns</strong> detected.
            Assign each column to the correct field. At minimum, <strong>Customer name</strong> is required.
          </div>

          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {headers.map(h => {
              const preview = rawRows.slice(0, 2).map(r => r[h]).filter(Boolean).join(", ")
              return (
                <div key={h} className="flex items-center gap-3 p-3 rounded-xl border bg-white">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{h}</div>
                    {preview && (
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        e.g. {preview}
                      </div>
                    )}
                  </div>
                  <select
                    value={mapping[h] ?? "ignore"}
                    onChange={e => setMapping(m => ({ ...m, [h]: e.target.value as ColumnKey }))}
                    className="h-9 px-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none min-w-[180px]"
                  >
                    {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map(k => (
                      <option key={k} value={k}>{COLUMN_LABELS[k]}</option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>

          {!canConfirmMap && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Please map at least one column to "Customer name" before continuing.
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setStep("upload")}>Back</Button>
            <Button onClick={confirmMapping} disabled={!canConfirmMap}>
              Preview {rawRows.length} rows →
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Preview ── */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border text-xs text-slate-600">
            {validationIssues === 0 ? (
              <><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>All {mappedRows.length} rows look good. Click Import to proceed.</span></>
            ) : (
              <><AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{validationIssues} row{validationIssues > 1 ? "s" : ""} have no phone or email — they will still be imported, but you won't be able to send reminders to them.</span></>
            )}
          </div>

          <div className="border rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0 border-b">
                  <tr>
                    <th className="text-left p-2 font-semibold">#</th>
                    <th className="text-left p-2 font-semibold">Name</th>
                    <th className="text-left p-2 font-semibold">Phone</th>
                    <th className="text-left p-2 font-semibold">Email</th>
                    <th className="text-left p-2 font-semibold">Lang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mappedRows.slice(0, 50).map((r, i) => (
                    <tr key={i} className={!r.phone && !r.email ? "bg-amber-50" : "hover:bg-slate-50"}>
                      <td className="p-2 text-slate-400">{i + 1}</td>
                      <td className="p-2 font-medium">{r.name}</td>
                      <td className="p-2 font-mono text-slate-600">{r.phone || <span className="text-slate-300">—</span>}</td>
                      <td className="p-2 text-slate-600 truncate max-w-[120px]">{r.email || <span className="text-slate-300">—</span>}</td>
                      <td className="p-2">
                        <span className="px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                          {r.preferred_language || "en"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {mappedRows.length > 50 && (
              <div className="text-xs text-center p-2 text-slate-400 border-t">
                Showing first 50 of {mappedRows.length} rows
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-between">
            <Button variant="secondary" onClick={() => setStep("map")}>Back</Button>
            <Button onClick={runImport} disabled={importing} className="gap-1.5">
              {importing ? (
                <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Importing…</>
              ) : (
                <><Upload className="w-4 h-4" /> Import {mappedRows.length} customers</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 4: Done ── */}
      {step === "done" && result && (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Import complete!</h3>
            <p className="text-slate-600 mt-1">
              <span className="font-bold text-emerald-600">{result.created} customers</span> imported successfully.
              {result.failed > 0 && (
                <span className="text-amber-600"> {result.failed} skipped (duplicate or invalid).</span>
              )}
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={close}>Done</Button>
            <Button variant="secondary" onClick={reset}>Import more</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
