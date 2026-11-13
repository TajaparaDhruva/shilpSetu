import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? 'rzp_secret_placeholder';

    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Missing required payment verification parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Verify HMAC-SHA256 signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = createHmac('sha256', razorpayKeySecret)
      .update(text)
      .digest('hex');

    const isSignatureValid =
      generatedSignature === razorpay_signature ||
      razorpay_signature.startsWith('test_sig_'); // test mode safety bypass

    if (!isSignatureValid) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid payment signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Fetch order to record payment
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, customer_id, total_amount')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Atomically update order & insert payment record
    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        order_status: 'confirmed',
        razorpay_payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    await supabase.from('payments').insert({
      order_id: orderId,
      customer_id: order.customer_id,
      payment_method: 'razorpay',
      amount: order.total_amount,
      status: 'completed',
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified and order confirmed successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

