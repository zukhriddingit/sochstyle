'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useDebouncedCallback } from 'use-debounce';

import FilterBar from '@/components/FilterBar';
import BarberCard from '@/components/BarberCard';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Map } from 'lucide-react';

// Dynamically import the MapPanel to avoid SSR issues with Leaflet
const MapPanel = dynamic(() => import('@/components/MapPanel'), { ssr: false });

interface Style {
  id: string;
  name: string;
}

export default function BarbersPage() {
  const [barbers, setBarbers] = useState([]);
  const [allStyles, setAllStyles] = useState<Style[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBarbers = useCallback(async (currentFilters: any, location: any) => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (currentFilters.styles?.length > 0) {
      params.append('styles', currentFilters.styles.join(','));
    }
    if (currentFilters.priceRange) {
      params.append('priceMin', String(currentFilters.priceRange[0]));
      params.append('priceMax', String(currentFilters.priceRange[1]));
    }
    if (location) {
      params.append('lat', location.lat);
      params.append('lng', location.lng);
    }

    try {
      const response = await fetch(`/api/barbers?${params.toString()}`);
      const data = await response.json();
      setBarbers(data);
    } catch (error) {
      console.error('Failed to fetch barbers:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedFetchBarbers = useDebouncedCallback(fetchBarbers, 500);

  useEffect(() => {
    // Fetch all available styles for the filter bar
    const fetchStyles = async () => {
      try {
        const response = await fetch('/api/styles');
        const data = await response.json();
        if (response.ok) {
          setAllStyles(data);
        } else {
          throw new Error(data.error || 'Failed to fetch styles');
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchStyles();
    fetchBarbers({}, null); // Initial fetch
  }, [fetchBarbers]);

  useEffect(() => {
    debouncedFetchBarbers(filters, userLocation);
  }, [filters, userLocation, debouncedFetchBarbers]);

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
  }, []);

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Could not get your location.');
        }
      );
    }
  };

  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Find a Barber</h1>
        <p className="text-muted-foreground">Filter by style, price, and location.</p>
      </header>

      <FilterBar styles={allStyles} onFilterChange={handleFilterChange} onLocationClick={handleLocationClick} />

      <main className="mt-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Barbers List */}
          <div className="md:col-span-7 lg:col-span-8">
            {isLoading ? (
              <p>Loading barbers...</p>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {barbers.length > 0 ? (
                  barbers.map((barber: any) => <BarberCard key={barber.id} barber={barber} />)
                ) : (
                  <p>No barbers found matching your criteria.</p>
                )}
              </div>
            )}
          </div>

          {/* Map Panel - Desktop */}
          <aside className="hidden h-[600px] md:col-span-5 lg:col-span-4 md:block">
            <div className="sticky top-20 rounded-lg border h-full w-full">
              <MapPanel barbers={barbers} userLocation={userLocation} />
            </div>
          </aside>
        </div>
      </main>

      {/* Map Sheet - Mobile */}
      <div className="md:hidden fixed bottom-4 right-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="lg" className="rounded-full shadow-lg">
              <Map className="mr-2 h-5 w-5" />
              View Map
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80%]">
            <SheetHeader>
              <SheetTitle>Map View</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100%-4rem)] w-full py-4">
                <MapPanel barbers={barbers} userLocation={userLocation} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
