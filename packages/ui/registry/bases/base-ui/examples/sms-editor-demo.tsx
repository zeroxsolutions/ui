'use client';

import { useState, type ReactNode } from 'react';

import { smsProfile } from '@zeroxsolutions/editor-core/profiles/index';

import { SmsEditor } from '@/registry/bases/base-ui/editor/profiles/sms/sms-editor';

const profile = smsProfile({ variables: [{ name: 'code', type: 'string', label: 'Code', sampleValue: '482913' }] });

/** A one-segment sign-in code message; the meter counts what the code will cost once it is filled in. */
function SmsEditorDemo(): ReactNode {
  const [body, setBody] = useState('Trip Vietnam: your code is {{code}}. It expires in 10 minutes.');
  return (
    <div className="w-full max-w-md">
      <SmsEditor profile={profile} value={body} onChange={setBody} />
    </div>
  );
}

export { SmsEditorDemo };
