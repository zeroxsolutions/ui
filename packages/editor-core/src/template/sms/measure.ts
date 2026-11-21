/**
 * What one SMS segment holds in each encoding a carrier reads: 160 GSM-7 units, or 70 UTF-16 units once
 * any character leaves ASCII.
 */
export const SMS_SEGMENT_UNITS = { gsm7: 160, ucs2: 70 } as const;

/** One of the two encodings, keyed as {@link SMS_SEGMENT_UNITS} keys them. */
export type SmsEncoding = keyof typeof SMS_SEGMENT_UNITS;

/** The GSM-7 characters that live in its extension table, each sent as an escape plus itself: two units. */
const GSM7_EXTENSION_CHARACTERS: ReadonlySet<string> = new Set(['^', '{', '}', '\\', '[', ']', '~', '|']);

/** The highest code unit ASCII holds. */
const ASCII_MAX = 0x7f;

/** What a text costs: the encoding it goes out in, and how many of that encoding's units it spends. */
export interface SmsMeasure {
  encoding: SmsEncoding;
  units: number;
}

/** Whether every code unit of `text` is ASCII, the test a carrier's unicode flag is decided by. */
function isAscii(text: string): boolean {
  for (let index = 0; index < text.length; index += 1) {
    if (text.charCodeAt(index) > ASCII_MAX) return false;
  }
  return true;
}

/**
 * Measures `text` as a carrier counts it. All-ASCII text is GSM-7, one unit a character and two for an
 * extension character; anything else is UCS-2, one unit per UTF-16 code unit.
 */
export function measureSms(text: string): SmsMeasure {
  if (!isAscii(text)) return { encoding: 'ucs2', units: text.length };
  let units = 0;
  for (const character of text) units += GSM7_EXTENSION_CHARACTERS.has(character) ? 2 : 1;
  return { encoding: 'gsm7', units };
}

/** Whether a text of `measure` goes out as one segment, the only length a registered pattern takes. */
export function fitsOneSmsSegment(measure: SmsMeasure): boolean {
  return measure.units <= SMS_SEGMENT_UNITS[measure.encoding];
}
