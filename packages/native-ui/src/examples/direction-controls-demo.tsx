import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { DirectionProvider } from '@/components/ui/direction';
import { Slider } from '@/components/ui/slider';
import { Text } from '@/components/ui/text';

const SLIDES = [1, 2, 3];

/** A slider, a calendar and a carousel laid out right to left, whose arrow keys run the way the layout reads. */
function DirectionControlsDemo(): ReactNode {
  return (
    <DirectionProvider direction="rtl">
      <View className="items-center gap-8 px-12">
        <Slider defaultValue={50} max={100} step={1} aria-label="Volume" className="w-full max-w-xs" />
        <Calendar mode="single" />
        <Carousel className="w-full max-w-xs">
          <CarouselContent>
            {SLIDES.map((slide) => (
              <CarouselItem key={slide}>
                <View className="p-1">
                  <Card>
                    <CardContent className="aspect-square items-center justify-center">
                      <Text className="text-4xl font-semibold">{slide}</Text>
                    </CardContent>
                  </Card>
                </View>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </View>
    </DirectionProvider>
  );
}

export { DirectionControlsDemo };
