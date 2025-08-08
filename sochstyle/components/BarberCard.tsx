import { Star, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Define the types based on your database schema
interface Style {
  id: string;
  name: string;
}

interface Barber {
  id: string;
  name: string;
  avatar_url: string;
  rating: number;
  review_count: number;
  min_price: number;
  max_price: number;
  styles: Style[];
  distanceKm?: number;
}

interface BarberCardProps {
  barber: Barber;
}

export default function BarberCard({ barber }: BarberCardProps) {
  return (
    <Card className="w-full overflow-hidden transition-shadow duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={barber.avatar_url} alt={barber.name} />
          <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-lg font-bold">{barber.name}</CardTitle>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{barber.rating.toFixed(1)}</span>
            <span className="ml-1">({barber.review_count} reviews)</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="mb-3">
          <p className="mb-2 text-sm font-medium">Styles:</p>
          <div className="flex flex-wrap gap-2">
            {barber.styles.slice(0, 3).map((style) => (
              <Badge key={style.id} variant="secondary">
                {style.name}
              </Badge>
            ))}
            {barber.styles.length > 3 && (
              <Badge variant="outline">+{barber.styles.length - 3} more</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p className="font-semibold text-primary">
            {barber.min_price/1000}k - {barber.max_price/1000}k UZS
          </p>
          {barber.distanceKm !== undefined && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{barber.distanceKm.toFixed(1)} km</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );\n}
