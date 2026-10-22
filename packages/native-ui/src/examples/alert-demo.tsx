import { CircleAlert, CircleCheck } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

function AlertDemo(): ReactNode {
  return (
    <View className="gap-4">
      <Alert>
        <Icon as={CircleCheck} />
        <AlertTitle>Changes saved</AlertTitle>
        <AlertDescription>Your profile is up to date on every device.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <Icon as={CircleAlert} />
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>Your card was declined. Update it to keep your plan.</AlertDescription>
      </Alert>
      <Alert>
        <AlertTitle>Update ready</AlertTitle>
        <AlertDescription>Restart to finish installing.</AlertDescription>
        <AlertAction>
          <Button size="xs" variant="outline">
            <Text>Restart</Text>
          </Button>
        </AlertAction>
      </Alert>
    </View>
  );
}

export { AlertDemo };
