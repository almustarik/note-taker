const AVATAR_BACKGROUND_PALETTE = ['#dce6f7', '#e3efe0', '#f3e6da', '#ebe3f4', '#f8edc4', '#dcefee'];

interface AvatarComponentProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Avatar({ name, size = 'md' }: AvatarComponentProps) {
  const sanitizedUserName = typeof name === 'string' ? name.trim() : '';
  const nameCharacterCodeSum = [...sanitizedUserName].reduce(
    (accumulatedTotal, character) => accumulatedTotal + character.charCodeAt(0),
    0,
  );

  const initialsDisplayText = (
    sanitizedUserName
      .split(/\s+/)
      .map((nameSegment) => nameSegment[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('') || '?'
  ).toUpperCase();

  const assignedBackgroundColor = AVATAR_BACKGROUND_PALETTE[nameCharacterCodeSum % AVATAR_BACKGROUND_PALETTE.length];

  return (
    <span className={`avatar ${size}`} style={{ background: assignedBackgroundColor }} aria-hidden>
      {initialsDisplayText}
    </span>
  );
}
