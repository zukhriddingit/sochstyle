import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const bookingSchema = z.object({
  barberId: z.string().uuid(),
  styleId: z.string().uuid(),
  slotId: z.string().uuid(),
  customerName: z.string().min(2, 'Name must be at least 2 characters long'),
  customerPhone: z.string().min(9, 'Phone number seems too short'),
});

export async function POST(request: Request) {
  const body = await request.json();

  const validation = bookingSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid booking data', details: validation.error.flatten() }, { status: 400 });
  }

  const { barberId, styleId, slotId, customerName, customerPhone } = validation.data;

  try {
    const supabase = createClient();

    // This should be a transaction, using a database function is best
    const { data, error } = await supabase.rpc('create_booking_and_update_slot', {
      p_barber_id: barberId,
      p_style_id: styleId,
      p_slot_id: slotId,
      p_customer_name: customerName,
      p_customer_phone: customerPhone,
    });

    if (error) {
      console.error('Supabase booking error:', error);
      // Check for specific error messages from the DB function
      if (error.message.includes('Slot not found or already booked')) {
        return NextResponse.json({ error: 'Slot not found or is already booked' }, { status: 409 }); // 409 Conflict
      }
      return NextResponse.json({ error: 'Failed to create booking', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: 'confirmed', booking: data });

  } catch (e) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
