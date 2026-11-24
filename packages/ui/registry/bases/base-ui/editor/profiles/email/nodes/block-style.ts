import { EditorError, type NodeSpec } from '@zeroxsolutions/editor-core/document/core/index';
import { emailNodeSpecs } from '@zeroxsolutions/editor-core/profiles/index';

export {
  blockClasses,
  justifyClass,
  type BlockStyle as EmailBlockStyle,
} from '../../../document/features/button/block-style';

/** The email profile's spec for `name`, so a view keeps the name and attributes the codecs read. */
export function emailSpec(name: string): NodeSpec {
  const spec = emailNodeSpecs.nodes.find((node) => node.name === name);
  if (!spec) {
    throw new EditorError('editor.email.no_node_spec', `The email profile declares no "${name}" node`);
  }
  return spec;
}
