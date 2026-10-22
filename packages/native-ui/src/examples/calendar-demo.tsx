import { addDays } from 'date-fns';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Calendar, type DateRange } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';

function CalendarDemo(): ReactNode {
  const thisYear = new Date().getFullYear();
  const [date, setDate] = useState<Date | undefined>(new Date(thisYear, new Date().getMonth(), 12));
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(thisYear, 0, 12),
    to: addDays(new Date(thisYear, 0, 12), 30),
  });

  return (
    <View className="items-center gap-6">
      <Card className="p-0">
        <CardContent className="p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            captionLayout="dropdown"
            className="bg-transparent"
          />
        </CardContent>
      </Card>
      <Card className="p-0">
        <CardContent className="p-0">
          <Calendar
            mode="range"
            defaultMonth={range?.from}
            selected={range}
            onSelect={setRange}
            disabled={(day) => day > new Date() || day < new Date('1900-01-01')}
            className="bg-transparent"
          />
        </CardContent>
      </Card>
    </View>
  );
}

export { CalendarDemo };
