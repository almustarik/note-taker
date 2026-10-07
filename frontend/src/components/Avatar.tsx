const tones = ['#dce6f7', '#e3efe0', '#f3e6da', '#ebe3f4', '#f8edc4', '#dcefee'];

interface Props {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Avatar({ name, size = 'md' }: Props) {
  const safeName = typeof name === 'string' ? name : '';
  const hash = [...safeName].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const initials = (
    safeName
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('') || '?'
  ).toUpperCase();

  return (
    <span className={`avatar ${size}`} style={{ background: tones[hash % tones.length] }} aria-hidden>
      {initials}
    </span>
  );
}
