export default (name = '') =>
  name
    .replace(/\s+/, ' ')
    .split(' ')
    .slice(0, 2)
    .map(value => value && value[0].toUpperCase())
    .join('');
