export interface LogoEntry {
  file: string
  label: string
  group: string
}

export const LOGO_LIBRARY: LogoEntry[] = [
  { file: 'visa-white.png', label: 'Visa (white)', group: 'Visa' },
  { file: 'visa-gold.png', label: 'Visa (gold)', group: 'Visa' },
  { file: 'visa-blue.png', label: 'Visa (blue)', group: 'Visa' },
  { file: 'visa-black.png', label: 'Visa (black)', group: 'Visa' },
  { file: 'visa-classic.png', label: 'Visa classic', group: 'Visa' },
  { file: 'visa-classic-white.png', label: 'Visa classic (white)', group: 'Visa' },
  { file: 'visa-debit.png', label: 'Visa Debit', group: 'Visa' },
  { file: 'visa-infinite-privilege.png', label: 'Visa Infinite Privilege (gold)', group: 'Visa' },
  { file: 'visa-brandmark.png', label: 'Visa symbol', group: 'Visa' },
  { file: 'visa-brandmark-white.png', label: 'Visa symbol (white)', group: 'Visa' },
  { file: 'mastercard.png', label: 'Mastercard', group: 'Mastercard' },
  { file: 'mastercard-white.png', label: 'Mastercard (white)', group: 'Mastercard' },
  { file: 'mastercard-black.png', label: 'Mastercard (black)', group: 'Mastercard' },
  { file: 'amex-blue.png', label: 'Amex', group: 'American Express' },
  { file: 'amex-white.png', label: 'Amex (white)', group: 'American Express' },
  { file: 'amex-black.png', label: 'Amex (black)', group: 'American Express' },
  { file: 'discover-dark.png', label: 'Discover', group: 'Discover' },
  { file: 'discover-white.png', label: 'Discover (white)', group: 'Discover' },
  { file: 'unionpay.png', label: 'UnionPay', group: 'UnionPay' },
  { file: 'jcb-white.png', label: 'JCB (white)', group: 'JCB' },
  { file: 'jcb-black.png', label: 'JCB (black)', group: 'JCB' },
  { file: 'dinersclub-white.png', label: 'Diners Club (white)', group: 'Diners Club' },
  { file: 'dinersclub-black.png', label: 'Diners Club (black)', group: 'Diners Club' },
]

export function logoUrl(file: string): string {
  return `${import.meta.env.BASE_URL}logos/${file}`
}

export function logoGroups(): { group: string; entries: LogoEntry[] }[] {
  const groups: { group: string; entries: LogoEntry[] }[] = []
  for (const entry of LOGO_LIBRARY) {
    let g = groups.find((x) => x.group === entry.group)
    if (!g) {
      g = { group: entry.group, entries: [] }
      groups.push(g)
    }
    g.entries.push(entry)
  }
  return groups
}
