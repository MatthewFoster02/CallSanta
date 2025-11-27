import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendOneHourReminderEmail } from '@/lib/email';
import { Call } from '@/types/database';

/**
 * Cron job to send 1-hour reminder emails
 * Runs every 5 minutes via Vercel Cron
 *
 * Finds calls that are:
 * - status: 'scheduled'
 * - payment_status: 'paid'
 * - scheduled_at: between 55-65 minutes from now (to allow for cron timing variations)
 * - reminder_sent event not already logged
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    // Find calls scheduled 55-65 minutes from now
    const minTime = new Date(now.getTime() + 55 * 60 * 1000);
    const maxTime = new Date(now.getTime() + 65 * 60 * 1000);

    // Get scheduled calls in the time window
    const { data: calls, error: fetchError } = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('call_status', 'scheduled')
      .eq('payment_status', 'paid')
      .gte('scheduled_at', minTime.toISOString())
      .lte('scheduled_at', maxTime.toISOString());

    if (fetchError) {
      console.error('Error fetching calls for reminders:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!calls || calls.length === 0) {
      console.log('[Cron] No calls found for reminders');
      return NextResponse.json({ processed: 0, message: 'No reminders to send' });
    }

    console.log(`[Cron] Found ${calls.length} calls for reminders`);

    const results: Array<{
      callId: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const call of calls as Call[]) {
      try {
        console.log('[Cron] Processing call:', JSON.stringify({
          id: call.id,
          child_name: call.child_name,
          parent_email: call.parent_email,
          scheduled_at: call.scheduled_at,
          call_status: call.call_status,
          payment_status: call.payment_status,
        }, null, 2));

        // Check if reminder already sent by looking for event
        const { data: existingEvent } = await supabaseAdmin
          .from('call_events')
          .select('id')
          .eq('call_id', call.id)
          .eq('event_type', 'reminder_email_sent')
          .single();

        if (existingEvent) {
          console.log(`[Cron] Reminder already sent for call ${call.id}, skipping`);
          continue;
        }

        console.log(`[Cron] Sending reminder email for call ${call.id}`);
        // Send the reminder email
        const emailResult = await sendOneHourReminderEmail(call);

        if (emailResult.success) {
          // Log the event
          await supabaseAdmin.from('call_events').insert({
            call_id: call.id,
            event_type: 'reminder_email_sent',
            event_data: {
              email_id: emailResult.id,
              scheduled_at: call.scheduled_at,
            },
          });

          results.push({ callId: call.id, success: true });
          console.log(`Reminder email sent for call ${call.id}`);
        } else {
          results.push({ callId: call.id, success: false, error: emailResult.error });
          console.error(`Failed to send reminder for call ${call.id}:`, emailResult.error);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error processing reminder for call ${call.id}:`, errorMessage);
        results.push({ callId: call.id, success: false, error: errorMessage });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      processed: results.length,
      success: successCount,
      failed: failCount,
      results,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
