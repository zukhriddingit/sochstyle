import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('styles')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase styles fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch styles', details: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('Unexpected error fetching styles:', e);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
