type Params = { value: unknown };

export const toLower = ({ value }: Params) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

export const toInterests = ({ value }: Params) =>
  Array.isArray(value) ? [...new Set(value.map((v) => (typeof v === 'string' ? v.trim().toLowerCase() : v)))] : value;
