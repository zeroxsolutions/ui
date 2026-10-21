import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

function CardDemo(): ReactNode {
  return (
    <View className="gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Invoice 1042</CardTitle>
          <CardDescription>Due on the 30th</CardDescription>
        </CardHeader>
        <CardContent>
          <Text>Three line items, 480 USD.</Text>
        </CardContent>
        <CardFooter>
          <Button>
            <Text>Pay</Text>
          </Button>
        </CardFooter>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle>Small card</CardTitle>
          <CardDescription>Tighter spacing throughout</CardDescription>
        </CardHeader>
      </Card>
    </View>
  );
}

export { CardDemo };
