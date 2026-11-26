'use client';

import { useId, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { UploadIcon } from '@/registry/bases/base-ui/icons/lucide/upload-icon';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { FieldError } from '@/registry/bases/base-ui/ui/field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { UploadMessages } from './upload';
import type { BlockUpload } from './use-block-upload';

interface UploadTabsProps {
  /** The address the file uploads into; null draws the link field alone, as for a block given no `upload`. */
  upload: BlockUpload | null;
  messages: UploadMessages;
  /** The tab shown first. Default `upload`. */
  defaultTab?: 'upload' | 'link';
  /** Called once a file starts uploading, as to close the popover the tabs are in. */
  onStart?(): void;
  /** The link field. */
  children: ReactNode;
  className?: string;
}

interface UploadTabsDropZoneProps {
  upload: BlockUpload;
  messages: UploadMessages;
  onStart?(): void;
}

/** The upload tab's panel: a button opening the file picker, and the area a file is dropped on. */
function UploadTabsDropZone({ upload, messages, onStart }: UploadTabsDropZoneProps): ReactNode {
  const errorId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const take = (file: File | undefined): void => {
    if (!file) return;
    const refused = upload.start(file);
    setRefusal(refused);
    if (refused === null) onStart?.();
  };

  const over = (event: DragEvent): void => {
    if (!event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setDragging(true);
  };

  return (
    <div
      data-slot="upload-tabs-drop-zone"
      data-dragging={dragging || undefined}
      onDragEnter={over}
      onDragOver={over}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        take(event.dataTransfer.files[0]);
      }}
      className="cn-editor-block cn-field-description data-dragging:bg-muted/50 data-dragging:border-ring flex flex-col items-center gap-2 border border-dashed p-4 text-center"
    >
      <UploadIcon size={18} aria-hidden />
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-describedby={refusal === null ? undefined : errorId}
        onClick={() => input.current?.click()}
      >
        {messages.chooseFile}
      </Button>
      <span>{messages.dropHint}</span>
      {/* The button above is the control a person reaches; this input only opens the browser's picker for it. */}
      <input
        ref={input}
        type="file"
        hidden
        data-slot="upload-tabs-file-input"
        accept={upload.accept === '' ? undefined : upload.accept}
        onChange={(event) => {
          take(event.currentTarget.files?.[0]);
          event.currentTarget.value = '';
        }}
      />
      {refusal !== null && <FieldError id={errorId} errors={[{ message: refusal }]} />}
    </div>
  );
}

/**
 * The two ways a block takes an image or a file: "Upload", which picks a file or takes one dropped on it, and
 * "Link", the block's own address field. With no upload only the link field is drawn.
 */
function UploadTabs({
  upload,
  messages,
  defaultTab = 'upload',
  onStart,
  children,
  className,
}: UploadTabsProps): ReactNode {
  // The tab it opened on; an address set or cleared while it is open leaves the author on the tab they are in.
  const [opened] = useState(defaultTab);
  if (upload === null) return children;
  return (
    <Tabs data-slot="upload-tabs" defaultValue={opened} className={className}>
      {/* Each panel is drawn at once, so an arrow key shows the tab it reaches, as the tabs pattern does. */}
      <TabsList activateOnFocus className="w-full">
        <TabsTrigger value="upload">{messages.upload}</TabsTrigger>
        <TabsTrigger value="link">{messages.link}</TabsTrigger>
      </TabsList>
      {/* Each panel holds a control of its own, so Tab goes from the tabs straight to it. */}
      <TabsContent value="upload" tabIndex={-1}>
        <UploadTabsDropZone upload={upload} messages={messages} onStart={onStart} />
      </TabsContent>
      <TabsContent value="link" tabIndex={-1} className="flex flex-col gap-3">
        {children}
      </TabsContent>
    </Tabs>
  );
}

export { UploadTabs, type UploadTabsProps };
