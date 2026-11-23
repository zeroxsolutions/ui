'use client';

import { useEffect, useId, useState } from 'react';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Field, FieldDescription, FieldError } from '@/registry/bases/base-ui/ui/field';
import { Popover, PopoverHeader, PopoverTitle } from '@/registry/bases/base-ui/ui/popover';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { hrefProblem, variableTokens } from '@zeroxsolutions/editor-core/template/index';
import { RectPopover } from '../../document/ui/rect-popover';
import type { Point } from '../../document/ui/selection-rect';
import { DEFAULT_PROFILE_MESSAGES, type ProfileEditorMessages } from '../messages';
import { variableIcon, variableLabel } from '../variables/variable';
import { VariableTextField } from '../variables/variable-text-field';
import { contextOf, onEmailLinkRequest, type EmailLinkTarget } from './kit-context';

export interface EmailLinkPopoverProps {
  /** An editor built from `emailKit`, whose `editEmailLink` command opens the popover. */
  editor: IEditor;
  /** Its words; the English when absent. */
  messages?: ProfileEditorMessages;
}

/** Where the popover hangs: under the button, or under the text the link covers. */
function emailLinkPopoverRect(editor: IEditor, target: EmailLinkTarget): Point | null {
  const view = contextOf(editor)?.engine.view;
  if (!view) return null;
  if (target.kind === 'button') {
    const button = view.nodeDOM(target.pos);
    if (!(button instanceof HTMLElement)) return null;
    const { top, left, bottom, right } = button.getBoundingClientRect();
    return { top, left, bottom, right };
  }
  const start = view.coordsAtPos(target.from);
  const end = view.coordsAtPos(target.to);
  return {
    top: Math.min(start.top, end.top),
    left: start.left,
    bottom: Math.max(start.bottom, end.bottom),
    right: end.right,
  };
}

/** Puts the editor's selection back on what the popover edits, which the popover's own focus left alone. */
function selectEmailLinkTarget(editor: IEditor, target: EmailLinkTarget): boolean {
  const engine = contextOf(editor)?.engine;
  if (!engine) return false;
  const chain = engine.chain().focus();
  return (
    target.kind === 'button'
      ? chain.setNodeSelection(target.pos)
      : chain.setTextSelection({ from: target.from, to: target.to })
  ).run();
}

/**
 * The link popover of an email editor: one variable text field for the href, which may be a fixed address, an
 * address with variables in it, or a variable alone, and the declared `url` variables as one-click choices. The
 * toolbar's and the bubble's Link and a button's block menu Link open it, through the kit's `editEmailLink`, on
 * the selection's link or the picked button's href. Render one beside the editor.
 */
export function EmailLinkPopover({ editor, messages = DEFAULT_PROFILE_MESSAGES }: EmailLinkPopoverProps) {
  const [open, setOpen] = useState<{ target: EmailLinkTarget; rect: Point | null } | null>(null);
  const [href, setHref] = useState('');
  const titleId = useId();
  const problemId = useId();
  const variablesId = useId();

  useEffect(
    () =>
      onEmailLinkRequest(editor, (target) => {
        setOpen({ target, rect: emailLinkPopoverRect(editor, target) });
        setHref(target.href);
      }),
    [editor],
  );

  const context = contextOf(editor)?.context;
  const declarations = () => context?.declarations() ?? [];
  const typeOf = (name: string) => declarations().find((declaration) => declaration.name === name)?.type;
  const target = open?.target;
  const trimmed = href.trim();

  // An undeclared token is its own problem, which its chip also shows; one that opens the href is the only one.
  const undeclared = [...new Set(variableTokens(trimmed))].filter((name) => typeOf(name) === undefined);
  const leadingUndeclared = undeclared.some((name) => trimmed.startsWith(`{{${name}}}`));
  const faulty = trimmed !== '' && !leadingUndeclared && hrefProblem(trimmed, typeOf) !== null;
  const problems = [
    ...undeclared.map((name) => messages.problem({ kind: 'variable-undeclared', block: null, name })),
    ...(faulty && target
      ? [messages.problem({ kind: target.kind === 'button' ? 'href-invalid' : 'link-invalid', block: null })]
      : []),
  ];
  const urls = declarations().filter((declaration) => declaration.type === 'url');
  const reason = target?.reason ?? null;

  const close = () => {
    setOpen(null);
    editor.focus();
  };
  const apply = (next: string) => {
    const value = next.trim();
    if (!target || value === '' || reason !== null) return;
    selectEmailLinkTarget(editor, target);
    editor.run(target.kind === 'button' ? 'setButtonLink' : 'setEmailLink', { href: value });
    close();
  };
  const remove = () => {
    if (!target) return;
    selectEmailLinkTarget(editor, target);
    editor.run('unsetEmailLink');
    close();
  };

  return (
    <Popover
      open={open !== null}
      onOpenChange={(next) => {
        if (!next) setOpen(null);
      }}
    >
      <RectPopover
        rect={open?.rect ?? null}
        side="bottom"
        align="start"
        // The field takes the focus once it is built, which is after the popup opens.
        initialFocus={false}
        aria-labelledby={titleId}
        data-slot="email-link-popover"
        className="w-80"
      >
        {target && (
          <>
            <PopoverHeader>
              <PopoverTitle id={titleId}>{messages.link}</PopoverTitle>
            </PopoverHeader>
            <Field data-invalid={problems.length > 0 || undefined} data-disabled={reason !== null || undefined}>
              <VariableTextField
                value={href}
                onValueChange={setHref}
                onCommit={apply}
                declarations={declarations}
                variables={context?.variables}
                label={messages.link}
                placeholder={messages.linkPlaceholder}
                disabled={reason !== null}
                invalid={problems.length > 0}
                describedBy={problems.length > 0 ? problemId : undefined}
                autoFocus={reason === null}
                messages={messages}
                className="cn-input flex items-center data-disabled:opacity-50"
              />
              {reason !== null && <FieldDescription>{reason}</FieldDescription>}
              {problems.length > 0 && <FieldError id={problemId} errors={problems.map((message) => ({ message }))} />}
            </Field>
            {urls.length > 0 && (
              <div role="group" aria-labelledby={variablesId} className="flex flex-col gap-1">
                <span id={variablesId} className="text-muted-foreground text-xs">
                  {messages.linkVariables}
                </span>
                <div className="flex flex-wrap gap-1">
                  {urls.map((declaration) => (
                    <Button
                      key={declaration.name}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={reason !== null}
                      onClick={() => apply(`{{${declaration.name}}}`)}
                    >
                      {variableIcon(declaration.type)}
                      {variableLabel(declaration)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              {target.kind === 'text' && target.href !== '' && (
                <Button type="button" variant="ghost" size="sm" onClick={remove}>
                  {messages.removeLink}
                </Button>
              )}
              <Button type="button" size="sm" disabled={trimmed === '' || reason !== null} onClick={() => apply(href)}>
                {messages.applyLink}
              </Button>
            </div>
          </>
        )}
      </RectPopover>
    </Popover>
  );
}
