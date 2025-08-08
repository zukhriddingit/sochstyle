import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid({ message: "Invalid UUID for barber ID" }),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const validation = paramsSchema.safeParse(params);

  if (!validation.success) {
    return NextResponse.json({ error: 'Valid barber ID is required', details: validation.error.flatten() }, { status: 400 });
  }
  
  const { id } = validation.data;

  try {
    const supabase = createClient();

    // Fetch barber details and their styles
    const { data: barber, error: barberError } = await supabase
      .from('barbers')
      .select(`
        *,
        styles (id, name)
      `)
      .eq('id', id)
      .single();

    if (barberError || !barber) {
      if (barberError?.code === 'PGRST116') { // PostgREST code for no rows found
        return NextResponse.json({ error: 'Barber not found' }, { status: 404 });
      }
      console.error('Supabase barber fetch error:', barberError);
      return NextResponse.json({ error: 'Failed to fetch barber details', details: barberError?.message }, { status: 500 });
    }

    // Fetch available slots for the next 14 days
    const today = new Date();
    const fourteenDaysFromNow = new Date(today);
    fourteenDaysFromNow.setDate(today.getDate() + 14);

    const { data: slots, error: slotsError } = await supabase
      .from('slots')
      .select('*')
      .eq('barber_id', id)
      .eq('is_booked', false)
      .gte('starts_at', today.toISOString())
      .lte('starts_at', fourteenDaysFromNow.toISOString())
      .order('starts_at', { ascending: true });

    if (slotsError) {
      console.error('Supabase slots fetch error:', slotsError);
      return NextResponse.json({ error: 'Failed to fetch available slots', details: slotsError.message }, { status: 500 });
    }

    return NextResponse.json({ ...barber, slots });

  } catch (e) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
