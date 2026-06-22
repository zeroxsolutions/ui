import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card, CardContent } from '@chiselart/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@chiselart/ui/carousel';

const meta: Meta<typeof Carousel> = {
  title: 'Primitives/Carousel',
  component: Carousel,
};
export default meta;

type Story = StoryObj<typeof Carousel>;

export const Default: Story = {
  render: () => (
    <div className="px-12">
      <Carousel className="w-64">
        <CarouselContent>
          {[1, 2, 3, 4, 5].map((n) => (
            <CarouselItem key={n}>
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6 text-4xl font-semibold">
                  {n}
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
};

export const MultipleVisible: Story = {
  render: () => (
    <div className="px-12">
      <Carousel opts={{ align: 'start' }} className="w-80">
        <CarouselContent>
          {Array.from({ length: 8 }).map((_, i) => (
            <CarouselItem key={i} className="basis-1/3">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-4 text-2xl font-semibold">
                  {i + 1}
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
};
