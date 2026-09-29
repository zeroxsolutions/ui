import {
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileJson,
  FileText,
  FileType,
  FileVideo,
  type LucideIcon,
} from 'lucide-react';

/** Lowercase extension (no dot) of a file name or path; '' when there is none. */
function extensionOf(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;
  const dot = base.lastIndexOf('.');
  return dot <= 0 ? '' : base.slice(dot + 1).toLowerCase();
}

/** Extension -> lucide icon. Unlisted extensions fall back to a generic file. */
const ICON_BY_EXTENSION: Record<string, LucideIcon> = {
  // instructions / prose
  md: FileText,
  mdx: FileText,
  markdown: FileText,
  txt: FileText,
  rst: FileText,
  pdf: FileText,
  // structured data
  json: FileJson,
  yaml: FileCode,
  yml: FileCode,
  toml: FileCode,
  ini: FileCode,
  env: FileCode,
  // code
  js: FileCode,
  jsx: FileCode,
  ts: FileCode,
  tsx: FileCode,
  mjs: FileCode,
  cjs: FileCode,
  py: FileCode,
  rb: FileCode,
  go: FileCode,
  rs: FileCode,
  java: FileCode,
  kt: FileCode,
  c: FileCode,
  h: FileCode,
  cpp: FileCode,
  cc: FileCode,
  cs: FileCode,
  php: FileCode,
  swift: FileCode,
  lua: FileCode,
  sql: FileCode,
  sh: FileCode,
  bash: FileCode,
  zsh: FileCode,
  html: FileCode,
  xml: FileCode,
  css: FileCode,
  scss: FileCode,
  less: FileCode,
  // images
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  webp: FileImage,
  avif: FileImage,
  bmp: FileImage,
  ico: FileImage,
  svg: FileImage,
  // fonts
  woff: FileType,
  woff2: FileType,
  ttf: FileType,
  otf: FileType,
  eot: FileType,
  // audio / video
  mp3: FileAudio,
  wav: FileAudio,
  ogg: FileAudio,
  flac: FileAudio,
  m4a: FileAudio,
  mp4: FileVideo,
  webm: FileVideo,
  mov: FileVideo,
  avi: FileVideo,
  mkv: FileVideo,
  // archives
  zip: FileArchive,
  tar: FileArchive,
  gz: FileArchive,
  tgz: FileArchive,
  rar: FileArchive,
  '7z': FileArchive,
};

/** The lucide icon a file name or path maps to by its extension; a generic file icon when unlisted. */
function fileTypeIcon(name: string): LucideIcon {
  return ICON_BY_EXTENSION[extensionOf(name)] ?? File;
}

export { fileTypeIcon };
