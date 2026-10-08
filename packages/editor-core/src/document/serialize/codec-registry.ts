import type { ZodType } from 'zod';
import type { EditorFeature } from '../core/types/feature.js';
import type { FallbackStrategy, Format, MarkCodec, NodeCodec } from '../core/types/codec.js';
import type { NodeJSON } from '../core/types/json.js';

/**
 * The per-node/mark codec registry (see the `editor-serialization` spec).
 * Serialization knowledge lives with each feature as a codec; this registry is
 * the lookup the generic walker delegates to. It also holds each type's Zod
 * attribute schema so import can validate produced nodes at the boundary.
 *
 * Engine-free by construction: it deals only in JSON, codecs, and Zod — never
 * the editing engine — which is what lets the static Viewer reuse it on the
 * server without pulling ProseMirror into its module graph.
 */
export interface CodecRegistryOptions {
  /** Strategy when a node has no codec for the target format. Default `children`. */
  defaultFallback?: FallbackStrategy;
}

type CustomNodeSerializer = (node: NodeJSON, ctx: unknown) => string;

export class CodecRegistry {
  private readonly nodeCodecs = new Map<string, NodeCodec>();
  private readonly markCodecs = new Map<string, MarkCodec>();
  private readonly nodeSchemas = new Map<string, ZodType>();
  private readonly markSchemas = new Map<string, ZodType>();
  private readonly customSerializers = new Map<string, Map<string, CustomNodeSerializer>>();
  readonly defaultFallback: FallbackStrategy;

  constructor(options: CodecRegistryOptions = {}) {
    this.defaultFallback = options.defaultFallback ?? 'children';
  }

  registerNodeCodec(codec: NodeCodec): void {
    this.nodeCodecs.set(codec.node, codec);
  }

  registerMarkCodec(codec: MarkCodec): void {
    this.markCodecs.set(codec.mark, codec);
  }

  registerNodeSchema(name: string, schema: ZodType): void {
    this.nodeSchemas.set(name, schema);
  }

  registerMarkSchema(name: string, schema: ZodType): void {
    this.markSchemas.set(name, schema);
  }

  /** Register a serializer for a *new named format* without touching the walker
   *  or the registry core (see "Format Extensibility"). */
  registerNodeSerializer(format: Format, nodeType: string, serialize: CustomNodeSerializer): void {
    const byType = this.customSerializers.get(format) ?? new Map<string, CustomNodeSerializer>();
    byType.set(nodeType, serialize);
    this.customSerializers.set(format, byType);
  }

  nodeCodec(name: string): NodeCodec | undefined {
    return this.nodeCodecs.get(name);
  }

  markCodec(name: string): MarkCodec | undefined {
    return this.markCodecs.get(name);
  }

  nodeSchema(name: string): ZodType | undefined {
    return this.nodeSchemas.get(name);
  }

  markSchema(name: string): ZodType | undefined {
    return this.markSchemas.get(name);
  }

  customNodeSerializer(format: Format, nodeType: string): CustomNodeSerializer | undefined {
    return this.customSerializers.get(format)?.get(nodeType);
  }

  allNodeCodecs(): NodeCodec[] {
    return [...this.nodeCodecs.values()];
  }

  allMarkCodecs(): MarkCodec[] {
    return [...this.markCodecs.values()];
  }
}

/**
 * Build a registry from the shipped built-in codecs (doc/paragraph/text/
 * hardBreak substrate) plus every feature's codecs and attribute schemas, so the
 * Editor and both Viewers draw from one shared registry (see the `editor-viewer`
 * spec). `builtInNodeCodecs` is injected to avoid a cycle with the built-ins.
 */
export function buildCodecRegistry(
  features: EditorFeature[],
  builtInNodeCodecs: NodeCodec[],
  options?: CodecRegistryOptions,
): CodecRegistry {
  const registry = new CodecRegistry(options);
  for (const codec of builtInNodeCodecs) registry.registerNodeCodec(codec);

  for (const feature of features) {
    for (const codec of feature.codecs ?? []) registry.registerNodeCodec(codec);
    for (const codec of feature.markCodecs ?? []) registry.registerMarkCodec(codec);
    for (const node of feature.nodes ?? []) {
      if (node.attrs) registry.registerNodeSchema(node.name, node.attrs);
    }
    for (const mark of feature.marks ?? []) {
      if (mark.attrs) registry.registerMarkSchema(mark.name, mark.attrs);
    }
  }
  return registry;
}
