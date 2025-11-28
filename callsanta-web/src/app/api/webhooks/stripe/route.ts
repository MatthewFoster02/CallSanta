import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { constructWebhookEvent } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendBookingConfirmationEmail } from '@/lib/email';
import { initiateCall } from '@/lib/elevenlabs';
import { Call } from '@/types/database';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      }

      case 'payment_intent.succeeded': {
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const callId = session.metadata?.call_id;
  const isRecordingPurchase = session.metadata?.type === 'recording_purchase';

  if (!callId) {
    console.error('No call_id in session metadata');
    return;
  }

  if (isRecordingPurchase) {
    // Recording purchases are now free - this path should not be hit
    console.log('Ignoring recording_purchase webhook - recordings are now free');
    return;
  }

  // Fetch the call first to check call_now flag
  const { data: call, error: fetchCallError } = await supabaseAdmin
    .from('calls')
    .select('*')
    .eq('id', callId)
    .single();

  if (fetchCallError || !call) {
    console.error('[Stripe] Error fetching call:', fetchCallError);
    throw fetchCallError || new Error('Call not found');
  }

  const typedCall = call as Call;
  const includeRecording = session.metadata?.include_recording === 'true';

  // If call_now is true, initiate the call immediately
  if (typedCall.call_now) {
    console.log(`[Stripe] Call Now detected for call ${callId} - initiating immediately`);

    try {
      const result = await initiateCall(typedCall.phone_number, {
        childName: typedCall.child_name,
        childAge: typedCall.child_age,
        giftBudget: typedCall.gift_budget,
        childInfoText: typedCall.child_info_text || undefined,
        childInfoVoiceTranscript: typedCall.child_info_voice_transcript || undefined,
      });

      // Update call with queued status and ElevenLabs/Twilio IDs
      const { error: updateError } = await supabaseAdmin
        .from('calls')
        .update({
          payment_status: 'paid',
          call_status: 'queued',
          stripe_payment_intent_id: session.payment_intent as string,
          recording_purchased: includeRecording,
          twilio_call_sid: result.callSid,
          elevenlabs_conversation_id: result.conversationId,
          call_started_at: new Date().toISOString(),
        })
        .eq('id', callId);

      if (updateError) {
        console.error('[Stripe] Error updating call after immediate initiation:', updateError);
        throw updateError;
      }

      await logCallEvent(callId, 'call_initiated', {
        conversation_id: result.conversationId,
        call_sid: result.callSid,
        success: result.success,
        triggered_by: 'stripe_webhook_call_now',
      });

      console.log(`[Stripe] Immediately initiated call ${callId} for ${typedCall.child_name}`);
    } catch (initiateError) {
      // If call initiation fails, still mark as paid but set status to failed
      console.error(`[Stripe] Failed to initiate call ${callId}:`, initiateError);

      await supabaseAdmin
        .from('calls')
        .update({
          payment_status: 'paid',
          call_status: 'failed',
          stripe_payment_intent_id: session.payment_intent as string,
          recording_purchased: includeRecording,
        })
        .eq('id', callId);

      await logCallEvent(callId, 'call_failed', {
        error: initiateError instanceof Error ? initiateError.message : String(initiateError),
        triggered_by: 'stripe_webhook_call_now',
      });
    }
  } else {
    // Standard scheduled call - let cron handle it
    const { error } = await supabaseAdmin
      .from('calls')
      .update({
        payment_status: 'paid',
        call_status: 'scheduled',
        stripe_payment_intent_id: session.payment_intent as string,
        recording_purchased: includeRecording,
      })
      .eq('id', callId);

    if (error) {
      console.error('Error updating call after payment:', error);
      throw error;
    }
  }

  await logCallEvent(callId, 'payment_received', {
    session_id: session.id,
    payment_intent: session.payment_intent,
    amount: session.amount_total,
    include_recording: includeRecording,
    call_now: typedCall.call_now,
  });

  // Send confirmation email
  console.log('[Stripe] Fetched call for booking confirmation:', {
    id: typedCall.id,
    parent_email: typedCall.parent_email,
    child_name: typedCall.child_name,
  });

  console.log('[Stripe] Sending booking confirmation email...');
  const emailResult = await sendBookingConfirmationEmail(typedCall);
  console.log('[Stripe] Booking confirmation email result:', emailResult);
  await logCallEvent(callId, 'booking_confirmation_email_sent', {
    email_result: emailResult,
  });

  console.log(`[Stripe] Checkout completed for call ${callId}`);
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const callId = paymentIntent.metadata?.call_id;

  if (!callId) {
    // This might be from a payment link without metadata
    console.log('Payment intent succeeded without call_id metadata');
    return;
  }

  const isRecordingPurchase = paymentIntent.metadata?.type === 'recording_purchase';
  const includeRecording = paymentIntent.metadata?.include_recording === 'true';

  if (isRecordingPurchase) {
    // Recording purchase - simple update
    const { error: updateError } = await supabaseAdmin
      .from('calls')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        recording_purchased: true,
        recording_purchased_at: new Date().toISOString(),
      })
      .eq('id', callId);

    if (updateError) {
      console.error('Error updating call after recording purchase:', updateError);
      throw updateError;
    }
  } else {
    // Call booking payment - check for call_now
    const { data: call, error: fetchError } = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (fetchError || !call) {
      console.error('[Stripe PI] Error fetching call:', fetchError);
      throw fetchError || new Error('Call not found');
    }

    const typedCall = call as Call;

    if (typedCall.call_now) {
      console.log(`[Stripe PI] Call Now detected for call ${callId} - initiating immediately`);

      try {
        const result = await initiateCall(typedCall.phone_number, {
          childName: typedCall.child_name,
          childAge: typedCall.child_age,
          giftBudget: typedCall.gift_budget,
          childInfoText: typedCall.child_info_text || undefined,
          childInfoVoiceTranscript: typedCall.child_info_voice_transcript || undefined,
        });

        const { error: updateError } = await supabaseAdmin
          .from('calls')
          .update({
            payment_status: 'paid',
            call_status: 'queued',
            stripe_payment_intent_id: paymentIntent.id,
            recording_purchased: includeRecording,
            twilio_call_sid: result.callSid,
            elevenlabs_conversation_id: result.conversationId,
            call_started_at: new Date().toISOString(),
          })
          .eq('id', callId);

        if (updateError) {
          console.error('[Stripe PI] Error updating call after immediate initiation:', updateError);
          throw updateError;
        }

        await logCallEvent(callId, 'call_initiated', {
          conversation_id: result.conversationId,
          call_sid: result.callSid,
          success: result.success,
          triggered_by: 'stripe_webhook_payment_intent_call_now',
        });

        console.log(`[Stripe PI] Immediately initiated call ${callId} for ${typedCall.child_name}`);
      } catch (initiateError) {
        console.error(`[Stripe PI] Failed to initiate call ${callId}:`, initiateError);

        await supabaseAdmin
          .from('calls')
          .update({
            payment_status: 'paid',
            call_status: 'failed',
            stripe_payment_intent_id: paymentIntent.id,
            recording_purchased: includeRecording,
          })
          .eq('id', callId);

        await logCallEvent(callId, 'call_failed', {
          error: initiateError instanceof Error ? initiateError.message : String(initiateError),
          triggered_by: 'stripe_webhook_payment_intent_call_now',
        });
      }
    } else {
      // Standard scheduled call
      const { error: updateError } = await supabaseAdmin
        .from('calls')
        .update({
          payment_status: 'paid',
          call_status: 'scheduled',
          stripe_payment_intent_id: paymentIntent.id,
          recording_purchased: includeRecording,
        })
        .eq('id', callId);

      if (updateError) {
        console.error('Error updating call after payment intent success:', updateError);
        throw updateError;
      }
    }
  }

  await logCallEvent(callId, 'payment_intent_succeeded', {
    payment_intent_id: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    include_recording: includeRecording,
    type: paymentIntent.metadata?.type,
  });
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const callId = paymentIntent.metadata?.call_id;

  if (!callId) {
    console.log('Payment failed without call_id metadata');
    return;
  }

  const { error } = await supabaseAdmin
    .from('calls')
    .update({
      payment_status: 'failed',
      stripe_payment_intent_id: paymentIntent.id,
    })
    .eq('id', callId);

  if (error) {
    console.error('Error updating call after payment failure:', error);
    throw error;
  }

  await logCallEvent(callId, 'payment_failed', {
    payment_intent_id: paymentIntent.id,
    error: paymentIntent.last_payment_error?.message,
  });

  console.log(`Payment failed for call ${callId}`);
}

async function logCallEvent(
  callId: string,
  eventType: string,
  eventData: Record<string, unknown>
) {
  const { error } = await supabaseAdmin.from('call_events').insert({
    call_id: callId,
    event_type: eventType,
    event_data: eventData,
  });

  if (error) {
    console.error('Error logging call event:', error);
  }
}
