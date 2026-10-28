import type { SendAsset } from '../../data/send'

export default function AssetBadge({
  asset,
  size = 'md',
}: {
  asset: SendAsset
  size?: 'md' | 'sm'
}) {
  const dim = size === 'md' ? 'w-11 h-11 text-xl' : 'w-9 h-9 text-base'
  return (
    <div
      className={`${dim} rounded-full text-white font-bold flex items-center justify-center shadow-sm shrink-0 ${asset.badgeClass} ${asset.glyphClass ?? ''}`}
    >
      {asset.glyph}
    </div>
  )
}
