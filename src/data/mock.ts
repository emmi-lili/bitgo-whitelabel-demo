export interface Contact {
  id: string
  name: string
  avatar: string
  /** Extra Tailwind filter classes applied to the avatar <img> */
  filter?: string
}

export interface Transaction {
  id: string
  title: string
  date: string
  amount: number
  direction: 'in' | 'out'
}

export const walletName = 'Main Wallet'

export const balance = 1630.21

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

export const contacts: Contact[] = [
  {
    id: 'rahman',
    name: 'RahMan',
    filter: 'grayscale contrast-125',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAXeSmaPi6XaJt-T4ZHbNTadAG6DpyRRXOrQX9wE-W4743nyTFQY0yhBmKuqM6Tv553S5tI620eKcoz2tnHuo_kMCgf58p0BiAraH9uot7QQ-TGehLED_hEl3e-pbzKoA0HZsZyBN8Qug8N3wqBJbD2Xlqig3ZosO7tEMHwaAH358TCfkYABijhUqjH-qlWNECnCmbitzDuHd1UuE0gslEPl6btB-_1aSF1JYhzabGctg2NptoA7sU',
  },
  {
    id: 'farid',
    name: 'Farid',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBA_ewKEaCXozYstTfRrxROAIW3aKgQNbU_EHCat8BazOg3Tf42Vyk1BCdrPYGhtKckZ9Sxb3B0yMleXfQ3-StxZn1XSFSTZA3Pt78d97SwD_ae1ABfyNyHAixy_7k2pRRSe0ewS43SiVbvG1Ce5JEaxYUv7sNPytTG0pYQ8LH_c76-9ezCFW_vTxW--SxVTx5hz2FSBEHrltmU_aFL-C0uuIlEQJw1KUgF1RbCaCDQY3ShmZxD3Mo',
  },
  {
    id: 'murad',
    name: 'Murad',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA3tRdDsxZeWpQ9xIKixBH9LlAqg9w95AHEbfZabLkYmZ-QexOKdpfp26HuT-gAOhd4_tJzMJW7k1VfWJus9A-lq0oWJmYeBqUAKpvHDOjyvQDmPEhMTsh1rbNJMoGHmNfDB26rCL3kwtYQO97Pom3eKno0tukg-DzoffUHWyh-IKUvIGVQWAdK9W3zr6L6IIVpZD4NVJ63q0DNuzFXysfCLOweQdc3w4ghP-DbvypGtxD6Ty_CPH8',
  },
  {
    id: 'jogo',
    name: 'Jogo',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB7Mi4dd2YznZLnGAihE6u0gGo3mIV7dTkp27QEGZ2sawa2ARmhG51RFQimEqmsBHbYwL_F2q0Tu1UgOj0ux-NU1FwHSYP7bZRDLk_XV-OvszTloBert0RHpoEQLme-cET9iXZNTK6RGnalahu2d1sgmPxTPFr2CI-VLyZsd77P1avaWH8eIKD6IYY4G3kUEmQMao4fj4HIi7NWp5Y5XDq152gkx3nqcxLPKALIeYE-zez2Hdpg8Xo',
  },
  {
    id: 'vaipo',
    name: 'Vaipo',
    filter: 'grayscale',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAbG1FHwLYl8yZAQirkU5uiIvyMlTfivWBbjW3hjI1pwBbrCopAiBaNkxGmDGdzsZtjjEcQV-4GiPJ7z_cxj6Y98ZwZ2rFlYpfD9sA2mAwPy1U_XVZlZqvUfNucKAL9ht_oF3b3yuryEAy9uCP0dRfwyibcxXX7lEy38MWofTadB8R9cxkxHpkBgefUnDUZ83KlZB-v4AEnjVcTY7j6GJKF4xW0oRma20hstiW63QoV46WL-my8bmU',
  },
]

export const transactions: Transaction[] = [
  { id: 'tx1', title: 'Salary', date: 'May 25, 09:00', amount: 3200.0, direction: 'in' },
  { id: 'tx2', title: 'Apple products', date: 'May 24, 14:32', amount: 999.0, direction: 'out' },
  { id: 'tx3', title: 'Spotify', date: 'May 23, 08:12', amount: 9.99, direction: 'out' },
  { id: 'tx4', title: 'Coffee', date: 'May 22, 10:45', amount: 4.5, direction: 'out' },
]
