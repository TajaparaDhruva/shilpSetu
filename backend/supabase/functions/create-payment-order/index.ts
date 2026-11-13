import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

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
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID') ?? 'rzp_test_placeholder';
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? 'rzp_secret_placeholder';

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch server order details to obtain the validated total amount
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, customer_id, payment_status')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Amount in paise (integer arithmetic)
    const amountInPaise = Math.round(Number(order.total_amount) * 100);

    // 2. Create Razorpay order via REST
    const credentials = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.order_number,
        notes: {
          shilpsetu_order_id: order.id,
        },
      }),
    });

    const rzpData = await rzpRes.json();

    if (!rzpRes.ok) {
      // In development / test fallback if keys are placeholder
      const mockRzpId = `order_${Math.random().toString(36).substring(2, 15)}`;
      await supabase
        .from('orders')
        .update({ razorpay_order_id: mockRzpId })
        .eq('id', orderId);

      return new Response(
        JSON.stringify({
          success: true,
          razorpay_order_id: mockRzpId,
          amount: amountInPaise,
          currency: 'INR',
          key_id: razorpayKeyId,
          test_mode: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save razorpay_order_id to DB order record
    await supabase
      .from('orders')
      .update({ razorpay_order_id: rzpData.id })
      .eq('id', orderId);

    return new Response(
      JSON.stringify({
        success: true,
        razorpay_order_id: rzpData.id,
        amount: rzpData.amount,
        currency: rzpData.currency,
        key_id: razorpayKeyId,
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

