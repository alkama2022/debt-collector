import LanguageRouterPreview from "../components/LanguageRouterPreview"
import { LanguagePerformance } from "../components/LanguagePerformance"
import { Card } from "../components/ui/card"

export default function Languages() {
  return <div className="space-y-4">
    <div>
      <h1 className="text-xl font-bold">Languages</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">Multilingual routing, detection & code-switching playground — dashboard, customers and reminders in 5 languages on a scalable registry.</p>
    </div>
    <LanguageRouterPreview />
    <LanguagePerformance />
    <Card className="p-4 text-xs text-slate-500 dark:text-slate-400 space-y-2">
      <p className="font-medium text-slate-700 dark:text-slate-300">Backend contracts</p>
      <p>
        <span className="font-mono">GET /languages</span>,{" "}
        <span className="font-mono">POST /languages/detect</span>,{" "}
        <span className="font-mono">GET /languages/resolve</span>,{" "}
        <span className="font-mono">GET/PATCH /organizations/language-settings</span>,{" "}
        <span className="font-mono">GET/PATCH /customers/:id/language</span> — with{" "}
        <span className="font-mono">X-Org-Language</span> header.
      </p>
      <p>
        <span className="font-mono">POST /ai/detect-language</span> (code-switch detection),{" "}
        <span className="font-mono">POST /ai/voice-language</span> (voice persona — check{" "}
        <span className="font-mono">usable</span> before dialling),{" "}
        <span className="font-mono">POST /ai/staff-translation</span> (never overwrites the original),{" "}
        <span className="font-mono">GET /ai/language-metrics</span> (per-language performance).
      </p>
      <p className="text-slate-400 dark:text-slate-500">
        A language is only marked <span className="font-mono">production</span> once it passes the
        quality gate in <span className="font-mono">backend/apps/languages/tests.py</span>.
      </p>
    </Card>
  </div>
}
