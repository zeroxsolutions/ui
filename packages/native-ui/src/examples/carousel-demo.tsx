import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Text } from '@/components/ui/text';

const SLIDES = [1, 2, 3, 4, 5];

function CarouselDemo(): ReactNode {
  return (
    <View className="gap-10 px-12">
      <Carousel className="w-full max-w-xs self-center">
        <CarouselContent>
          {SLIDES.map((slide) => (
            <CarouselItem key={slide}>
              <View className="p-1">
                <Card>
                  <CardContent className="aspect-square items-center justify-center p-6">
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
      <Carousel opts={{ align: 'start' }} className="w-full max-w-xs self-center">
        <CarouselContent>
          {SLIDES.map((slide) => (
            <CarouselItem key={slide} className="basis-1/2">
              <View className="p-1">
                <Card>
                  <CardContent className="aspect-square items-center justify-center p-6">
                    <Text className="text-3xl font-semibold">{slide}</Text>
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
  );
}

export { CarouselDemo };
