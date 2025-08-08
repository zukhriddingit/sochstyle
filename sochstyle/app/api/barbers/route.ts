import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { haversineDistance } from '@/lib/haversine';

const searchParamsSchema = z.object({
  styles: z.string().optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  maxKm: z.coerce.number().min(0).optional(),
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = Object.fromEntries(searchParams.entries());

  const validation = searchParamsSchema.safeParse(query);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid query parameters', details: validation.error.flatten() }, { status: 400 });
  }

  const { styles, priceMin, priceMax, lat, lng, maxKm } = validation.data;

  try {
    const supabase = createClient();
    let barberIdsWithStyle: string[] | null = null;

    // If filtering by styles, get the barbers that offer those styles first
    if (styles) {
      const styleNames = styles.split(',').map(s => s.trim());
      
      const { data: styleData, error: styleError } = await supabase
        .from('styles')
        .select('id')
        .in('name', styleNames);

      if (styleError) throw styleError;
      
      if (styleData && styleData.length > 0) {
        const styleIds = styleData.map(s => s.id);
        const { data: barberStyleData, error: barberStyleError } = await supabase
          .from('barber_styles')
          .select('barber_id')
          .in('style_id', styleIds);

        if (barberStyleError) throw barberStyleError;
        
        barberIdsWithStyle = [...new Set(barberStyleData.map(bs => bs.barber_id))];
      }
      
      // If no barbers are found for the given styles, return an empty array immediately
      if (!barberIdsWithStyle || barberIdsWithStyle.length === 0) {
        return NextResponse.json([]);
      }
    }

    let queryBuilder = supabase
      .from('barbers')
      .select(`
        *,
        styles (id, name)
      `);

    if (priceMin) {
      queryBuilder = queryBuilder.gte('min_price', priceMin);
    }

    if (priceMax) {
      queryBuilder = queryBuilder.lte('max_price', priceMax);
    }

    if (barberIdsWithStyle) {
      queryBuilder = queryBuilder.in('id', barberIdsWithStyle);
    }

    const { data: barbers, error } = await queryBuilder;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch barbers', details: error.message }, { status: 500 });
    }

    let result = barbers as any[];

    if (lat && lng) {
      result = result.map(barber => ({
        ...barber,
        distanceKm: haversineDistance(lat, lng, barber.lat, barber.lng),
      }));

      if (maxKm) {
        result = result.filter(barber => barber.distanceKm <= maxKm);
      }

      result.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
