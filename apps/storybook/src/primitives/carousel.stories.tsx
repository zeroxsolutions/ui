import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card, CardContent } from '@zeroxsolutions/ui/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@zeroxsolutions/ui/components/ui/carousel';

/**
 * `Carousel` is a slide container built on Embla that scrolls through
 * `CarouselItem` children horizontally or vertically, with keyboard arrow
 * support and `CarouselPrevious`/`CarouselNext` controls that disable at the
 * ends. Slide sizing comes from item basis classes and the `opts` forwarded to
 * Embla.
 */
const meta: Meta<typeof Carousel> = {
  title: 'Primitives/Carousel',
  component: Carousel,
};
export default meta;

type Story = StoryObj<typeof Carousel>;

/** One full-width slide per view, paged with the previous and next controls. */
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

/** Shows three slides at once via `basis-1/3` items and `align: 'start'` snapping. */
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
