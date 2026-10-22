import { TrendingUp } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { DirectionProvider } from '@/components/ui/direction';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  Text as ChartText,
  XAxis,
} from '@/lib/charts';

const interactiveChartData = [
  { date: '2024-04-01', desktop: 222, mobile: 150 },
  { date: '2024-04-02', desktop: 97, mobile: 180 },
  { date: '2024-04-03', desktop: 167, mobile: 120 },
  { date: '2024-04-04', desktop: 242, mobile: 260 },
  { date: '2024-04-05', desktop: 373, mobile: 290 },
  { date: '2024-04-06', desktop: 301, mobile: 340 },
  { date: '2024-04-07', desktop: 245, mobile: 180 },
  { date: '2024-04-08', desktop: 409, mobile: 320 },
  { date: '2024-04-09', desktop: 59, mobile: 110 },
  { date: '2024-04-10', desktop: 261, mobile: 190 },
  { date: '2024-04-11', desktop: 327, mobile: 350 },
  { date: '2024-04-12', desktop: 292, mobile: 210 },
  { date: '2024-04-13', desktop: 342, mobile: 380 },
  { date: '2024-04-14', desktop: 137, mobile: 220 },
  { date: '2024-04-15', desktop: 120, mobile: 170 },
  { date: '2024-04-16', desktop: 138, mobile: 190 },
  { date: '2024-04-17', desktop: 446, mobile: 360 },
  { date: '2024-04-18', desktop: 364, mobile: 410 },
  { date: '2024-04-19', desktop: 243, mobile: 180 },
  { date: '2024-04-20', desktop: 89, mobile: 150 },
  { date: '2024-04-21', desktop: 137, mobile: 200 },
  { date: '2024-04-22', desktop: 224, mobile: 170 },
  { date: '2024-04-23', desktop: 138, mobile: 230 },
  { date: '2024-04-24', desktop: 387, mobile: 290 },
  { date: '2024-04-25', desktop: 215, mobile: 250 },
  { date: '2024-04-26', desktop: 75, mobile: 130 },
  { date: '2024-04-27', desktop: 383, mobile: 420 },
  { date: '2024-04-28', desktop: 122, mobile: 180 },
  { date: '2024-04-29', desktop: 315, mobile: 240 },
  { date: '2024-04-30', desktop: 454, mobile: 380 },
];

