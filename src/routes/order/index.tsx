import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  PartyPopper,
  Sparkles,
} from 'lucide-react'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, ErrorBanner } from '@/components/ui/Fields'
import { PhotoUpload } from '@/components/order/PhotoUpload'
import { StyleCards } from '@/components/order/StyleCards'
import { PRICE_LABEL, PRODUCT, STORY_MAX, HERO_MESSAGE } from '@/lib/constants'
import { usePageMeta } from '@/lib/seo'
import { useStyles } from '@/services/hooks'
import { createOrder } from '@/services/orders'
import type { Order } from '@/services/types'
import { cn } from '@/lib/utils'

const STEP_LABELS = ['Your details', 'Child', 'Story & style', 'Review']

interface FormState {
  name: string
  city: string
  locality: string
  address: string
  phone: string
  childAge: string
  photo1: string | null
  photo2: string | null
  styleId: string | null
  story: string
}

const initialForm: FormState = {
  name: '',
  city: '',
  locality: '',
  address: '',
  phone: '',
  childAge: '',
  photo1: null,
  photo2: null,
  styleId: null,
  story: '',
}

type Errors = Partial<Record<keyof FormState | 'phoneFormat', string>>

function validatePhone(phone: string): boolean {
  const digits = phone.replace(/[\s-]/g, '')
  return /^\+?\d{7,15}$/.test(digits)
}

export const Route = createFileRoute('/order/')({ component: OrderRoute })

