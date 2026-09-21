"""
Controlled terminology + templates per language.
Variables: {{customer_name}}, {{amount_owed}}, {{outstanding_balance}}, {{invoice}}, {{due_date}}, {{payment}}, {{business_name}}, {{pay_link}}
"""
from string import Template
import re

# ------------------------------------------------------------------
# Terminology dictionary
# ------------------------------------------------------------------
TERMINOLOGY = {
    "en": {
        "amount_owed": "Amount Owed",
        "outstanding_balance": "Outstanding Balance",
        "invoice": "Invoice",
        "due_date": "Due Date",
        "payment": "Payment",
        "pay_money": "Pay money",
        "pay_now": "Pay now",
        "reminder": "Reminder",
        "thank_you": "Thank you",
        "overdue": "Overdue",
        "balance": "Balance",
        "total": "Total",
        "currency": "Naira",
        "greeting": "Hello",
        "dear_customer": "Dear customer",
        "kindly_pay": "Kindly pay",
        "we_appreciate": "We appreciate your prompt payment",
    },
    "ha": {
        "amount_owed": "Adadin Bashi",
        "outstanding_balance": "Ragowar Bashi",
        "invoice": "Rasit",
        "due_date": "Ranar Ƙarshe",
        "payment": "Biyan kuɗi",
        "pay_money": "Biyan kuɗi",
        "pay_now": "Biya yanzu",
        "reminder": "Tunatarwa",
        "thank_you": "Na gode",
        "overdue": "Ya wuce lokaci",
        "balance": "Ragowa",
        "total": "Jimla",
        "currency": "Naira",
        "greeting": "Sannu",
        "dear_customer": "Abokin ciniki mai daraja",
        "kindly_pay": "Don Allah biya",
        "we_appreciate": "Muna godiya da biyan ku akan lokaci",
    },
    "yo": {
        "amount_owed": "Iye Owó Tó Jẹ",
        "outstanding_balance": "Iwọntunwọnsì Owó Tó Kù",
        "invoice": "Ìwé Owó",
        "due_date": "Ọjọ́ Tó Yẹ",
        "payment": "Owo sisan",
        "pay_money": "Owo sisan",
        "pay_now": "Sanwo nisisiyi",
        "reminder": "Ìránnilétí",
        "thank_you": "E se gan",
        "overdue": "Tó ti kọjá ọjọ́",
        "balance": "Iwọntunwọnsì",
        "total": "Lápapọ̀",
        "currency": "Naira",
        "greeting": "Bawo",
        "dear_customer": "Onibara ọwọn",
        "kindly_pay": "Jọwọ sanwo",
        "we_appreciate": "A dupẹ fun sisanwo rẹ ni kiakia",
    },
    "ig": {
        "amount_owed": "Ego Ji",
        "outstanding_balance": "Nkwụsị Ego Fọdụrụ",
        "invoice": "Akwụkwọ Ụgwọ",
        "due_date": "Ụbọchị Ruru",
        "payment": "Ịkwụ ụgwọ",
        "pay_money": "Ịkwụ ụgwọ",
        "pay_now": "Kwụọ ụgwọ ugbu a",
        "reminder": "Ihe Ncheta",
        "thank_you": "Daalụ",
        "overdue": "Agafeela oge",
        "balance": "Nkwụsị",
        "total": "Mgbakọta",
        "currency": "Naira",
        "greeting": "Ndewo",
        "dear_customer": "Ezigbo onye ahịa",
        "kindly_pay": "Biko kwụọ ụgwọ",
        "we_appreciate": "Anyị nwere ekele maka ịkwụ ụgwọ gị ngwa ngwa",
    },
    "pcm": {
        "amount_owed": "Money Wey You Owe",
        "outstanding_balance": "Balance Wey Remain",
        "invoice": "Invoice",
        "due_date": "Due Date",
        "payment": "Pay money",
        "pay_money": "Pay money",
        "pay_now": "Pay now now",
        "reminder": "Reminder",
        "thank_you": "Thank you",
        "overdue": "Don overdue",
        "balance": "Balance",
        "total": "Total",
        "currency": "Naira",
        "greeting": "How far",
        "dear_customer": "My correct customer",
        "kindly_pay": "Abeg pay",
        "we_appreciate": "We thank you say you pay quick quick",
    },
}

