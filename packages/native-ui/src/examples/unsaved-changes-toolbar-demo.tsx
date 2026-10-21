import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import {
  UnsavedChangesToolbar,
  UnsavedChangesToolbarActions,
  UnsavedChangesToolbarMessage,
  UnsavedChangesToolbarReset,
  UnsavedChangesToolbarSave,
} from '@/components/feedback/unsaved-changes-toolbar';

function UnsavedChangesToolbarDemo(): ReactNode {
  const [isSaving, setIsSaving] = useState(false);

  return (
    <View className="h-40">
      <UnsavedChangesToolbar state={isSaving ? 'saving' : 'default'}>
        <UnsavedChangesToolbarMessage>
          {isSaving ? 'Saving your changes...' : 'You have unsaved changes.'}
        </UnsavedChangesToolbarMessage>
        <UnsavedChangesToolbarActions>
          <UnsavedChangesToolbarReset onPress={() => setIsSaving(false)}>Reset</UnsavedChangesToolbarReset>
          <UnsavedChangesToolbarSave onPress={() => setIsSaving(true)}>
            {isSaving ? 'Saving...' : 'Save changes'}
          </UnsavedChangesToolbarSave>
        </UnsavedChangesToolbarActions>
      </UnsavedChangesToolbar>
    </View>
  );
}

export { UnsavedChangesToolbarDemo };
