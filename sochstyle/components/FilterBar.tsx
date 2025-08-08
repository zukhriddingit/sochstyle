'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { MapPin, ChevronDown } from 'lucide-react';

interface Style {
  id: string;
  name: string;
}

interface FilterBarProps {
  styles: Style[];
  onFilterChange: (filters: any) => void;
  onLocationClick: () => void;
}

export default function FilterBar({ styles, onFilterChange, onLocationClick }: FilterBarProps) {
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([20000, 200000]);

  useEffect(() => {
    onFilterChange({ styles: selectedStyles, priceRange });
  }, [selectedStyles, priceRange, onFilterChange]);

  const handleStyleChange = (styleName: string) => {
    setSelectedStyles((prev) =>
      prev.includes(styleName)
        ? prev.filter((s) => s !== styleName)
        : [...prev, styleName]
    );
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 text-card-foreground md:flex-row md:items-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between md:w-auto">
            <span>Styles ({selectedStyles.length})</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <div className="flex flex-col gap-2 p-4">
            {styles.map((style) => (
              <Label key={style.id} className="flex items-center gap-2 font-normal">
                <Checkbox
                  checked={selectedStyles.includes(style.name)}
                  onCheckedChange={() => handleStyleChange(style.name)}
                />
                {style.name}
              </Label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex-1 md:px-4">
        <Label>Price Range (UZS)</Label>
        <Slider
          min={0}
          max={300000}
          step={10000}
          value={priceRange}
          onValueChange={setPriceRange}
          className="mt-2"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{priceRange[0].toLocaleString()}</span>
          <span>{priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      <Button onClick={onLocationClick} variant="secondary" className="w-full md:w-auto">
        <MapPin className="mr-2 h-4 w-4" />
        Use My Location
      </Button>
    </div>
  );
}
