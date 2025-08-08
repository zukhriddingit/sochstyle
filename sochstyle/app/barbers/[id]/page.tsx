import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import RatingStars from '@/components/RatingStars';
import { MapPin, Phone, Tag, Images } from 'lucide-react';

// Define the types for our data
interface Style {
  id: string;
  name: string;
}

interface Barber {
  id: string;
  name: string;
  avatar_url: string;
  cover_image_url: string;
  rating: number;
  review_count: number;
  min_price: number;
  max_price: number;
  address: string;
  district: string;
  styles: Style[];
  // Add a placeholder for a photo gallery
  gallery: string[];
}

async function getBarberById(id: string): Promise<Barber | null> {
  const supabase = createClient();

  const { data: barber, error } = await supabase
    .from('barbers')
    .select(`
      *,
      styles (id, name)
    `)
    .eq('id', id)
    .single();

  if (error || !barber) {
    return null;
  }

  // Placeholder gallery images
  const gallery = [
    '/placeholder-gallery-1.jpg',
    '/placeholder-gallery-2.jpg',
    '/placeholder-gallery-3.jpg',
    '/placeholder-gallery-4.jpg',
  ];

  return { ...barber, gallery };
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const barber = await getBarberById(params.id);
  if (!barber) {
    return { title: 'Barber Not Found' };
  }
  return { title: `${barber.name} - SochStyle` };
}

export default async function BarberDetailPage({ params }: { params: { id: string } }) {
  const barber = await getBarberById(params.id);

  if (!barber) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Cover Image */}
      <div className="relative h-48 w-full overflow-hidden rounded-lg md:h-64">
        <Image
          src={barber.cover_image_url || '/placeholder-cover.jpg'}
          alt={`${barber.name}'s salon`}
          fill
          className="object-cover bg-secondary"
        />
      </div>

      {/* Main Content */}
      <div className="-mt-16 px-4">
        <div className="flex flex-col items-start gap-4 rounded-lg border bg-card p-6 text-card-foreground shadow-lg md:flex-row">
          <Avatar className="h-24 w-24 border-4 border-background md:h-32 md:w-32">
            <AvatarImage src={barber.avatar_url} alt={barber.name} />
            <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h1 className="text-2xl font-bold md:text-3xl">{barber.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
              <div className="flex items-center gap-2">
                <RatingStars rating={barber.rating} />
                <span>({barber.review_count} reviews)</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{barber.district}</span>
              </div>
            </div>
            <p className="mt-2 text-sm">{barber.address}</p>
          </div>

          <Link href={`/book/${barber.id}`} passHref>
            <Button size="lg" className="w-full md:w-auto">Book Now</Button>
          </Link>
        </div>
      </div>

      {/* Details Section */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          {/* Styles */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Tag className="h-5 w-5" /> Styles Offered
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {barber.styles.map(style => (
                <Badge key={style.id} variant="secondary">{style.name}</Badge>
              ))}
            </div>
          </div>

          {/* Gallery */}
          <div className="mt-6 rounded-lg border bg-card p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Images className="h-5 w-5" /> Photo Gallery
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {barber.gallery.map((src, index) => (
                <div key={index} className="relative aspect-square w-full overflow-hidden rounded-md">
                  <Image src={src} alt={`Gallery image ${index + 1}`} fill className="object-cover transition-transform hover:scale-105" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Price & Contact */}
        <div className="md:col-span-1">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold">Details</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price Range:</span>
                <span className="font-medium">{barber.min_price/1000}k - {barber.max_price/1000}k UZS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contact:</span>
                <span className="font-medium">+998 XX XXX-XX-XX</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