const interactiveChartConfig = {
  views: {
    label: 'Page Views',
  },
  desktop: {
    label: 'Desktop',
    color: 'var(--chart-2)',
  },
  mobile: {
    label: 'Mobile',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

function ChartInteractiveExample(): ReactNode {
  const [activeChart, setActiveChart] = useState<'desktop' | 'mobile'>('desktop');

  const total = useMemo(
    () => ({
      desktop: interactiveChartData.reduce((acc, curr) => acc + curr.desktop, 0),
      mobile: interactiveChartData.reduce((acc, curr) => acc + curr.mobile, 0),
    }),
    [],
  );

  return (
    <Card className="py-0 pb-4">
      <CardHeader className="border-border items-stretch border-b p-0">
        <View className="flex-1 justify-center gap-1 px-6 pt-4 pb-3">
          <CardTitle>Bar Chart - Interactive</CardTitle>
          <CardDescription>Showing total visitors for the last 3 months</CardDescription>
        </View>
        <View className="flex-row">
          {(['desktop', 'mobile'] as const).map((chart, index) => (
            <Pressable
              key={chart}
              role="button"
              aria-selected={activeChart === chart}
              className={cn(
                'border-border flex-1 justify-center gap-1 border-t px-6 py-4',
                index > 0 && 'border-l',
                activeChart === chart && 'bg-muted/50',
              )}
              onPress={() => setActiveChart(chart)}
            >
              <Text className="text-muted-foreground text-xs">{interactiveChartConfig[chart].label}</Text>
              <Text className="text-lg leading-none font-bold">{total[chart].toLocaleString()}</Text>
            </Pressable>
          ))}
        </View>
      </CardHeader>
      <CardContent className="px-2">
        <ChartContainer config={interactiveChartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart
            accessibilityLayer
            data={interactiveChartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(String(value)).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
];

const firstChartConfig = {
  desktop: {
    label: 'Desktop',
    color: '#2563eb',
  },
  mobile: {
    label: 'Mobile',
    color: '#60a5fa',
  },
} satisfies ChartConfig;

function ChartFirstExample(): ReactNode {
  return (
    <ChartContainer config={firstChartConfig} className="h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value: string) => value.slice(0, 3)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

const areaChartData = [
  { month: 'January', desktop: 186 },
  { month: 'February', desktop: 305 },
  { month: 'March', desktop: 237 },
  { month: 'April', desktop: 73 },
  { month: 'May', desktop: 209 },
  { month: 'June', desktop: 214 },
];

const areaChartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

function ChartAreaExample(): ReactNode {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Area Chart</CardTitle>
        <CardDescription>Showing total visitors for the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={areaChartConfig}>
          <AreaChart
            accessibilityLayer
            data={areaChartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: string) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Area
              dataKey="desktop"
              type="natural"
              fill="var(--color-desktop)"
              fillOpacity={0.4}
              stroke="var(--color-desktop)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Text className="leading-none font-medium">Trending up by 5.2% this month</Text>
            <Icon as={TrendingUp} className="size-4" />
          </View>
          <Text className="text-muted-foreground leading-none">January - June 2024</Text>
        </View>
      </CardFooter>
    </Card>
  );
}

const barChartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'var(--chart-1)',
  },
  mobile: {
    label: 'Mobile',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

function ChartBarExample(): ReactNode {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Bar Chart - Multiple</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={barChartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value: string) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2">
        <View className="flex-row items-center gap-2">
          <Text className="leading-none font-medium">Trending up by 5.2% this month</Text>
          <Icon as={TrendingUp} className="size-4" />
        </View>
        <Text className="text-muted-foreground leading-none">Showing total visitors for the last 6 months</Text>
      </CardFooter>
    </Card>
  );
}

const lineChartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'var(--chart-1)',
  },
  mobile: {
    label: 'Mobile',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

function ChartLineExample(): ReactNode {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Line Chart - Multiple</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={lineChartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: string) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line dataKey="desktop" type="monotone" stroke="var(--color-desktop)" strokeWidth={2} dot={false} />
            <Line dataKey="mobile" type="monotone" stroke="var(--color-mobile)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Text className="leading-none font-medium">Trending up by 5.2% this month</Text>
            <Icon as={TrendingUp} className="size-4" />
          </View>
          <Text className="text-muted-foreground leading-none">Showing total visitors for the last 6 months</Text>
        </View>
      </CardFooter>
    </Card>
  );
}

const pieChartData = [
  { browser: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
  { browser: 'safari', visitors: 200, fill: 'var(--color-safari)' },
  { browser: 'firefox', visitors: 287, fill: 'var(--color-firefox)' },
  { browser: 'edge', visitors: 173, fill: 'var(--color-edge)' },
  { browser: 'other', visitors: 190, fill: 'var(--color-other)' },
];

const pieChartConfig = {
  visitors: {
    label: 'Visitors',
  },
  chrome: {
    label: 'Chrome',
    color: 'var(--chart-1)',
  },
  safari: {
    label: 'Safari',
    color: 'var(--chart-2)',
  },
  firefox: {
    label: 'Firefox',
    color: 'var(--chart-3)',
  },
  edge: {
    label: 'Edge',
    color: 'var(--chart-4)',
  },
  other: {
    label: 'Other',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig;

const totalVisitors = pieChartData.reduce((acc, curr) => acc + curr.visitors, 0);

function ChartPieExample(): ReactNode {
  return (
    <Card className="w-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Pie Chart - Donut with Text</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={pieChartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={pieChartData} dataKey="visitors" nameKey="browser" innerRadius={60} strokeWidth={5}>
              <Label
                content={({ viewBox }) => (
                  <>
                    <ChartText
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      verticalAnchor="middle"
                      fill="var(--foreground)"
                      fontSize={30}
                      fontWeight="bold"
                    >
                      {totalVisitors.toLocaleString()}
                    </ChartText>
                    <ChartText
                      x={viewBox.cx}
                      y={viewBox.cy + 24}
                      textAnchor="middle"
                      verticalAnchor="middle"
                      fill="var(--muted-foreground)"
                      fontSize={12}
                    >
                      Visitors
                    </ChartText>
                  </>
                )}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <View className="flex-row items-center gap-2">
          <Text className="leading-none font-medium">Trending up by 5.2% this month</Text>
          <Icon as={TrendingUp} className="size-4" />
        </View>
        <Text className="text-muted-foreground leading-none">Showing total visitors for the last 6 months</Text>
      </CardFooter>
    </Card>
  );
}

const radarChartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
];

const radarChartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'var(--chart-1)',
  },
  mobile: {
    label: 'Mobile',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

function ChartRadarExample(): ReactNode {
  return (
    <Card className="w-full">
      <CardHeader className="items-center pb-4">
        <CardTitle>Radar Chart - Multiple</CardTitle>
        <CardDescription>Showing total visitors for the last 6 months</CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer config={radarChartConfig} className="mx-auto aspect-square max-h-[250px]">
          <RadarChart data={radarChartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <PolarAngleAxis dataKey="month" />
            <PolarGrid />
            <Radar dataKey="desktop" fill="var(--color-desktop)" fillOpacity={0.6} />
            <Radar dataKey="mobile" fill="var(--color-mobile)" />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <View className="flex-row items-center gap-2">
          <Text className="leading-none font-medium">Trending up by 5.2% this month</Text>
          <Icon as={TrendingUp} className="size-4" />
        </View>
        <Text className="text-muted-foreground leading-none">January - June 2024</Text>
      </CardFooter>
    </Card>
  );
}

const rtlTranslations = {
  january: 'يناير',
  february: 'فبراير',
  march: 'مارس',
  april: 'أبريل',
  may: 'مايو',
  june: 'يونيو',
  desktop: 'سطح المكتب',
  mobile: 'الجوال',
} as const;

const rtlChartData = [
  { month: 'january', desktop: 186, mobile: 80 },
  { month: 'february', desktop: 305, mobile: 200 },
  { month: 'march', desktop: 237, mobile: 120 },
  { month: 'april', desktop: 73, mobile: 190 },
  { month: 'may', desktop: 209, mobile: 130 },
  { month: 'june', desktop: 214, mobile: 140 },
];

function ChartRtlExample(): ReactNode {
  const t = rtlTranslations;
  const dir = 'rtl';

  const chartConfig = {
    desktop: {
      label: t.desktop,
      color: 'var(--chart-2)',
    },
    mobile: {
      label: t.mobile,
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig;

  return (
    <DirectionProvider direction={dir}>
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={rtlChartData}>
          <CartesianGrid vertical={false} orientation={dir === 'rtl' ? 'right' : 'left'} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value: string) => t[value as keyof typeof t].slice(0, 3)}
            reversed={dir === 'rtl'}
          />
          <ChartTooltip
            content={<ChartTooltipContent labelFormatter={(value) => t[String(value) as keyof typeof t]} />}
            labelClassName="w-32"
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
          <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        </BarChart>
      </ChartContainer>
    </DirectionProvider>
  );
}

function ChartDemo(): ReactNode {
  return (
    <View className="w-full gap-6">
      <ChartInteractiveExample />
      <ChartFirstExample />
      <ChartAreaExample />
      <ChartBarExample />
      <ChartLineExample />
      <ChartPieExample />
      <ChartRadarExample />
      <ChartRtlExample />
    </View>
  );
}

export { ChartDemo };
