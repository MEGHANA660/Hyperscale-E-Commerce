import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, CreditCard, Loader2, Lock, ShieldCheck, Smartphone, Truck, X } from 'lucide-react'

/*
 * Payment authorisation step shown after "Place Order".
 *
 * TEST MODE: no real money moves and card details never leave this component
 * (a real gateway would tokenise them in its own hosted fields). We only pass the
 * chosen method to the order service, which charges the payment service.
 *
 * Test cards:  4242 4242 4242 4242 -> approved
 *              4000 0000 0000 0002 -> declined
 *              4000 0000 0000 9995 -> insufficient funds
 * Test OTP:    123456
 */

const TEST_OTP = '123456'
const UPI_RE = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/

function luhnValid(num) {
  const digits = num.replace(/\s+/g, '')
  if (!/^\d{13,19}$/.test(digits)) return false
  let sum = 0
  let dbl = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i])
    if (dbl) { d *= 2; if (d > 9) d -= 9 }
    sum += d
    dbl = !dbl
  }
  return sum % 10 === 0
}

function expiryValid(v) {
  const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(v)
  if (!m) return false
  const month = Number(m[1])
  const year = 2000 + Number(m[2])
  if (month < 1 || month > 12) return false
  const now = new Date()
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)
}

const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`

// Maps the test card number to the method the payment service understands.
function methodForCard(num) {
  const d = num.replace(/\s+/g, '')
  if (d === '4000000000000002') return 'card_declined'
  if (d === '4000000000009995') return 'insufficient_funds'
  return 'card'
}

const METHOD_META = {
  upi: { title: 'UPI / Google Pay', icon: Smartphone },
  card: { title: 'Credit / Debit Card', icon: CreditCard },
  cod: { title: 'Cash on Delivery', icon: Truck },
}

// Mounted fresh each time it opens, so every payment attempt starts clean.
export default function PaymentModal(props) {
  if (!props.open) return null
  return <PaymentDialog key={props.method} {...props} />
}

function PaymentDialog({ method, amount, onClose, onConfirm }) {
  const [step, setStep] = useState('details') // details | otp | approving | processing
  const [upiId, setUpiId] = useState('')
  const [cardNo, setCardNo] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [holder, setHolder] = useState('')
  const [otp, setOtp] = useState('')
  const [otpTries, setOtpTries] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape' && step !== 'processing') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, onClose])

  const meta = METHOD_META[method] || METHOD_META.upi
  const Icon = meta.icon
  const busy = step === 'processing' || step === 'approving'

  const submit = async sendMethod => {
    setStep('processing')
    setError(null)
    try {
      await onConfirm(sendMethod)
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.')
      setStep('details')
    }
  }

  const onDetails = e => {
    e.preventDefault()
    setError(null)
    if (method === 'upi') {
      if (!UPI_RE.test(upiId.trim())) { setError('Enter a valid UPI ID, for example name@okhdfcbank.'); return }
      // Simulates the "approve in your UPI app" request, then charges.
      setStep('approving')
      setTimeout(() => submit('upi'), 1800)
    } else if (method === 'card') {
      if (!holder.trim()) { setError('Enter the name on the card.'); return }
      if (!luhnValid(cardNo)) { setError('That card number is not valid.'); return }
      if (!expiryValid(expiry)) { setError('Enter a valid expiry date as MM/YY.'); return }
      if (!/^\d{3,4}$/.test(cvv)) { setError('Enter the 3 or 4 digit CVV.'); return }
      setStep('otp')
    } else {
      submit('cod')
    }
  }

  const onOtp = e => {
    e.preventDefault()
    if (otp !== TEST_OTP) {
      const tries = otpTries + 1
      setOtpTries(tries)
      if (tries >= 3) {
        setError('Too many wrong OTP attempts. Payment cancelled, no money was taken.')
        setStep('details'); setOtp(''); setOtpTries(0)
      } else {
        setError(`Incorrect OTP. ${3 - tries} attempt${3 - tries === 1 ? '' : 's'} left.`)
      }
      return
    }
    setError(null)
    submit(methodForCard(cardNo))
  }

  const inputCls =
    'w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 text-sm font-medium text-slate-800 ' +
    'placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none'
  const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500'

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Authorise payment">
      <div id="payment-modal" className="w-full max-w-md rounded-t-[28px] bg-white p-6 shadow-2xl sm:rounded-[28px] sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white"><Icon size={20} /></span>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">{meta.title}</h2>
              <p className="text-sm font-medium text-slate-500">Authorise this payment to continue</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"><X size={18} /></button>
        </div>

        <div className="mb-5 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3.5">
          <span className="text-sm font-semibold text-slate-500">{method === 'cod' ? 'Pay on delivery' : 'Amount to pay'}</span>
          <span className="text-2xl font-black tabular-nums text-slate-900" id="payment-amount">{fmt(amount)}</span>
        </div>

        {error && (
          <div id="payment-error" role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-semibold text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
          </div>
        )}

        {step === 'details' && (
          <form onSubmit={onDetails} className="space-y-4">
            {method === 'upi' && (
              <div>
                <label htmlFor="pay-upi" className={labelCls}>UPI ID</label>
                <input id="pay-upi" className={inputCls} value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="name@okhdfcbank" autoComplete="off" autoFocus />
                <p className="mt-2 text-sm text-slate-500">We will send a payment request to your UPI app. Approve it there to pay.</p>
              </div>
            )}
            {method === 'card' && (
              <>
                <div>
                  <label htmlFor="pay-holder" className={labelCls}>Name on card</label>
                  <input id="pay-holder" className={inputCls} value={holder} onChange={e => setHolder(e.target.value)} placeholder="As printed on the card" autoComplete="cc-name" autoFocus />
                </div>
                <div>
                  <label htmlFor="pay-card" className={labelCls}>Card number</label>
                  <input id="pay-card" className={`${inputCls} tabular-nums`} inputMode="numeric" value={cardNo}
                    onChange={e => setCardNo(e.target.value.replace(/[^\d ]/g, '').slice(0, 23))} placeholder="1234 5678 9012 3456" autoComplete="off" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="pay-exp" className={labelCls}>Expiry</label>
                    <input id="pay-exp" className={`${inputCls} tabular-nums`} value={expiry} placeholder="MM/YY" autoComplete="off"
                      onChange={e => {
                        let v = e.target.value.replace(/[^\d]/g, '').slice(0, 4)
                        if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`
                        setExpiry(v)
                      }} />
                  </div>
                  <div>
                    <label htmlFor="pay-cvv" className={labelCls}>CVV</label>
                    <input id="pay-cvv" type="password" className={`${inputCls} tabular-nums`} inputMode="numeric" value={cvv}
                      onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="•••" autoComplete="off" />
                  </div>
                </div>
              </>
            )}
            {method === 'cod' && (
              <p className="rounded-xl bg-amber-50 px-3.5 py-3 text-sm font-medium text-amber-800">
                Nothing is charged now. Keep {fmt(amount)} ready in cash or UPI for the delivery agent.
              </p>
            )}
            <button id="payment-continue" type="submit" className="btn-pill-dark flex w-full items-center justify-center gap-2 py-3.5 text-sm">
              <Lock size={15} />
              {method === 'cod' ? 'Confirm order' : method === 'card' ? 'Continue to verification' : `Send request for ${fmt(amount)}`}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={onOtp} className="space-y-4">
            <div>
              <label htmlFor="pay-otp" className={labelCls}>One-time password</label>
              <input id="pay-otp" className={`${inputCls} text-center text-xl font-bold tracking-[0.5em] tabular-nums`} inputMode="numeric"
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" autoComplete="one-time-code" autoFocus />
              <p className="mt-2 text-sm text-slate-500">Your bank sent a 6 digit OTP to confirm this payment. <span className="font-semibold text-slate-700">Test mode: use 123456.</span></p>
            </div>
            <button id="payment-verify" type="submit" disabled={otp.length !== 6} className="btn-pill-dark flex w-full items-center justify-center gap-2 py-3.5 text-sm disabled:opacity-50">
              <ShieldCheck size={15} /> Verify and pay {fmt(amount)}
            </button>
            <button type="button" onClick={() => { setStep('details'); setError(null) }} className="w-full text-sm font-semibold text-slate-500 hover:text-slate-800">Change card details</button>
          </form>
        )}

        {step === 'approving' && (
          <div className="flex flex-col items-center gap-3 py-6 text-center" id="payment-approving">
            <Loader2 size={30} className="animate-spin text-slate-700" />
            <p className="text-base font-bold text-slate-900">Waiting for approval in your UPI app</p>
            <p className="text-sm text-slate-500">Approve the request for {fmt(amount)} sent to {upiId}. Do not close this window.</p>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center gap-3 py-6 text-center" id="payment-processing">
            <Loader2 size={30} className="animate-spin text-slate-700" />
            <p className="text-base font-bold text-slate-900">{method === 'cod' ? 'Confirming your order' : 'Processing your payment'}</p>
            <p className="text-sm text-slate-500">Please do not refresh or go back.</p>
          </div>
        )}

        <p className="mt-5 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400">
          <CheckCircle2 size={13} /> Test mode: no real money is charged. Card details are never stored.
        </p>
      </div>
    </div>,
    document.body
  )
}
