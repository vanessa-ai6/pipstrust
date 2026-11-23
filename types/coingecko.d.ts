
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'coingecko-coin-price-marquee-widget':
        DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
          'coin-ids'?: string
          currency?: string
          'background-color'?: string
          locale?: string
          'font-color'?: string
        }
    }
  }
}
