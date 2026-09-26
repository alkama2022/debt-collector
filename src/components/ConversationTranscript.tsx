import { useState } from "react"
import { Card } from "./ui/card"
import { Badge, LanguageBadge } from "./ui/badge"
import { Button } from "./ui/button"
import { Modal } from "./ui/modal"
import { MessageSquare, Languages, Split, ArrowLeftRight, ShieldAlert, Clock } from "lucide-react"
import { getLanguage } from "../i18n/registry"

/**
 * Conversation transcript with language provenance (§20, §27, §32, §33).
 *
 * The rule this component exists to enforce: the customer's original words are
 * always shown, and any AI translation is presented *alongside* them, clearly
 * labelled. A staff member must never mistake a translation for what the
 * customer actually said.
 */
export type Message = {
  id: string
  role: "user" | "assistant" | "system" | "tool"
  content: string
  created_at: string
  language_code?: string | null
  detected_language_code?: string | null
  secondary_language_code?: string | null
  language_confidence?: string | number | null
  is_code_switched?: boolean
  was_language_switch?: boolean
  escalated?: boolean
  staff_translation?: string | null
  staff_translation_language?: string | null
  staff_translation_confidence?: string | number | null
}

export type ConversationDetail = {
  id: string
  state: string
  channel: string
  customer: string | null
  conversation_language_code?: string | null
  preferred_language_code?: string | null
  language_source?: string
  language_switch_count?: number
  code_switch_count?: number
  messages?: Message[]
}

function langName(code?: string | null) {
  if (!code) return null
  return getLanguage(code)?.native_name || code
}

function confidencePct(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return null
  const n = typeof value === "string" ? parseFloat(value) : value
  if (Number.isNaN(n)) return null
  return Math.round((n > 1 ? n / 100 : n) * 100)
}

function MessageRow({ msg }: { msg: Message }) {
  // §33: default to the original. Translation is opt-in per message so staff
  // always start from the customer's real words.
  const [showTranslation, setShowTranslation] = useState(false)
  const translation = msg.staff_translation
  const hasTranslation = Boolean(translation && translation.trim())
  const pct = confidencePct(msg.staff_translation_confidence)
  const lowConfidence = pct !== null && pct < 70
  const isCustomer = msg.role === "user"

  return (
    <div className={`rounded-xl border p-3 ${
      isCustomer ? "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700" : "bg-white dark:bg-slate-800"
    }`}>
      <div className="flex items-center gap-2 flex-wrap text-xs mb-2">
        <span className={`font-medium ${isCustomer ? "text-slate-700 dark:text-slate-200" : "text-brand-600 dark:text-brand-400"}`}>
          {isCustomer ? "Customer" : msg.role === "assistant" ? "CollectNaija" : msg.role}
        </span>
        {msg.language_code && <LanguageBadge code={msg.language_code} />}
        {msg.is_code_switched && (
          <Badge tone="warning">
            <Split className="w-3 h-3" /> Code-switched
          </Badge>
        )}
        {msg.was_language_switch && <Badge tone="info">Language switch</Badge>}
        {msg.escalated && (
          <Badge tone="danger">
            <ShieldAlert className="w-3 h-3" /> Escalated
          </Badge>
        )}
        <span className="ml-auto text-slate-400 dark:text-slate-500">
          {new Date(msg.created_at).toLocaleString()}
        </span>
      </div>

      {showTranslation && hasTranslation ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-violet-600 dark:text-violet-400">
            <Languages className="w-3 h-3" />
            Staff translation ({langName(msg.staff_translation_language) || "your language"})
            {pct !== null && <span className="text-slate-400">· {pct}% confidence</span>}
          </div>
          <p className="text-sm leading-relaxed break-anywhere">{translation}</p>
          {lowConfidence && (
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              Low confidence — check against the original before acting on it.
            </p>
          )}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">Customer&apos;s original</p>
            <p className="text-sm leading-relaxed break-anywhere text-slate-700 dark:text-slate-200">{msg.content}</p>
          </div>
          <button
            onClick={() => setShowTranslation(false)}
            className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline"
          >
            Show original only
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm leading-relaxed break-anywhere">{msg.content}</p>
          {hasTranslation && (
            <button
              onClick={() => setShowTranslation(true)}
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-violet-600 dark:text-violet-400 hover:underline"
            >
              <ArrowLeftRight className="w-3 h-3" /> View translated summary
            </button>
          )}
        </>
      )}

      {msg.detected_language_code && msg.detected_language_code !== msg.language_code && (
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          Detected: {langName(msg.detected_language_code)}
          {msg.secondary_language_code && ` + ${langName(msg.secondary_language_code)}`}
        </p>
      )}
    </div>
  )
}

export function ConversationTranscript({
  conversation,
  onClose,
}: {
  conversation: ConversationDetail | null
  onClose: () => void
}) {
  return (
    <Modal open={!!conversation} onClose={onClose} title="Conversation transcript">
      {conversation && (
        <div className="space-y-4">
          {/* §20 language memory summary */}
          <Card className="p-3 bg-slate-50 dark:bg-slate-800/60">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-500 dark:text-slate-400">Conversation language</span>
              {conversation.conversation_language_code
                ? <LanguageBadge code={conversation.conversation_language_code} />
                : <span className="text-slate-400">—</span>}
              {conversation.preferred_language_code && (
                <>
                  <span className="text-slate-400">· preferred</span>
                  <LanguageBadge code={conversation.preferred_language_code} />
                </>
              )}
            </div>
            {(conversation.language_switch_count || conversation.code_switch_count) ? (
              <div className="mt-2 flex items-center gap-3 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                {!!conversation.language_switch_count && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {conversation.language_switch_count} language switch
                    {conversation.language_switch_count === 1 ? "" : "es"}
                  </span>
                )}
                {!!conversation.code_switch_count && (
                  <span className="inline-flex items-center gap-1">
                    <Split className="w-3 h-3" />
                    {conversation.code_switch_count} code-switched message
                    {conversation.code_switch_count === 1 ? "" : "s"}
                  </span>
                )}
                {conversation.language_source && (
                  <span>chosen by: {conversation.language_source.replace(/_/g, " ")}</span>
                )}
              </div>
            ) : null}
          </Card>

          {conversation.messages && conversation.messages.length > 0 ? (
            <div className="space-y-2.5 max-h-[55vh] overflow-auto overscroll-contain pr-1">
              {conversation.messages.map(m => (
                <MessageRow key={m.id} msg={m} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No messages recorded for this conversation yet.
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
