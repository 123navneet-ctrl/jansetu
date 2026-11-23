import {
  GraduationCap,
  HeartPulse,
  Home,
  IndianRupee,
  Sprout,
  Flame,
  Briefcase,
  Users,
  HeartHandshake,
  FileText,
  Sparkles,
} from 'lucide-react';

const CATEGORY_MAP = {
  education: {
    icon: GraduationCap,
    tint: 'tint-violet',
    color: '#5B4BE8',
    bg: 'rgba(91, 75, 232, 0.1)',
  },
  scholarship: {
    icon: GraduationCap,
    tint: 'tint-violet',
    color: '#5B4BE8',
    bg: 'rgba(91, 75, 232, 0.1)',
  },
  healthcare: {
    icon: HeartPulse,
    tint: 'tint-rose',
    color: '#E11D48',
    bg: 'rgba(225, 29, 72, 0.1)',
  },
  health: {
    icon: HeartPulse,
    tint: 'tint-rose',
    color: '#E11D48',
    bg: 'rgba(225, 29, 72, 0.1)',
  },
  housing: {
    icon: Home,
    tint: 'tint-amber',
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.1)',
  },
  'financial aid': {
    icon: IndianRupee,
    tint: 'tint-emerald',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.1)',
  },
  agriculture: {
    icon: Sprout,
    tint: 'tint-green',
    color: '#16A34A',
    bg: 'rgba(22, 163, 74, 0.1)',
  },
  farming: {
    icon: Sprout,
    tint: 'tint-green',
    color: '#16A34A',
    bg: 'rgba(22, 163, 74, 0.1)',
  },
  'essential services': {
    icon: Flame,
    tint: 'tint-amber',
    color: '#EA580C',
    bg: 'rgba(234, 88, 12, 0.1)',
  },
  employment: {
    icon: Briefcase,
    tint: 'tint-indigo',
    color: '#4F46E5',
    bg: 'rgba(79, 70, 229, 0.1)',
  },
  jobs: {
    icon: Briefcase,
    tint: 'tint-indigo',
    color: '#4F46E5',
    bg: 'rgba(79, 70, 229, 0.1)',
  },
  'women & child': {
    icon: Users,
    tint: 'tint-pink',
    color: '#DB2777',
    bg: 'rgba(219, 39, 119, 0.1)',
  },
  maternity: {
    icon: Users,
    tint: 'tint-pink',
    color: '#DB2777',
    bg: 'rgba(219, 39, 119, 0.1)',
  },
  'senior citizens': {
    icon: HeartHandshake,
    tint: 'tint-orange',
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.1)',
  },
  pension: {
    icon: HeartHandshake,
    tint: 'tint-orange',
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.1)',
  },
};

export default function CategoryIcon({
  category = '',
  size = 20,
  strokeWidth = 1.75,
  boxed = false,
  className = '',
}) {
  const normalized = (category || '').toLowerCase().trim();
  const matched =
    CATEGORY_MAP[normalized] ||
    Object.entries(CATEGORY_MAP).find(([key]) => normalized.includes(key))?.[1] || {
      icon: FileText,
      tint: 'tint-slate',
      color: '#5B4BE8',
      bg: 'rgba(91, 75, 232, 0.1)',
    };

  const IconComp = matched.icon;

  if (boxed) {
    return (
      <div
        className={`category-icon-box ${matched.tint} ${className}`}
        style={{
          width: size * 2,
          height: size * 2,
          minWidth: size * 2,
          borderRadius: 14,
          display: 'grid',
          placeItems: 'center',
          backgroundColor: matched.bg,
          color: matched.color,
          transition: 'all 0.2s ease',
        }}
        aria-hidden="true"
      >
        <IconComp size={size} strokeWidth={strokeWidth} />
      </div>
    );
  }

  return (
    <span
      className={`category-icon-inline ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', color: matched.color }}
      aria-hidden="true"
    >
      <IconComp size={size} strokeWidth={strokeWidth} />
    </span>
  );
}