function OrderRoute() {
  usePageMeta({
    title: 'Order a Custom Children\u2019s Book',
    description: 'Order a custom children\u2019s book featuring your child\u2019s face, with a completely personalized story of your choice.',
  })

  const styles = useStyles()
  const [form, setForm] = useState<FormState>(initialForm)
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [placed, setPlaced] = useState<Order | null>(null)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const enabledStyles = (styles.data ?? []).filter((s) => s.enabled)

  function validateStep(stepNo: number): boolean {
    const next: Errors = {}
    if (stepNo === 1) {
      if (!form.name.trim()) next.name = 'Please enter your name'
      if (!form.city.trim()) next.city = 'Please enter your town or city'
      if (!form.locality.trim()) next.locality = 'Please enter your locality'
      if (!form.address.trim()) next.address = 'Please enter your house address'
      if (!form.phone.trim()) next.phone = 'Phone number is required'
      else if (!validatePhone(form.phone)) {
        next.phone = 'Enter a valid phone number (7–15 digits, + optional)'
        next.phoneFormat = 'invalid'
      }
    } else if (stepNo === 2) {
      const age = Number(form.childAge)
      if (!form.childAge || Number.isNaN(age)) next.childAge = 'Please enter your child\u2019s age'
      else if (age < 0 || age > 18) next.childAge = 'Age should be between 0 and 18'
      if (!form.photo1) next.photo1 = 'Please upload at least one child photo'
    } else if (stepNo === 3) {
      if (!form.styleId) next.styleId = 'Please choose an illustration style'
      if (form.story.length > STORY_MAX) next.story = `Story must be ${STORY_MAX} characters or fewer`
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const selectedStyle = enabledStyles.find((s) => s.id === form.styleId)

  async function placeOrder() {
    const valid = [1, 2, 3].map((s) => validateStep(s)).every(Boolean)
    if (!valid) {
      setStep(1)
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const order = await createOrder({
        customer: {
          name: form.name.trim(),
          city: form.city.trim(),
          locality: form.locality.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
        },
        childAge: Number(form.childAge),
        photos: [form.photo1!, ...(form.photo2 ? [form.photo2] : [])],
        styleId: form.styleId!,
        styleName: selectedStyle?.name ?? '',
        story: form.story,
      })
      setPlaced(order)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setSubmitError('Something went wrong while placing your order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------------- confirmation ---------------- */
  if (placed) {
    return (
      <PublicLayout>
        <div className="container-site animate-pop py-14">
          <div className="mx-auto max-w-xl rounded-3xl border border-leaf-100 bg-white p-8 text-center shadow-card sm:p-10">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-leaf-100 text-leaf-700">
              <CheckCircle2 className="size-9" />
            </span>
            <h1 className="heading-display mt-5 text-3xl">Order received!</h1>
            <p className="mt-2 text-ink-500">
              Thank you, <strong className="text-ink-900">{placed.customer.name}</strong>. We&rsquo;ve received your
              custom children&rsquo;s book order and will be in touch soon.
            </p>
            <dl className="mx-auto mt-6 grid gap-3 rounded-2xl bg-paper-100 p-5 text-left text-sm">
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-ink-500">Order ID</dt>
                <dd className="font-extrabold text-coral-600">{placed.id}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-ink-500">Product</dt>
                <dd className="font-bold text-ink-900">{placed.product.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-ink-500">Style</dt>
                <dd className="font-bold text-ink-900">{placed.styleName || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-ink-500">Total</dt>
                <dd className="font-extrabold text-ink-900">{PRICE_LABEL}</dd>
              </div>
            </dl>
            <p className="mt-5 flex items-center justify-center gap-1.5 text-sm text-ink-500">
              <PartyPopper className="size-4 text-sun-500" aria-hidden="true" />
              Your story is already in the making!
            </p>
            <Link to="/" className="mt-6 inline-block font-bold text-coral-600 hover:underline">
              Back to home
            </Link>
          </div>
        </div>
      </PublicLayout>
    )
  }

  /* ---------------- form ---------------- */
  return (
    <PublicLayout>
      <section className="container-site py-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="heading-display text-2xl sm:text-3xl">{HERO_MESSAGE}</p>
          <p className="mt-3 text-ink-500">
            No account needed — just tell us about your child and we&rsquo;ll do the rest.
          </p>
        </div>

        {/* step indicator */}
        <ol className="mx-auto mt-8 flex max-w-2xl items-center gap-2" aria-label="Order progress">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1
            const active = n === step
            const done = n < step
            return (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    'grid size-8 shrink-0 place-items-center rounded-full text-sm font-extrabold transition-colors',
                    done
                      ? 'bg-leaf-500 text-white'
                      : active
                        ? 'bg-coral-500 text-white shadow-md'
                        : 'bg-paper-200 text-ink-500',
                  )}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? '✓' : n}
                </span>
                <span className={cn('hidden text-xs font-bold sm:inline', active ? 'text-ink-900' : 'text-ink-500')}>
                  {label}
                </span>
                {n < STEP_LABELS.length && <span className="h-0.5 flex-1 rounded bg-paper-200" aria-hidden="true" />}
              </li>
            )
          })}
        </ol>

        <div className="mx-auto mt-8 grid max-w-5xl gap-8 lg:grid-cols-[1fr_320px]">
          {/* form column */}
          <div className="rounded-3xl border border-paper-200 bg-white p-6 shadow-card sm:p-8">
            {submitError && <ErrorBanner message={submitError} />}

            {step === 1 && (
              <div className="animate-fade-in space-y-5">
                <h1 className="heading-display text-2xl">Your details</h1>
                <Input
                  label="Name"
                  required
                  autoComplete="name"
                  value={form.name}
                  error={errors.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Your full name"
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Town / City"
                    required
                    autoComplete="address-level2"
                    value={form.city}
                    error={errors.city}
                    onChange={(e) => set('city', e.target.value)}
                    placeholder="e.g. Mumbai"
                  />
                  <Input
                    label="Locality"
                    required
                    autoComplete="address-level3"
                    value={form.locality}
                    error={errors.locality}
                    onChange={(e) => set('locality', e.target.value)}
                    placeholder="e.g. Andheri West"
                  />
                </div>
                <Textarea
                  label="House Address"
                  required
                  autoComplete="street-address"
                  value={form.address}
                  error={errors.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="House number, street, building…"
                  rows={3}
                />
                <Input
                  label="Phone Number"
                  required
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  error={errors.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="e.g. 98765 43210"
                />
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in space-y-7">
                <h1 className="heading-display text-2xl">About your child</h1>
                <Input
                  label="Child&#8217;s Age"
                  required
                  type="number"
                  min={0}
                  max={18}
                  value={form.childAge}
                  error={errors.childAge}
                  onChange={(e) => set('childAge', e.target.value)}
                  placeholder="e.g. 5"
                  className="max-w-40"
                />
                <PhotoUpload
                  photo1={form.photo1}
                  photo2={form.photo2}
                  onChange1={(v) => set('photo1', v)}
                  onChange2={(v) => set('photo2', v)}
                  photo1Error={errors.photo1}
                />
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in space-y-7">
                <h1 className="heading-display text-2xl">Your story &amp; style</h1>
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between gap-4">
                    <label htmlFor="story" className="text-sm font-bold text-ink-700">
                      Tell us your child&rsquo;s story
                      <span className="ml-0.5 text-coral-500" aria-hidden="true">*</span>
                    </label>
                    <span
                      className={cn(
                        'text-xs font-bold tabular-nums',
                        form.story.length > STORY_MAX ? 'text-red-600' : 'text-ink-500',
                      )}
                      aria-live="polite"
                    >
                      {form.story.length} / {STORY_MAX}
                    </span>
                  </div>
                  <textarea
                    id="story"
                    value={form.story}
                    maxLength={STORY_MAX + 200}
                    onChange={(e) => set('story', e.target.value.slice(0, STORY_MAX))}
                    rows={6}
                    className="w-full rounded-xl border border-paper-300 bg-white px-4 py-2.5 text-ink-900 placeholder:text-ink-500/50 focus:border-coral-400 focus:outline-none focus:ring-4 focus:ring-coral-100"
                    placeholder="Describe the adventure you want for your child — the hero, the friends, the happy ending…"
                  />
                  <p className="mt-1.5 text-sm text-ink-500">
                    Up to {STORY_MAX} characters. Anything goes: dinosaurs, rainbows, tea parties with teddy bears…
                  </p>
                  {errors.story && (
                    <p role="alert" className="mt-1 text-sm font-semibold text-red-600">
                      {errors.story}
                    </p>
                  )}
                </div>
                <StyleCards
                  styles={enabledStyles}
                  selectedId={form.styleId}
                  onSelect={(id) => set('styleId', id)}
                  error={errors.styleId}
                  loading={styles.loading}
                />
              </div>
            )}

            {step === 4 && (
              <div className="animate-fade-in space-y-6">
                <h1 className="heading-display text-2xl">Review your order</h1>
                <dl className="space-y-3 rounded-2xl bg-paper-100/70 p-5 text-sm">
                  <Row k="Name" v={form.name} />
                  <Row k="Town / City" v={form.city} />
                  <Row k="Locality" v={form.locality} />
                  <Row k="Address" v={form.address} />
                  <Row k="Phone" v={form.phone} />
                  <Row k={'Child\u2019s age'} v={form.childAge} />
                  <Row
                    k="Photos"
                    v={
                      <span className="flex gap-2">
                        {[form.photo1, form.photo2]
                          .filter(Boolean)
                          .map((p, i) => (
                            <img key={i} src={p!} alt={`Child photo ${i + 1}`} className="h-14 w-14 rounded-lg object-cover shadow-sm" />
                          ))}
                      </span>
                    }
                  />
                  <Row k="Style" v={selectedStyle?.name ?? '—'} />
                </dl>
                <div className="rounded-2xl border border-paper-200 bg-white p-5 text-sm">
                  <p className="font-bold text-ink-900">{PRODUCT.name}</p>
                  <p className="mt-1 text-ink-500">
                    {PRODUCT.contentPages} content pages · {PRODUCT.totalPages} physical pages · {PRODUCT.interiorRatio} interior ·
                    {PRODUCT.coverRatio} cover
                  </p>
                  <p className="mt-2 text-xs font-semibold text-ink-500">{form.story || 'No story provided'}</p>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-4">
              <Button
                variant="secondary"
                icon={<ArrowLeft className="size-4" />}
                disabled={step === 1 || submitting}
                onClick={() => setStep((s) => Math.max(1, s - 1))}
              >
                Back
              </Button>
              {step < 4 ? (
                <Button
                  onClick={() => {
                    if (validateStep(step)) setStep((s) => s + 1)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  Continue <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button size="lg" loading={submitting} onClick={() => void placeOrder()} className="min-w-44">
                  <Sparkles className="size-5" /> Place Order
                </Button>
              )}
            </div>
          </div>

          {/* summary column */}
          <aside className="h-fit space-y-4 lg:sticky lg:top-24">
            <div className="rounded-3xl border border-paper-200 bg-white p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold">Order summary</h2>
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">Custom children&rsquo;s book</dt>
                  <dd className="font-bold text-ink-900">{PRICE_LABEL}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">Content pages</dt>
                  <dd className="font-bold text-ink-900">{PRODUCT.contentPages}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">Style</dt>
                  <dd className="max-w-40 text-right font-bold text-ink-900">
                    {selectedStyle?.name ?? (step === 3 ? 'Select below' : '—')}
                  </dd>
                </div>
                <div className="mt-3 border-t border-paper-200 pt-3">
                  <div className="flex justify-between gap-3 text-base">
                    <dt className="font-bold text-ink-900">Total</dt>
                    <dd className="font-extrabold text-coral-600">{PRICE_LABEL}</dd>
                  </div>
                </div>
              </dl>
            </div>
            <p className="px-2 text-xs text-ink-500">
              {PRODUCT.name} — {PRODUCT.contentPages} illustrated pages featuring your child&rsquo;s face, printed and
              bound with love.
            </p>
          </aside>
        </div>
      </section>
    </PublicLayout>
  )
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <dt className="shrink-0 font-semibold text-ink-500">{k}</dt>
      <dd className="text-right font-bold text-ink-900">{v}</dd>
    </div>
  )
}
