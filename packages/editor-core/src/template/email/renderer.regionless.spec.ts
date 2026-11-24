// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { EmailBlock } from './block.js';
import { FIXTURE_LAYOUT_PROPS, FIXTURE_THEME } from './fixtures.fixture.js';
import { createEmailRenderer } from './renderer.js';

const blocks: EmailBlock[] = [
  { id: 'b1', type: 'paragraph', attributes: {}, content: { text: 'Hi {{name}},' } },
  { id: 'b2', type: 'paragraph', attributes: { tone: 'muted' }, content: { text: 'Ignore this if it was not you.' } },
  { id: 'b3', type: 'list', attributes: {}, content: { items: ['One', 'Two'] } },
  { id: 'b4', type: 'callout', attributes: {}, content: { text: 'Road closed.' } },
  { id: 'b5', type: 'button', attributes: {}, content: { label: 'Verify', href: '{{verify_url}}' } },
];

describe('a render with no regions', () => {
  it('draws each element with the base sheet inlined, and the same text', () => {
    const { html, text } = createEmailRenderer({ theme: FIXTURE_THEME }).render({
      blocks,
      subject: 'Verify your email',
      preheader: 'Works for 30 minutes',
      locale: 'en',
      variables: { name: 'Mai', verify_url: 'https://x.test/v' },
      variableTypes: { name: 'string', verify_url: 'url' },
      layoutProps: FIXTURE_LAYOUT_PROPS,
    });
    expect(html).toMatchInlineSnapshot(
      `"<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Verify your email</title><style>@media only screen and (max-width:600px){.zx-outer{padding:0 !important;}.zx-card{border:0 !important;border-radius:0 !important;}.zx-inner{padding:24px 20px !important;}.zx-text{font-size:16px !important;line-height:24px !important;}.zx-region-footer .zx-text{font-size:12px !important;line-height:17px !important;}.zx-footer-line{font-size:12px !important;line-height:17px !important;}.zx-button{display:block !important;text-align:center !important;font-size:16px !important;line-height:22px !important;padding:12px 16px !important;}.zx-lane{display:block !important;width:100% !important;padding:0 !important;}}</style></head><body class="zx-body" style="margin:0;padding:0;background:#FFFFFF;"><div class="zx-preheader" style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Works for 30 minutes</div><table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="zx-canvas" style="background:#FFFFFF;"><tr><td align="center" class="zx-outer" style="padding:24px 12px;"><!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0"><tr><td><![endif]--><table role="presentation" cellpadding="0" cellspacing="0" class="zx-card" style="width:100%;max-width:600px;background:#FFFFFF;border:1px solid #E4E4E7;border-radius:10px;"><tr><td class="zx-inner" style="padding:16px;"><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td class="zx-logo" style="padding:0 0 10px;"><img src="https://cdn.x.test/logo@2x.png" alt="Example" width="120" class="zx-image" style="display:block;border:0;height:auto;" /></td></tr><tr><td><table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="zx-region zx-region-body"><tr><td class="zx-block zx-block-paragraph zx-align-left zx-space-medium" style="text-align:left;padding:0 0 10px;"><div class="zx-text zx-tone-default" style="font-family:Inter, Arial, Helvetica, sans-serif;font-size:14px;line-height:20px;color:#09090B;">Hi Mai,</div></td></tr><tr><td class="zx-block zx-block-paragraph zx-align-left zx-space-medium" style="text-align:left;padding:0 0 10px;"><div class="zx-text zx-tone-muted" style="font-family:Inter, Arial, Helvetica, sans-serif;font-size:14px;line-height:20px;color:#63636D;">Ignore this if it was not you.</div></td></tr><tr><td class="zx-block zx-block-list zx-align-left zx-space-medium" style="text-align:left;padding:0 0 10px;"><ul class="zx-text zx-list" style="font-family:Inter, Arial, Helvetica, sans-serif;font-size:14px;line-height:20px;color:#09090B;margin:0;padding-left:20px;"><li>One</li><li>Two</li></ul></td></tr><tr><td class="zx-block zx-block-callout zx-align-left zx-space-medium" style="text-align:left;padding:0 0 10px;"><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td class="zx-callout" style="background:#F4F4F5;border:1px solid #E4E4E7;border-radius:10px;padding:12px 16px;"><div class="zx-text" style="font-family:Inter, Arial, Helvetica, sans-serif;font-size:14px;line-height:20px;color:#09090B;">Road closed.</div></td></tr></table></td></tr><tr><td class="zx-block zx-block-button zx-align-left zx-space-medium" style="text-align:left;padding:0 0 10px;"><a href="https://x.test/v" class="zx-button zx-width-inline" style="display:inline-block;background:#007A55;color:#ECFDF5;font-family:Inter, Arial, Helvetica, sans-serif;font-size:14px;font-weight:500;line-height:18px;padding:7px 10px;border-radius:10px;text-decoration:none;">Verify</a></td></tr></table></td></tr><tr><td class="zx-footer" style="padding:10px 0 0;border-top:1px solid #E4E4E7;"><div class="zx-text zx-footer-line" style="font-family:Inter, Arial, Helvetica, sans-serif;margin:0 0 4px;font-size:12px;line-height:17px;color:#63636D;">Example Company Limited, 1 Example Street.</div><div class="zx-text zx-footer-line" style="font-family:Inter, Arial, Helvetica, sans-serif;margin:0 0 4px;font-size:12px;line-height:17px;color:#63636D;">Sent because you created an account.</div></td></tr></table></td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>"`,
    );
    expect(text).toMatchInlineSnapshot(`
      "Hi Mai,

      Ignore this if it was not you.

      - One
      - Two

      Road closed.

      Verify: https://x.test/v

      Example Company Limited, 1 Example Street.
      Sent because you created an account."
    `);
  });
});
