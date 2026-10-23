import type { ReactNode } from 'react';

import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

function NativeSelectDemo(): ReactNode {
  return (
    <NativeSelect aria-label="Status">
      <NativeSelectOption value="">Select status</NativeSelectOption>
      <NativeSelectOption value="todo">Todo</NativeSelectOption>
      <NativeSelectOption value="in-progress">In Progress</NativeSelectOption>
      <NativeSelectOption value="done">Done</NativeSelectOption>
      <NativeSelectOption value="cancelled">Cancelled</NativeSelectOption>
    </NativeSelect>
  );
}

export { NativeSelectDemo };
