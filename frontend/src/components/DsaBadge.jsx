/**
 * DsaBadge — Shows a DSA algorithm name with animated highlight.
 * Used throughout the app to label which DSA is powering a feature.
 */
export default function DsaBadge({ name, description, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-500/15 text-blue-300 border-blue-500/30',
    purple: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    green:  'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    yellow: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    red:    'bg-red-500/15 text-red-300 border-red-500/30',
    cyan:   'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    pink:   'bg-pink-500/15 text-pink-300 border-pink-500/30',
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium
                     ${colors[color] || colors.blue}`}
         title={description}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-slow" />
      {name}
    </div>
  )
}
