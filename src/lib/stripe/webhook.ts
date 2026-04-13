import Stripe from 'stripe'
import stripe from './client'

export function verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('Missing STRIPE_WEBHOOK_SECRET')
  return stripe.webhooks.constructEvent(payload, signature, secret)
}
