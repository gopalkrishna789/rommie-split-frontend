/**
 * Reusable member avatar — shows profile photo if available, otherwise initials
 */
export default function MemberAvatar({ member, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  if (member?.photo_base64) {
    return (
      <img
        src={member.photo_base64}
        alt={member?.name || 'Member'}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0 ${className}`}
        title={member?.name}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${className}`}
      style={{ backgroundColor: member?.color || '#6366f1' }}
      title={member?.name}
      aria-label={member?.name}
    >
      {member?.avatar_initials || member?.avatarInitials || '?'}
    </div>
  );
}
