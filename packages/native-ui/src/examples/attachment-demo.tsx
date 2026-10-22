import { FileCode, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Image, View } from 'react-native';

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';

const images = [
  {
    name: 'workspace.png',
    meta: 'PNG - 820 KB',
    src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=900&auto=format&fit=crop&q=80',
    alt: 'Workspace',
  },
  {
    name: 'desk-reference.jpg',
    meta: 'JPG - 1.1 MB',
    src: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=900&auto=format&fit=crop&q=80',
    alt: 'Desk',
  },
  {
    name: 'office-reference.jpg',
    meta: 'JPG - 940 KB',
    src: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900&auto=format&fit=crop&q=80',
    alt: 'Office',
  },
];

function AttachmentDemo(): ReactNode {
  return (
    <View className="w-full max-w-sm gap-3">
      <AttachmentGroup>
        {images.map((image) => (
          <Attachment key={image.name} orientation="vertical">
            <AttachmentMedia variant="image">
              <Image source={{ uri: image.src }} alt={image.alt} className="size-full" resizeMode="cover" />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{image.name}</AttachmentTitle>
              <AttachmentDescription>{image.meta}</AttachmentDescription>
            </AttachmentContent>
          </Attachment>
        ))}
      </AttachmentGroup>
      <Attachment state="uploading" className="w-full">
        <AttachmentMedia>
          <Spinner />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
          <AttachmentDescription>Uploading - 64%</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Cancel uploading sales-dashboard.pdf">
            <Icon as={X} />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
      <Attachment className="w-full">
        <AttachmentMedia>
          <Icon as={FileCode} />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>message-renderer.tsx</AttachmentTitle>
          <AttachmentDescription>TypeScript - 12 KB</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Remove message-renderer.tsx">
            <Icon as={X} />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
    </View>
  );
}

export { AttachmentDemo };
