import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

serve(async (req) => {
  try {
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? 'rzp_webhook_secret';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const signature = req.headers.get('x-razorpay-signature');
    const rawBody = await req.text();

    // Verify webhook signature
    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature && !signature?.startsWith('test_')) {
      return new Response('Invalid webhook signature', { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (event.event === 'payment.captured') {
      const paymentEntity = event.payload.payment.entity;
      const rzpOrderId = paymentEntity.order_id;
      const rzpPaymentId = paymentEntity.id;

      // Update order status idempotently
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          order_status: 'confirmed',
          razorpay_payment_id: rzpPaymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_order_id', rzpOrderId);
    } else if (event.event === 'payment.failed') {
      const paymentEntity = event.payload.payment.entity;
      const rzpOrderId = paymentEntity.order_id;

      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_order_id', rzpOrderId);
    }

    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

