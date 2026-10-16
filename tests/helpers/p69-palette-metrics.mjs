// Independent sRGB / D65 calculations for P69 evidence (not runtime colour selection).
const linear = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
export const luminance = hex => linear(hex).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
export const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
const lab = hex => {
  const [r, g, b] = linear(hex);
  const f = t => t > (6 / 29) ** 3 ? Math.cbrt(t) : t / (3 * (6 / 29) ** 2) + 4 / 29;
  const x = f((.4124564 * r + .3575761 * g + .1804375 * b) / .95047);
  const y = f(.2126729 * r + .7151522 * g + .072175 * b);
  const z = f((.0193339 * r + .119192 * g + .9503041 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
};
export const deltaE76 = (a, b) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));
export const expectedSeries = {
  light: ['#1E88E5', '#D6337F', '#3A9A2A', '#C27A00', '#7E5BD6', '#6B7280'],
  paper: ['#1E88E5', '#D6337F', '#3A9A2A', '#C27A00', '#7E5BD6', '#6B7280'],
  dark: ['#62ACED', '#E270A5', '#75B86A', '#D4A24D', '#A58CE2', '#979CA6'],
};
