import { formatPrice } from './money'

type EmailOrder = {
  orderNumber?: string | null
  items: { title: string; size?: string | null; unitPrice: number; quantity: number }[]
  subtotal: number
  deliveryFee: number
  total: number
  customer: { name: string; email: string }
  delivery?: {
    method?: string | null
    address?: string | null
    city?: string | null
    date?: string | null
    timeSlot?: string | null
  } | null
}

const escape = (value: string) =>
  value.replace(/[&<>"]/g, (char) => `&${{ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot' }[char]};`)

export const orderConfirmationEmail = (order: EmailOrder) => {
  const lines = order.items
    .map(
      (item) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e4ddd1">
          ${escape(item.title)}${item.size ? ` <span style="color:#55655a">· ${escape(item.size)}</span>` : ''}
          <br><span style="color:#55655a;font-size:13px">Qty ${item.quantity}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #e4ddd1;text-align:right;white-space:nowrap">
          ${formatPrice(item.unitPrice * item.quantity)}
        </td>
      </tr>`,
    )
    .join('')

  const where =
    order.delivery?.method === 'pickup'
      ? 'You chose to collect this from the studio.'
      : [order.delivery?.address, order.delivery?.city]
          .filter((part): part is string => Boolean(part))
          .map(escape)
          .join(', ')

  const when = [order.delivery?.date?.slice(0, 10), order.delivery?.timeSlot]
    .filter(Boolean)
    .map((part) => escape(String(part)))
    .join(', ')

  return {
    subject: `Iris Garden — order ${order.orderNumber ?? ''} received`,
    html: `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#16241c;background:#faf7f2">
      <h1 style="font-size:26px;font-weight:400;margin:0 0 4px">Thank you, ${escape(order.customer.name)}</h1>
      <p style="color:#55655a;margin:0 0 24px;font-family:system-ui,sans-serif;font-size:14px">
        We have order <strong>${escape(order.orderNumber ?? '')}</strong> and will call you shortly to confirm.
      </p>
      <table style="width:100%;border-collapse:collapse;font-family:system-ui,sans-serif;font-size:14px">${lines}</table>
      <table style="width:100%;border-collapse:collapse;font-family:system-ui,sans-serif;font-size:14px;margin-top:12px">
        <tr><td style="padding:4px 0;color:#55655a">Subtotal</td><td style="text-align:right">${formatPrice(order.subtotal)}</td></tr>
        <tr><td style="padding:4px 0;color:#55655a">Delivery</td><td style="text-align:right">${order.deliveryFee === 0 ? 'Free' : formatPrice(order.deliveryFee)}</td></tr>
        <tr><td style="padding:10px 0 0;font-size:16px">Total, due on delivery</td><td style="text-align:right;padding:10px 0 0;font-size:16px"><strong>${formatPrice(order.total)}</strong></td></tr>
      </table>
      ${where ? `<p style="font-family:system-ui,sans-serif;font-size:14px;color:#55655a;margin-top:24px">${where}${when ? ` — ${when}` : ''}</p>` : ''}
      <p style="font-family:system-ui,sans-serif;font-size:13px;color:#55655a;margin-top:28px">
        Payment is cash or card to the courier on delivery.
      </p>
    </div>`,
  }
}
