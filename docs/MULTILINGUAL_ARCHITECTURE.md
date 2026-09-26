# Multilingual Collections — Architecture & Journey

Reference for the Nigerian Multilingual AI Collections System. Section numbers
(§n) refer to the product requirement.

**Core principle:** one business, many customers, many languages, one
intelligent collections system. The business owner's dashboard language and
each customer's language are independent, and the AI resolves the difference
per conversation.

---

## 1. The three language settings (§2, §3, §17)

| Setting | Scope | Model field |
|---|---|---|
| Dashboard Language | Business owner's own UI | `OrganizationLanguageSettings.dashboard_language` |
| Default Customer Language | Fallback for customers with no preference | `…default_customer_language` |
| AI Communication Language | How the agent replies | `…ai_communication_mode` |
| AI Voice Language | Which TTS voice speaks | `Customer.voice_language` |
| Fallback Language | Last resort | `…fallback_language` |
| Supported Languages | What this org may use | `…supported_languages` (M2M) |

Per-customer override lives on `Customer.preferred_language` and always wins
over the org default.

## 2. Language priority (§5)

```
Customer explicit preference
        ↓
Business configuration (ai_communication_mode)
        ↓
AI language detection
        ↓
Safe fallback language
```

`MultilingualLanguageRouter.resolve_response_language()` implements this.
Two deliberate refinements:

* **Detection is a safety check, not the primary signal** (§11). When a trusted
  customer preference exists, detection validates rather than overrides.
* **Conversation memory sits above detection** (§20). `AIConversation.conversation_language`
  is carried forward so the agent does not re-detect on every message.

## 3. Language detection and confidence (§6, §7)

`router.detect_language(text)` → `(code, confidence)`. Confidence bands:
`HIGH 0.96`, `MEDIUM 0.78`, `UNCERTAIN 0.55`.

Below the escalation threshold the agent stops and asks the customer which
language they prefer rather than guessing (§23).

## 4. Code-switching (§27)

Nigerian customers mix languages mid-sentence. `apps/languages/code_switch.py`
attributes each **clause** to a language:

```python
detect_code_switch(text, keyword_map) -> CodeSwitchResult(
    primary, secondary, confidence, is_code_switched, segments
)
```

Two rules keep it honest:

* **Loanwords are not evidence.** "small", "time", "balance" are shared
  Nigerian English/Pidgin vocabulary and must not outvote the sentence.
* **Register markers *are* evidence.** "wallahi", "abeg", "oya", "japa" mark
  the register deliberately. A clause containing one establishes a code switch
  on its own, regardless of proportion.

A code-switched reply is **not** an escalation — we understood the customer,
so we do not ask them to choose.

## 5. Language switching (§8)

`router.detect_language_switch(history)` reads `CustomerLanguageHistory`. A
mid-conversation switch is followed **only** at `MEDIUM` confidence or better,
so one ambiguous line cannot hijack an established conversation.

A switch moves the *conversation* language. It never changes
`Customer.preferred_language` from a single message — that requires the
customer asking, the owner changing it, or the customer confirming.

## 6. Voice (§9, §10, §22)

```
Customer Voice → STT → Language Detection → Conversation Understanding
              → Business Rules → Response Generation → Language Verification
              → TTS → Customer Voice
```

`VoiceCall` records `language`, `voice_id`, `voice_usable`, `detected_language`,
`stt_confidence`, `language_switch_count`. `CallAttempt` records per-turn
`stt_text` / `stt_confidence` so a bad transcript is diagnosable.

**Before dialling**, `VoiceCallTriggerView` resolves the customer's language and
validates a native voice exists. If not, the call is cancelled and escalated
with `NO_NATIVE_VOICE`. Speaking Igbo with an English voice is worse than not
calling.

`resolve_voice(language)` defaults to `allow_english_fallback=False` — the
downgrade to an English voice must be opted into deliberately.

## 7. Financial safety (§14, §15)

The backend owns every number.

* `BaseProvider._format_amount()` formats the `Decimal` directly. It never goes
  through `float()` (which loses precision on large balances) and drops the
  spurious `.00` on whole-naira amounts.
* Currency is passed to the template **separately** from the figure, so the
  language template can localise it. Customers receive "Naira 85,000", never
  "NGN NGN 85,000.00".
* An LLM styles the sentence; it never computes or restates the balance.
* `render_template` substitutes only known variables — an unknown one renders
  literally, so the test suite fails on dangling placeholders.

## 8. Templates and terminology (§13, §16)

`TERMINOLOGY[lang][concept]` is the controlled dictionary — reviewed financial
vocabulary per language, not machine translation. `NATURAL_VARIANTS[lang][kind]`
holds warm, human phrasings.

