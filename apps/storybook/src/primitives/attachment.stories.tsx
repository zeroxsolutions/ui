import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ArrowUpIcon,
  FileTextIcon,
  ImageIcon,
  RotateCwIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react';

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@zeroxsolutions/ui/components/ui/attachment';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@zeroxsolutions/ui/components/ui/input-group';
import { Spinner } from '@zeroxsolutions/ui/components/ui/spinner';

/**
 * `Attachment` is a compound card that represents a single uploaded or pending
 * file. Compose it from `AttachmentMedia` (an icon or image preview),
 * `AttachmentContent` (`AttachmentTitle` + `AttachmentDescription`), and
 * `AttachmentActions` (one or more `AttachmentAction` buttons); an optional
 * `AttachmentTrigger` overlays the whole card to make it activatable. The
 * `state` prop (`idle` / `uploading` / `processing` / `error` / `done`) drives
 * the visual treatment while `size` (`default` / `sm` / `xs`) and `orientation`
 * (`horizontal` / `vertical`) control density and layout. Wrap several cards in
 * `AttachmentGroup` to render a horizontally scrollable, snapping list.
 */
const meta: Meta<typeof Attachment> = {
  title: 'Primitives/Attachment',
  component: Attachment,
};
export default meta;

type Story = StoryObj<typeof Attachment>;

// Inline SVG placeholder so the image previews need no network or brand assets.
const photoSrc =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">' +
      '<rect width="96" height="96" fill="#c4b5fd"/>' +
      '<circle cx="30" cy="34" r="12" fill="#fde68a"/>' +
      '<path d="M0 96 L34 54 L58 78 L78 58 L96 82 L96 96 Z" fill="#34d399"/>' +
      '</svg>',
  );

/**
 * Default horizontal card: an icon preview, a title with a secondary
 * description, and a trailing remove action. An `AttachmentTrigger` overlays the
 * card so the whole surface opens the file, while the remove `AttachmentAction`
 * sits above the overlay.
 */
export const Horizontal: Story = {
  render: () => (
    <Attachment className="w-80">
      <AttachmentMedia>
        <FileTextIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>report.pdf</AttachmentTitle>
        <AttachmentDescription>2.4 MB · PDF</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove report.pdf">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
      <AttachmentTrigger aria-label="Open report.pdf" />
    </Attachment>
  ),
};

/**
 * Vertical orientation with an image preview. `AttachmentMedia` uses the
 * `image` variant to fill the card, and `AttachmentActions` floats over the
 * top-right corner.
 */
export const VerticalMedia: Story = {
  render: () => (
    <Attachment orientation="vertical">
      <AttachmentMedia variant="image">
        <img src={photoSrc} alt="" />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>photo.png</AttachmentTitle>
        <AttachmentDescription>1.1 MB</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove photo.png">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  ),
};

/**
 * The three `size` values side by side — `default`, `sm`, and `xs` — showing how
 * padding, gap, and text scale down for denser lists.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <Attachment size="default" className="w-72">
        <AttachmentMedia>
          <FileTextIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>report.pdf</AttachmentTitle>
          <AttachmentDescription>size = default</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
      <Attachment size="sm" className="w-72">
        <AttachmentMedia>
          <FileTextIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>report.pdf</AttachmentTitle>
          <AttachmentDescription>size = sm</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
      <Attachment size="xs" className="w-72">
        <AttachmentMedia>
          <FileTextIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>report.pdf</AttachmentTitle>
          <AttachmentDescription>size = xs</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
    </div>
  ),
};

/**
 * Lifecycle states stacked together. `uploading` and `processing` swap the
 * media for a `Spinner` and shimmer the title; `error` switches to the
 * destructive treatment with retry/remove actions; `done` is the resolved
 * resting state.
 */
export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Attachment state="uploading" className="w-80">
        <AttachmentMedia>
          <Spinner />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>report.pdf</AttachmentTitle>
          <AttachmentDescription>Uploading… 40%</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
      <Attachment state="processing" className="w-80">
        <AttachmentMedia>
          <Spinner />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>photo.png</AttachmentTitle>
          <AttachmentDescription>Processing preview…</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
      <Attachment state="error" className="w-80">
        <AttachmentMedia>
          <TriangleAlertIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>notes.txt</AttachmentTitle>
          <AttachmentDescription>Upload failed</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Retry notes.txt">
            <RotateCwIcon />
          </AttachmentAction>
          <AttachmentAction aria-label="Remove notes.txt">
            <XIcon />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
      <Attachment state="done" className="w-80">
        <AttachmentMedia>
          <FileTextIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>report.pdf</AttachmentTitle>
          <AttachmentDescription>2.4 MB · PDF</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Remove report.pdf">
            <XIcon />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
    </div>
  ),
};

/**
 * `AttachmentGroup` arranges several vertical cards into a horizontally
 * scrollable, snapping row — the layout for a multi-file upload tray.
 */
export const Group: Story = {
  render: () => (
    <AttachmentGroup className="max-w-md">
      <Attachment orientation="vertical">
        <AttachmentMedia variant="image">
          <img src={photoSrc} alt="" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>photo.png</AttachmentTitle>
        </AttachmentContent>
      </Attachment>
      <Attachment orientation="vertical">
        <AttachmentMedia>
          <FileTextIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>report.pdf</AttachmentTitle>
        </AttachmentContent>
      </Attachment>
      <Attachment orientation="vertical">
        <AttachmentMedia>
          <FileTextIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>notes.txt</AttachmentTitle>
        </AttachmentContent>
      </Attachment>
      <Attachment orientation="vertical">
        <AttachmentMedia>
          <ImageIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>diagram.png</AttachmentTitle>
        </AttachmentContent>
      </Attachment>
    </AttachmentGroup>
  ),
};

/**
 * The composer integration: an `AttachmentGroup` of compact cards sits in an
 * `InputGroup` block-start row, above the message textarea and send button. This
 * is the pending-attachment strip for a chat composer — composed entirely from
 * the shipped `Attachment` + `InputGroup` primitives, no bespoke chip.
 */
export const Composer: Story = {
  render: () => (
    <InputGroup className="w-[28rem]">
      <InputGroupAddon align="block-start">
        <AttachmentGroup className="w-full">
          <Attachment size="sm">
            <AttachmentMedia variant="image">
              <img src={photoSrc} alt="" />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>photo.png</AttachmentTitle>
              <AttachmentDescription>1.1 MB</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction aria-label="Remove photo.png">
                <XIcon />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
          <Attachment size="sm">
            <AttachmentMedia>
              <FileTextIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>report.pdf</AttachmentTitle>
              <AttachmentDescription>2.4 MB</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction aria-label="Remove report.pdf">
                <XIcon />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        </AttachmentGroup>
      </InputGroupAddon>
      <InputGroupTextarea placeholder="Add a message…" />
      <InputGroupAddon align="block-end">
        <InputGroupButton size="icon-sm" aria-label="Send" className="ml-auto">
          <ArrowUpIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};
