import LanguageRouterPreview from "../components/LanguageRouterPreview"
import { Card } from "../components/ui/card"

export default function Languages() {
  return <div className="space-y-4">
    <div>
      <h1 className="text-xl font-bold">Languages</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">Multilingual routing & detection playground — covers dashboard, customers, reminders in 5 languages + scalable registry.</p>
    </div>
    <LanguageRouterPreview />
    <Card className="p-4 text-xs text-slate-500 dark:text-slate-400">
      Backend contracts: <span className="font-mono">GET /languages</span>, <span className="font-mono">POST /languages/detect</span>, <span className="font-mono">GET /languages/resolve</span>, <span className="font-mono">GET/PATCH /organizations/language-settings</span>, <span className="font-mono">GET/PATCH /customers/:id/language</span> — with <span className="font-mono">X-Org-Language</span> header.
    </Card>
  </div>
}
