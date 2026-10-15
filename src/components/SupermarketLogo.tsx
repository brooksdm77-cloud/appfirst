import React from 'react'

export type SupermarketId = 'Woolworths' | 'PAKnSAVE' | 'NewWorld'

interface SupermarketLogoProps {
  store: SupermarketId | string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showTagline?: boolean
  className?: string
}

export const SupermarketLogo: React.FC<SupermarketLogoProps> = ({
  store,
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  const heightClasses = {
    xs: 'h-4',
    sm: 'h-5',
    md: 'h-6',
    lg: 'h-8',
  }

  const containerPadding = {
    xs: 'px-1.5 py-0.5',
    sm: 'px-2 py-1',
    md: 'px-2.5 py-1',
    lg: 'px-3.5 py-1.5',
  }

  if (store === 'Woolworths') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className={`bg-white rounded-md border border-gray-200/80 shadow-sm flex items-center justify-center ${containerPadding[size]}`}>
          <img
            src="/logos/woolworths.svg"
            alt="Woolworths"
            className={`${heightClasses[size]} w-auto object-contain select-none`}
            loading="eager"
          />
        </div>
        {showTagline && <span className="text-xs text-emerald-800 font-medium italic">The Fresh Food People</span>}
      </div>
    )
  }

  if (store === 'PAKnSAVE') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className={`bg-white rounded-md border border-gray-200/80 shadow-sm flex items-center justify-center ${containerPadding[size]}`}>
          <img
            src="/logos/paknsave.svg"
            alt="PAK'nSAVE"
            className={`${heightClasses[size]} w-auto object-contain select-none`}
            loading="eager"
          />
        </div>
        {showTagline && <span className="text-xs text-yellow-900 font-medium italic">NZ's Lowest Food Prices</span>}
      </div>
    )
  }

  if (store === 'NewWorld') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className={`bg-white rounded-md border border-gray-200/80 shadow-sm flex items-center justify-center ${containerPadding[size]}`}>
          <img
            src="/logos/newworld.svg"
            alt="New World"
            className={`${heightClasses[size]} w-auto object-contain select-none`}
            loading="eager"
          />
        </div>
        {showTagline && <span className="text-xs text-red-800 font-medium italic">Always someone to say hello</span>}
      </div>
    )
  }

  return <span className={`font-semibold ${className}`}>{store}</span>
}