Required concepts: `amount_owed`, `outstanding_balance`, `invoice`, `due_date`,
`payment`, `pay_money`, `pay_now`, `reminder`, `thank_you`, `overdue`,
`balance`, `total`, `currency`, `greeting`, `dear_customer`, `kindly_pay`,
`we_appreciate`.

Money-request templates **must** carry a payment link. Receipt templates
**must not** — the customer has already paid, and re-asking corrodes trust.

## 9. Adding a language (§1, §25, §26)

No code changes to the router, templates or UI are required.

1. Insert a `Language` row with `active=False`.
2. Add `TERMINOLOGY[code]` (all required concepts) and
   `NATURAL_VARIANTS[code]` (at least `reminder`, `overdue`).
3. Add `CULTURAL_PROFILES[code]`.
4. For voice, add `VOICE_PERSONAS[code]` and set `text_to_speech_supported`.
5. Run the quality gate. Only then set `active=True` and
   `quality_status='production'`.

A language is **not** production ready because a translation model exists. The
gate must pass first.

## 10. Quality gate (§26)

`apps/languages/tests.py`, `tests_voice.py` — 46 content tests.
`apps/comms/tests_language.py` — 14 rendering/language tests.
`apps/audit/tests_audit.py` — 9 minimisation/retention tests.

Run with Django:

```
.venv/Scripts/python.exe manage.py test apps.languages apps.comms apps.audit
```

Run without Django (this checkout's venv has no Django installed):

```
.venv/Scripts/python.exe backend/apps/languages/_selftest_gate.py
```

The DB-backed registry gate and the migrations are only exercised by the
Django runner.

**Not yet implemented:** the audio half of §26 — speech-recognition accuracy,
background-noise robustness, Nigerian-accent handling, spoken numbers/names.
These need real audio fixtures and a speech provider. `tests_voice.py`
deliberately asserts the gap is still open rather than reporting a pass it
cannot justify.

## 11. Human escalation (§23)

Escalate — never guess — when:

* detection confidence is below threshold,
* no validated native voice exists for the language,
* speech recognition is unreliable,
* the customer asks for a person, or disputes the balance.

An escalation pauses automation and notifies staff. The agent must not keep
producing financial messages it is not confident in.

## 12. Audit trail (§34)

`AICommunicationAudit` — one immutable row per AI communication, recording
customer, languages selected/detected/secondary, confidence, channel, model,
prompt version, response, translation status, voice provider, STT confidence,
call status, escalation and whether a human corrected the output.

Content is minimised: `redact()` strips long digit runs and truncates.
Retention (`apps/audit/policy.py`): recordings 30 days, transcripts 90 days,
metadata 365 days. `purge_expired_ai_audit_content` blanks content columns
rather than deleting rows, so §24 reporting survives the purge.

## 13. Staff translation (§32, §33)

A Hausa-speaking owner can read a Yoruba customer's message. The original is
**never** modified — a translation is stored alongside with its source, target
and confidence, and the UI labels them "View original message" / "View
translated summary". Below `STAFF_TRANSLATION_MIN_CONFIDENCE` (0.70) staff see
the original plus a "needs review" flag rather than a confident wrong answer.

## 14. Quality metrics (§24)

`GET /ai/language-metrics` computes from real data: response rate, payment
conversion, escalation rate, human-correction rate, voice completion rate and
voice recognition rate, per language. Voice metrics read `0` until calls record
`stt_confidence`.

---

## The customer journey (§37)

```
Business Owner
      ↓  creates customer, sets Preferred Language
Creates Customer
      ↓
Creates Invoice
      ↓
Due Date Approaches
      ↓
Collection Engine  →  CommunicationEvent queued
      ↓
Language Router resolves the language
      ↓  customer preference, else org default, else fallback
Renders message in the customer's language
      ↓  §14 amount preserved exactly from the backend Decimal
Safety Validation   →  amount intact, no dangling placeholders
      ↓
Logs AICommunicationAudit  (language, confidence, model, outcome)
      ↓
WhatsApp / SMS / Email
      │
      │   ── voice path ── validate native voice, else escalate (§9/§22)
      ↓
Customer Responds
      ↓
Language Detection  →  code-switch aware (§27)
      ↓
AI Understands Intent
      ↓  conversation memory carries the language forward (§20)
AI Responds in the same / preferred language
      ↓
Customer Pays
      ↓
Backend Verifies Payment   (webhook → balance recalculated)
      ↓
Collection Stops
      ↓
Receipt sent in the customer's language — no payment link
```

Throughout, every decision is explainable: the audit row says which language
was chosen, why, with what confidence, and whether a human intervened.
