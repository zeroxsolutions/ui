import { useState, type ReactNode } from 'react';

import { CodeInput } from '@/components/data-entry/code-input';

function CodeInputDemo(): ReactNode {
  const [code, setCode] = useState('');

  return <CodeInput aria-label="Verification code" pattern="3-3" value={code} onChange={setCode} />;
}

export { CodeInputDemo };
