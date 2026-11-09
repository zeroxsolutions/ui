import { styleClassScript } from './style-class';

function runAt(search: string, remembered: string | null): string {
  window.history.replaceState(null, '', `/docs${search}`);
  localStorage.clear();
  if (remembered !== null) localStorage.setItem('zui:style:web', remembered);
  document.documentElement.className = 'dark style-nova';
  new Function(styleClassScript('web'))();
  return document.documentElement.className;
}

describe('styleClassScript', () => {
  it("puts the URL's style on <html> over the remembered one, keeping the other classes", () => {
    expect(runAt('?style=vega', 'lyra')).toBe('dark style-vega');
  });

  it('falls back to the remembered style, then to the default', () => {
    expect(runAt('', 'lyra')).toBe('dark style-lyra');
    expect(runAt('', null)).toBe('dark style-nova');
  });

  it('passes over a style the platform does not publish, a different case included', () => {
    expect(runAt('?style=Vega', 'nope')).toBe('dark style-nova');
  });
});