# ------------------------------------------------------------------
# Templates per language with variables
# ------------------------------------------------------------------
TEMPLATES = {
    "en": {
        "reminder": (
            "{{greeting}} {{customer_name}}, this is a friendly {{reminder}} from {{business_name}}. "
            "Your {{outstanding_balance}} is {{currency}} {{amount_owed}} ({{invoice}} {{invoice_number}}). "
            "{{due_date}}: {{due_date_value}}. {{kindly_pay}} via {{pay_link}}. {{we_appreciate}}. {{thank_you}}!"
        ),
        "overdue": (
            "{{greeting}} {{customer_name}}, your {{payment}} of {{currency}} {{amount_owed}} is {{overdue}} since {{due_date_value}}. "
            "Please {{pay_now}}: {{pay_link}}. Contact us if you donAlready pay."
        ),
        "receipt": (
            "{{thank_you}} {{customer_name}}! We don receive your {{payment}} of {{currency}} {{amount_owed}} for {{invoice}} {{invoice_number}}. Your {{balance}} na {{outstanding_balance}}."
        ),
    },
    "ha": {
        "reminder": (
            "{{greeting}} {{customer_name}}, wannan {{reminder}} ce daga {{business_name}}. "
            "{{outstanding_balance}} naka {{currency}} {{amount_owed}} ne ({{invoice}} {{invoice_number}}). "
            "{{due_date}}: {{due_date_value}}. {{kindly_pay}} ta {{pay_link}}. {{we_appreciate}}. {{thank_you}}!"
        ),
        "overdue": (
            "{{greeting}} {{customer_name}}, {{payment}} naka na {{currency}} {{amount_owed}} ya zama {{overdue}} tun {{due_date_value}}. "
            "Don Allah {{pay_now}}: {{pay_link}}."
        ),
        "receipt": (
            "{{thank_you}} {{customer_name}}! Mun karɓi {{payment}} naka na {{currency}} {{amount_owed}} don {{invoice}} {{invoice_number}}. {{balance}} naka saura {{outstanding_balance}}."
        ),
    },
    "yo": {
        "reminder": (
            "{{greeting}} {{customer_name}}, {{reminder}} yii wa lati ọdọ {{business_name}}. "
            "{{outstanding_balance}} rẹ jẹ {{currency}} {{amount_owed}} ({{invoice}} {{invoice_number}}). "
            "{{due_date}}: {{due_date_value}}. {{kindly_pay}} nipasẹ {{pay_link}}. {{we_appreciate}}. {{thank_you}}!"
        ),
        "overdue": (
            "{{greeting}} {{customer_name}}, {{payment}} rẹ ti {{currency}} {{amount_owed}} ti di {{overdue}} lati {{due_date_value}}. "
            "Jọwọ {{pay_now}}: {{pay_link}}."
        ),
        "receipt": (
            "{{thank_you}} {{customer_name}}! A ti gba {{payment}} rẹ ti {{currency}} {{amount_owed}} fun {{invoice}} {{invoice_number}}. {{balance}} rẹ ku {{outstanding_balance}}."
        ),
    },
    "ig": {
        "reminder": (
            "{{greeting}} {{customer_name}}, nke a bụ {{reminder}} sitere na {{business_name}}. "
            "{{outstanding_balance}} gị bụ {{currency}} {{amount_owed}} ({{invoice}} {{invoice_number}}). "
            "{{due_date}}: {{due_date_value}}. {{kindly_pay}} site na {{pay_link}}. {{we_appreciate}}. {{thank_you}}!"
        ),
        "overdue": (
            "{{greeting}} {{customer_name}}, {{payment}} gị nke {{currency}} {{amount_owed}} agafeela oge site na {{due_date_value}}. "
            "Biko {{pay_now}}: {{pay_link}}."
        ),
        "receipt": (
            "{{thank_you}} {{customer_name}}! Anyị anatala {{payment}} gị nke {{currency}} {{amount_owed}} maka {{invoice}} {{invoice_number}}. {{balance}} gị fọdụrụ bụ {{outstanding_balance}}."
        ),
    },
    "pcm": {
        "reminder": (
            "{{greeting}} {{customer_name}}, na {{reminder}} be this from {{business_name}}. "
            "Your {{outstanding_balance}} na {{currency}} {{amount_owed}} ({{invoice}} {{invoice_number}}). "
            "{{due_date}} na {{due_date_value}}. {{kindly_pay}} with {{pay_link}}. {{we_appreciate}}. {{thank_you}}!"
        ),
        "overdue": (
            "{{greeting}} {{customer_name}}, your {{payment}} of {{currency}} {{amount_owed}} don {{overdue}} since {{due_date_value}}. "
            "Abeg {{pay_now}}: {{pay_link}}."
        ),
        "receipt": (
            "{{thank_you}} {{customer_name}}! We don receive your {{payment}} of {{currency}} {{amount_owed}} for {{invoice}} {{invoice_number}}. Your {{balance}} remain {{outstanding_balance}}."
        ),
    },
}

# Future languages can be added as inactive entries: e.g. ff (Fulfulde), kr (Kanuri), tiv etc.
# To add: insert row in Language with active=False, then add TERMINOLOGY[code] and TEMPLATES[code] without code changes to router.


def get_terminology(lang_code: str, key: str, fallback: str = "en") -> str:
    """Lookup terminology with fallback."""
    if lang_code in TERMINOLOGY and key in TERMINOLOGY[lang_code]:
        return TERMINOLOGY[lang_code][key]
    if fallback in TERMINOLOGY and key in TERMINOLOGY[fallback]:
        return TERMINOLOGY[fallback][key]
    return key


def render_template(template_name: str, lang_code: str, context: dict) -> str:
    """Render template for language with context. Injects terminology defaults."""
    # Resolve language fallback
    lang = lang_code if lang_code in TEMPLATES else "en"
    tmpl_str = TEMPLATES.get(lang, TEMPLATES["en"]).get(template_name)
    if tmpl_str is None:
        tmpl_str = TEMPLATES["en"].get(template_name, "{{greeting}} {{customer_name}} {{amount_owed}}")
    # Merge terminology into context as defaults (lower priority than explicit context)
    merged = {}
    term = TERMINOLOGY.get(lang, TERMINOLOGY["en"])
    for k, v in term.items():
        merged[k] = v
    # Common defaults
    merged.setdefault("currency", "NGN")
    merged.setdefault("business_name", "CollectNaija")
    merged.setdefault("pay_link", "https://pay.collectnaija.com")
    merged.setdefault("invoice_number", "")
    merged.setdefault("due_date_value", "")
    merged.setdefault("outstanding_balance", merged.get("outstanding_balance", ""))
    # Explicit context overrides
    if context:
        for k, v in context.items():
            if v is not None:
                merged[k] = str(v)
    # Simple mustache-style {{var}} replacement
    def replacer(m):
        key = m.group(1).strip()
        return merged.get(key, m.group(0))
    rendered = re.sub(r"\{\{\s*(\w+)\s*\}\}", replacer, tmpl_str)
    return rendered
