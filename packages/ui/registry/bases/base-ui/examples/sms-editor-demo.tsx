'use client';

import { useState, type ReactNode } from 'react';

import { smsProfile } from '@zeroxsolutions/editor-core/profiles/index';

import { SmsEditor } from '@/registry/bases/base-ui/editor/profiles/sms/sms-editor';

const profile = smsProfile({ variables: [{ name: 'code', type: 'string', label: 'code', sampleValue: '482913' }] });

/** A one-segment sign-in code message. The meter counts `{{code}}` as its literal text, not the code it stands for. */
function SmsEditorDemo(): ReactNode {
  const [body, setBody] = useState('Your sign-in code is {{code}}. It expires in 10 minutes.');
  return <SmsEditor label="Message" profile={profile} value={body} onChange={setBody} className="max-w-2xl" />;
}

export { SmsEditorDemo };
