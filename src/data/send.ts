import { contacts } from './mock'
import type { Contact } from './mock'

export interface SendAsset {
  id: string
  name: string
  symbol: string
  /** Short network name shown as a chip (distinguishes same token on two chains) */
  network: string
  /** Full network label shown in the details card */
  networkLabel: string
  /** USD price per unit */
  price: number
  /** Units available to send */
  avail: number
  /** Flat network fee in USD (illustrative) */
  fee: number
  /** Estimated settlement time */
  arrival: string
  /** Badge glyph + styling */
  glyph: string
  badgeClass: string
  glyphClass?: string
}

/** Selectable assets: ETH, BTC, TRX, USDC/USDT on Ethereum and Stellar, XLM. */
export const assets: SendAsset[] = [
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    network: 'Ethereum',
    networkLabel: 'Red Ethereum (ERC-20)',
    price: 3326.72,
    avail: 1.482,
    fee: 2.4,
    arrival: '~ 2-3 min',
    glyph: 'Ξ',
    badgeClass: 'bg-[#627EEA]',
  },
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    network: 'Bitcoin',
    networkLabel: 'Red Bitcoin',
    price: 62150,
    avail: 0.0612,
    fee: 1.8,
    arrival: '~ 10-30 min',
    glyph: '₿',
    badgeClass: 'bg-[#F7931A]',
  },
  {
    id: 'trx',
    name: 'Tron',
    symbol: 'TRX',
    network: 'Tron',
    networkLabel: 'Tron (TRC-20)',
    price: 0.1285,
    avail: 8500,
    fee: 0.9,
    arrival: '~ 1 min',
    glyph: 'T',
    badgeClass: 'bg-[#EB0029]',
  },
  {
    id: 'usdc-eth',
    name: 'USD Coin',
    symbol: 'USDC',
    network: 'Ethereum',
    networkLabel: 'Ethereum (ERC-20)',
    price: 1,
    avail: 2480.5,
    fee: 2.8,
    arrival: '~ 2-3 min',
    glyph: '$',
    badgeClass: 'bg-[#2775CA]',
  },
  {
    id: 'usdt-eth',
    name: 'Tether',
    symbol: 'USDT',
    network: 'Ethereum',
    networkLabel: 'Ethereum (ERC-20)',
    price: 1,
    avail: 1760,
    fee: 2.8,
    arrival: '~ 2-3 min',
    glyph: '₮',
    badgeClass: 'bg-[#26A17B]',
  },
  {
    id: 'usdc-xlm',
    name: 'USD Coin',
    symbol: 'USDC',
    network: 'Stellar',
    networkLabel: 'Red Stellar',
    price: 1,
    avail: 940,
    fee: 0.01,
    arrival: '~ 5 s',
    glyph: '$',
    badgeClass: 'bg-[#2775CA]',
  },
  {
    id: 'usdt-xlm',
    name: 'Tether',
    symbol: 'USDT',
    network: 'Stellar',
    networkLabel: 'Red Stellar',
    price: 1,
    avail: 612.4,
    fee: 0.01,
    arrival: '~ 5 s',
    glyph: '₮',
    badgeClass: 'bg-[#26A17B]',
  },
  {
    id: 'xlm',
    name: 'Stellar Lumens',
    symbol: 'XLM',
    network: 'Stellar',
    networkLabel: 'Red Stellar',
    price: 0.1123,
    avail: 15300,
    fee: 0.01,
    arrival: '~ 5 s',
    glyph: '✦',
    badgeClass: 'bg-neutral-900',
  },
]

/** USD value of the available balance for an asset. */
export const availUsd = (asset: SendAsset): number => asset.avail * asset.price

/** Your receiving address per network (shared by all tokens on that chain). */
const RECEIVE_ADDRESSES: Record<string, string> = {
  Ethereum: '0x8A3f2b9C1d4E5f6a7B8c9D0e1F2a3B4c5D6e7F80',
  Bitcoin: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
  Tron: 'TQn9Y2khDD95J42FQtQTdwVVRkqjrQ8Z7M',
  Stellar: 'GQ3ZVQ7K5F2W6X9YJ4H8N1M0P2R3S4T5U6V7W8X9Y0Z1A2B',
}

export const receiveAddress = (asset: SendAsset): string => RECEIVE_ADDRESSES[asset.network]

/** Format a token balance with sensible precision. */
export const formatUnits = (value: number): string =>
  value.toLocaleString('en-US', { maximumFractionDigits: 4 })

/* ---- Quick Send recipients (unchanged) ---- */

export interface Recipient extends Contact {
  address: string
}

const ADDRESSES: Record<string, string> = {
  rahman: '0x71C7656EC7ab88b098defB751B7401B5f6da47b',
  farid: '0x3A1b57Cd99f2B4e6De8C1a07F2E9b4C3d5a6F7e8',
  murad: '0x9F4e2D1c8B7a6E5f0D3c2B1a4F5e6D7c8B9a0E1f',
  vaipo: '0x5C6d7E8f9A0b1C2d3E4f5A6b7C8d9E0f1A2b3C4d',
}

export const recipients: Recipient[] = contacts
  .filter((c) => c.id in ADDRESSES)
  .map((c) => ({ ...c, address: ADDRESSES[c.id] }))

export const truncateAddress = (address: string): string =>
  `${address.slice(0, 5)}…${address.slice(-4)}`
