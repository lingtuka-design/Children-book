import { svgDataUrl } from './images'

/**
 * Procedurally generated sample artwork for the initial sample books.
 * Every cover/page is generated as an inline SVG data URL so the site is
 * visually complete on first launch without shipping binary assets.
 */

interface Palette {
  skyTop: string
  skyBottom: string
  ground: string
  ground2: string
  accent: string
  accent2: string
  charMain: string
  charSecond: string
  charFace: string
}

type Character = 'dino' | 'rabbit' | 'puppy' | 'bear' | 'fairy' | 'rocket' | 'boat' | 'train' | 'kite'

export interface SampleBookSpec {
  title: string
  slug: string
  description: string
  category: string
  author: string
  featured: boolean
  published: boolean
  ageDays: number
  character: Character
  palette: Palette
  storyLines: string[]
}

const palettes: Record<string, Palette> = {
  jungle: { skyTop: '#a8e6cf', skyBottom: '#f7f9c9', ground: '#8fd3a4', ground2: '#5fad7a', accent: '#f4a261', accent2: '#e76f51', charMain: '#6a9c5f', charSecond: '#4f7d46', charFace: '#fdf0d5' },
  night: { skyTop: '#2b3a67', skyBottom: '#7d6b9e', ground: '#4a3b5f', ground2: '#2f2540', accent: '#ffd166', accent2: '#ef476f', charMain: '#9d8fc1', charSecond: '#6f5f9e', charFace: '#f7f0ff' },
  ocean: { skyTop: '#bfe8f5', skyBottom: '#eaf7fb', ground: '#7fc8e8', ground2: '#3f9ec6', accent: '#f9c74f', accent2: '#f28482', charMain: '#d9534f', charSecond: '#b03a35', charFace: '#fdf0d5' },
  garden: { skyTop: '#ffe8b7', skyBottom: '#fff8e8', ground: '#a7d477', ground2: '#7cb455', accent: '#ff8fab', accent2: '#a2d2ff', charMain: '#e07a5f', charSecond: '#b85c44', charFace: '#fdf6e3' },
  meadow: { skyTop: '#bfe3ff', skyBottom: '#e6f4ff', ground: '#93c47d', ground2: '#6aa84f', accent: '#f6b26b', accent2: '#e06666', charMain: '#8f7cbd', charSecond: '#6c5a9e', charFace: '#fdf6e3' },
  sunset: { skyTop: '#ffc2a1', skyBottom: '#ffead2', ground: '#c98a5e', ground2: '#a5653d', accent: '#ffd166', accent2: '#ef476f', charMain: '#5d8aa8', charSecond: '#3f6a85', charFace: '#fdf0d5' },
}

export const SAMPLE_BOOKS: SampleBookSpec[] = [
  {
    title: 'Vena and Her Friend T-Rex',
    slug: 'vena-and-her-friend-t-rex',
    description: 'A little girl and a gentle T-Rex explore the jungle together — and discover that true friends come in every size.',
    category: 'Adventure',
    author: 'Wonder Pages Studio',
    featured: true,
    published: true,
    ageDays: 4,
    character: 'dino',
    palette: palettes.jungle,
    storyLines: [
      'Deep in the green jungle, Vena heard a rustling sound.',
      'A gentle T-Rex peeked through the leaves with a curious eye.',
      '“Don’t be scared,” she whispered, “I’m Vena!”',
      'The T-Rex smiled the biggest smile in the whole jungle.',
      'Together they marched over hills and under giant ferns.',
      'They shared mangoes, bananas, and one very big nap.',
      '“My teeth are sharp,” he said, “but my heart is soft.”',
      'And so Vena and her T-Rex stayed friends, forever and ever.',
    ],
  },
  {
    title: 'Luna and the Little Rocket',
    slug: 'luna-and-the-little-rocket',
    description: 'Luna builds a tiny rocket and flies past the moon, learning that even small dreams can take you very far.',
    category: 'Space',
    author: 'Wonder Pages Studio',
    featured: true,
    published: true,
    ageDays: 6,
    character: 'rocket',
    palette: palettes.night,
    storyLines: [
      'Luna looked up at the sky and wished on a star.',
      'She hammered and painted a little red rocket.',
      '“Three, two, one… blast off!” she cheered.',
      'Zoom! Past clouds and kites, the rocket flew.',
      'The moon waved back with a sleepy, silver grin.',
      'Luna counted the stars — one, two, a hundred!',
      '“Even a little rocket can reach the sky,” she laughed.',
      'She drifted home on a blanket of twinkling light.',
    ],
  },
  {
    title: 'Benny’s Big Backpack',
    slug: 'bennys-big-backpack',
    description: 'Benny packs one very important thing for every adventure — because kindness fits in the smallest pocket.',
    category: 'Everyday Magic',
    author: 'Wonder Pages Studio',
    featured: false,
    published: true,
    ageDays: 2,
    character: 'puppy',
    palette: palettes.meadow,
    storyLines: [
      'Benny the puppy had a backpack — oh, so big!',
      'He packed a ball, a bone, and a shiny red scarf.',
      'He packed a snack for every friend along the way.',
      'He packed his favourite song to hum on long walks.',
      'The backpack got heavier, but Benny got happier.',
      'He shared the scarf with a shivering little kitten.',
      'Kindness, he learned, weighs nothing at all.',
      'And Benny’s big backpack grew light as a feather.',
    ],
  },
  {
    title: 'The Cloud Who Lost a Raindrop',
    slug: 'the-cloud-who-lost-a-raindrop',
    description: 'A tiny cloud loses its last raindrop and goes on a soft, rainy adventure to find it again.',
    category: 'Bedtime',
    author: 'Wonder Pages Studio',
    featured: false,
    published: true,
    ageDays: 9,
    character: 'fairy',
    palette: palettes.ocean,
    storyLines: [
      'High above the hills, little Cloud counted its drops.',
      'One… two… three… oh no! One went missing!',
      '“Little raindrop, where did you fall?”',
      'Cloud puffed across the sky, soft and worried.',
      'It peeked under the moon and behind the mountain.',
      'Then it spotted the drop — sparkling on a leaf!',
      '“You silly drop,” Cloud giggled, “come on home!”',
      'And that night, it rained a happy little shower.',
    ],
  },
  {
    title: 'Milo and the Magic Paintbrush',
    slug: 'milo-and-the-magic-paintbrush',
    description: 'Milo’s paintbrush draws butterflies that flutter, stars that twinkle, and colours that sing.',
    category: 'Imagination',
    author: 'Wonder Pages Studio',
    featured: true,
    published: true,
    ageDays: 12,
    character: 'bear',
    palette: palettes.garden,
    storyLines: [
      'Milo found a paintbrush resting in the grass.',
      'He painted a butterfly — it fluttered away!',
      'He painted a balloon — it floated to the sky!',
      'He painted the sun — it winked and yawned.',
      'His colours danced across every single page.',
      'He painted a smile, and his friends smiled too.',
      '“Art,” said Milo, “is the best kind of magic.”',
      'He tucked the brush away for another sunny day.',
    ],
  },
  {
    title: 'Penny the Puffin',
    slug: 'penny-the-puffin',
    description: 'Penny is a tiny puffin with a very big voice and an even bigger heart for the sea.',
    category: 'Ocean',
    author: 'Wonder Pages Studio',
    featured: false,
    published: true,
    ageDays: 15,
    character: 'boat',
    palette: palettes.ocean,
    storyLines: [
      'Penny the puffin lived on a cliff above the sea.',
      'Her beak was orange, her voice was LOUD.',
      '“Hello, whales! Hello, waves! Hello, everyone!”',
      'She dived for fish and waddled with a wiggle.',
      'A storm came, and Penny called her friends home.',
      'The little boats followed her cheery squawk.',
      '“Loud can be lovely,” the waves seemed to say.',
      'Penny’s big voice kept the whole bay safe.',
    ],
  },
  {
    title: 'The Brave Little Boat',
    slug: 'the-brave-little-boat',
    description: 'A small wooden boat faces its first big waves and learns that brave hearts can ride any sea.',
    category: 'Adventure',
    author: 'Wonder Pages Studio',
    featured: false,
    published: true,
    ageDays: 18,
    character: 'boat',
    palette: palettes.ocean,
    storyLines: [
      'Little Boat wobbled at the edge of the harbour.',
      'The big waves growled, “Are you sure, little one?”',
      '“I am,” said Little Boat, and it dipped its bow.',
      'Up! Down! The waves played a bouncy game.',
      'A dolphin swam by and cheered, “You can do it!”',
      'Little Boat rode every wave like a friend.',
      '“The sea isn’t scary,” it said, “it’s adventure!”',
      'It sailed home to the harbour, prouder than ever.',
    ],
  },
  {
    title: 'Roro’s Rainbow Garden',
    slug: 'roros-rainbow-garden',
    description: 'Roro plants one seed for every colour and grows the brightest rainbow garden in town.',
    category: 'Nature',
    author: 'Wonder Pages Studio',
    featured: false,
    published: true,
    ageDays: 22,
    character: 'rabbit',
    palette: palettes.garden,
    storyLines: [
      'Roro the rabbit loved colours — all of them!',
      'She planted red seeds, then orange, then yellow.',
      'Green sprouted, blue peeked, purple giggled.',
      'Her garden grew a rainbow right out of the soil.',
      'Butterflies came for tea. Bees came for honey.',
      'Roro watered each petal with a happy hop.',
      '“Every colour belongs in this garden,” she smiled.',
      'And the rainbow bloomed for everyone to see.',
    ],
  },
  {
    title: 'Kai and the Star Kite',
    slug: 'kai-and-the-star-kite',
    description: 'Kai’s kite flies higher than the hilltops and brings back a twinkling souvenir from the stars.',
    category: 'Imagination',
    author: 'Wonder Pages Studio',
    featured: false,
    published: true,
    ageDays: 26,
    character: 'kite',
    palette: palettes.night,
    storyLines: [
      'Kai built a kite shaped like a golden star.',
      '“Fly high, little star!” he called to the wind.',
      'The kite tugged and danced on its long string.',
      'It looped past the moon and tickled the clouds.',
      'A stray star hopped onto the kite’s tail!',
      'Down, down, down it floated into Kai’s hands.',
      '“The sky wanted you to have this,” it whispered.',
      'Kai kept the star in his pocket, shining bright.',
    ],
  },
]

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

interface CharParams {
  x: number
  y: number
  scale: number
  flip: boolean
}

function charSvg(kind: Character, p: CharParams, pal: Palette): string {
  const { x, y, scale, flip } = p
  const fx = flip ? -1 : 1
  const main = pal.charMain
  const second = pal.charSecond
  const face = pal.charFace
  const c = `transform="translate(${x},${y}) scale(${fx * scale},${scale})"`

  switch (kind) {
    case 'dino':
      return `<g ${c} stroke-linecap="round" stroke-linejoin="round">
        <path d="M-120,60 L-160,10 L-140,30 L-95,-15 L-60,-60 L-30,-70 L60,-70 L110,-30 L140,10 L120,45 L90,60 Z" fill="${main}"/>
        <path d="M-60,-60 L-35,-95 L-10,-65 Z M25,-70 L55,-100 L80,-68 Z" fill="${second}"/>
        <path d="M-140,10 L-110,-5 L-95,-15" fill="${second}" opacity="0.6"/>
        <rect x="-70" y="-90" width="150" height="30" rx="15" fill="${face}"/>
        <circle cx="-30" cy="-78" r="5" fill="#2b2b2b"/>
        <circle cx="35" cy="-78" r="5" fill="#2b2b2b"/>
        <path d="M-5,-65 Q15,-50 35,-65" stroke="#2b2b2b" stroke-width="5" fill="none"/>
        <path d="M-60,-10 Q30,-30 90,-5" stroke="${second}" stroke-width="6" fill="none"/>
        <circle cx="100" cy="-20" r="5" fill="#2b2b2b"/>
      </g>`
    case 'rabbit':
      return `<g ${c} stroke-linecap="round" stroke-linejoin="round">
        <ellipse cx="0" cy="45" rx="75" ry="60" fill="${main}"/>
        <circle cx="0" cy="-10" r="52" fill="${main}"/>
        <ellipse cx="-34" cy="-70" rx="16" ry="55" fill="${second}" transform="rotate(-12 -34 -70)"/>
        <ellipse cx="34" cy="-70" rx="16" ry="55" fill="${second}" transform="rotate(12 34 -70)"/>
        <ellipse cx="-34" cy="-70" rx="8" ry="38" fill="#f6c9d8" transform="rotate(-12 -34 -70)"/>
        <ellipse cx="34" cy="-70" rx="8" ry="38" fill="#f6c9d8" transform="rotate(12 34 -70)"/>
        <circle cx="-18" cy="-14" r="7" fill="#2b2b2b"/>
        <circle cx="18" cy="-14" r="7" fill="#2b2b2b"/>
        <path d="M-6,-6 Q0,2 6,-6" stroke="#2b2b2b" stroke-width="4" fill="none"/>
        <path d="M-14,4 Q0,14 14,4" stroke="#d98b8b" stroke-width="4" fill="none"/>
        <circle cx="0" cy="45" r="16" fill="#f6c9d8"/>
        <circle cx="55" cy="90" r="18" fill="${face}"/>
      </g>`
    case 'puppy':
      return `<g ${c} stroke-linecap="round" stroke-linejoin="round">
        <ellipse cx="0" cy="40" rx="80" ry="58" fill="${main}"/>
        <circle cx="0" cy="-15" rx="52" ry="48" fill="${main}"/>
        <ellipse cx="-40" cy="-45" rx="26" ry="34" fill="${second}" transform="rotate(-18 -40 -45)"/>
        <ellipse cx="40" cy="-45" rx="26" ry="34" fill="${second}" transform="rotate(18 40 -45)"/>
        <ellipse cx="14" cy="-8" rx="22" ry="17" fill="${face}"/>
        <circle cx="-14" cy="-22" r="6" fill="#2b2b2b"/>
        <circle cx="12" cy="-22" r="6" fill="#2b2b2b"/>
        <ellipse cx="-1" cy="-12" rx="7" ry="5" fill="#2b2b2b"/>
        <path d="M-10,-6 Q0,2 10,-6" stroke="#2b2b2b" stroke-width="4" fill="none"/>
        <path d="M-70,-45 L-110,-70" stroke="${second}" stroke-width="12" fill="none"/>
        <circle cx="-95" cy="45" r="20" fill="${second}" transform="rotate(-20 -95 45)"/>
      </g>`
    case 'bear':
      return `<g ${c} stroke-linecap="round" stroke-linejoin="round">
        <ellipse cx="0" cy="42" rx="78" ry="62" fill="${main}"/>
        <circle cx="0" cy="-12" rx="55" ry="50" fill="${main}"/>
        <circle cx="-38" cy="-48" r="18" fill="${main}"/>
        <circle cx="38" cy="-48" r="18" fill="${main}"/>
        <circle cx="-38" cy="-48" r="9" fill="${second}"/>
        <circle cx="38" cy="-48" r="9" fill="${second}"/>
        <ellipse cx="10" cy="-4" rx="24" ry="19" fill="${face}"/>
        <circle cx="-16" cy="-20" r="6" fill="#2b2b2b"/>
        <circle cx="16" cy="-20" r="6" fill="#2b2b2b"/>
        <path d="M-7,-12 Q0,-4 7,-12" stroke="#2b2b2b" stroke-width="4" fill="none"/>
        <path d="M-6,0 Q0,8 6,0" stroke="#2b2b2b" stroke-width="4" fill="none"/>
        <circle cx="0" cy="70" r="14" fill="${face}"/>
      </g>`
    case 'fairy':
      return `<g ${c} stroke-linecap="round" stroke-linejoin="round">
        <ellipse cx="-40" cy="-55" rx="34" ry="12" fill="${second}" opacity="0.75" transform="rotate(-25 -40 -55)"/>
        <ellipse cx="40" cy="-55" rx="34" ry="12" fill="${second}" opacity="0.75" transform="rotate(25 40 -55)"/>
        <circle cx="0" cy="-22" r="30" fill="${face}"/>
        <path d="M-16,26 L-26,78 L0,62 L26,78 L16,26 Z" fill="${main}"/>
        <path d="M-16,26 L-26,78 L0,62 L26,78 L16,26 Z" fill="${main}" opacity="0.35"/>
        <circle cx="-9" cy="-26" r="4" fill="#2b2b2b"/>
        <circle cx="9" cy="-26" r="4" fill="#2b2b2b"/>
        <path d="M-4,-16 Q0,-10 4,-16" stroke="#2b2b2b" stroke-width="3.5" fill="none"/>
        <path d="M-6,-6 Q0,0 6,-6" stroke="#d98b8b" stroke-width="3.5" fill="none"/>
        <circle cx="30" cy="-95" r="5" fill="${pal.accent}"/>
        <circle cx="55" cy="-60" r="3.5" fill="${pal.accent2}"/>
        <circle cx="-52" cy="-88" r="4" fill="${pal.accent2}"/>
      </g>`
    case 'rocket':
      return `<g ${c}>
        <ellipse cx="0" cy="40" rx="38" ry="14" fill="${pal.accent2}" opacity="0.8"/>
        <ellipse cx="0" cy="70" rx="28" ry="12" fill="${pal.accent2}" opacity="0.6"/>
        <ellipse cx="0" cy="95" rx="16" ry="10" fill="${pal.accent2}" opacity="0.4"/>
        <path d="M-34,-30 Q-28,-95 0,-115 Q28,-95 34,-30 Q24,-8 0,-8 Q-24,-8 -34,-30 Z" fill="${main}"/>
        <path d="M-28,-32 Q0,-16 28,-32" stroke="${second}" stroke-width="6" fill="none"/>
        <circle cx="0" cy="-58" r="17" fill="${pal.skyTop}"/>
        <circle cx="0" cy="-58" r="12" fill="${pal.ground2}"/>
        <rect x="-30" y="-18" width="60" height="14" rx="7" fill="${pal.accent}"/>
        <circle cx="-36" cy="-30" r="10" fill="${pal.accent}"/>
        <circle cx="36" cy="-30" r="10" fill="${pal.accent}"/>
      </g>`
    case 'boat':
      return `<g ${c} stroke-linecap="round" stroke-linejoin="round">
        <path d="M-100,20 Q0,95 100,20 L80,45 L-80,45 Z" fill="${main}"/>
        <path d="M-100,20 Q0,95 100,20 L70,35 L-70,35 Z" fill="${second}"/>
        <rect x="-6" y="-95" width="12" height="115" rx="5" fill="#8a5a3b"/>
        <path d="M0,-90 L85,-55 L0,-20 Z" fill="${pal.accent}"/>
        <path d="M0,-90 L85,-55 L0,-20 Z" fill="${pal.accent2}" opacity="0.4"/>
        <path d="M-4,-14 L0,-4 L4,-14 Z" fill="${pal.accent2}"/>
      </g>`
    case 'train':
      return `<g ${c}>
        <rect x="-110" y="-70" width="130" height="95" rx="16" fill="${main}"/>
        <rect x="-100" y="-55" width="40" height="38" rx="10" fill="${pal.skyTop}"/>
        <rect x="-46" y="-55" width="40" height="38" rx="10" fill="${pal.skyTop}"/>
        <circle cx="-80" cy="-2" r="16" fill="#3b3b3b"/>
        <circle cx="-22" cy="-2" r="16" fill="#3b3b3b"/>
        <circle cx="-80" cy="-2" r="6" fill="#f5f5f5"/>
        <circle cx="-22" cy="-2" r="6" fill="#f5f5f5"/>
        <rect x="20" y="-46" width="95" height="70" rx="10" fill="${pal.accent}"/>
        <rect x="30" y="-36" width="30" height="28" rx="8" fill="${pal.skyTop}"/>
        <rect x="72" y="-36" width="30" height="28" rx="8" fill="${pal.skyTop}"/>
        <circle cx="52" cy="2" r="14" fill="#3b3b3b"/>
        <circle cx="88" cy="2" r="14" fill="#3b3b3b"/>
        <circle cx="52" cy="2" r="5" fill="#f5f5f5"/>
        <circle cx="88" cy="2" r="5" fill="#f5f5f5"/>
        <circle cx="12" cy="-80" r="12" fill="#f5f5f5" opacity="0.8"/>
        <circle cx="34" cy="-95" r="16" fill="#f5f5f5" opacity="0.6"/>
      </g>`
    case 'kite':
      return `<g ${c} stroke-linejoin="round">
        <path d="M0,-110 L70,-20 L0,70 L-70,-20 Z" fill="${main}"/>
        <path d="M0,-110 L70,-20 L0,70 L-70,-20 Z" fill="none" stroke="${pal.ground2}" stroke-width="6"/>
        <path d="M-70,-20 L70,-20 M0,-110 L0,70" stroke="${pal.ground2}" stroke-width="5"/>
        <path d="M-12,55 Q-30,85 -40,110 Q-20,95 0,105 Q20,95 40,110 Q30,85 12,55 Z" fill="${pal.accent}"/>
        <path d="M0,70 Q40,120 90,160" stroke="${pal.accent2}" stroke-width="5" fill="none"/>
      </g>`
  }
}

interface SceneBuilder {
  pal: Palette
  kind: Character
  night: boolean
  text: string
  rnd: () => number
  varIdx: number
}

function sceneSvg(b: SceneBuilder): string {
  const { pal, kind, night, text, rnd, varIdx } = b
  const W = 1200
  const H = 900
  const sky = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${pal.skyTop}"/><stop offset="1" stop-color="${pal.skyBottom}"/>
  </linearGradient>`
  const gnd = `<linearGradient id="gnd" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${pal.ground}"/><stop offset="1" stop-color="${pal.ground2}"/>
  </linearGradient>`

  let skyElements = ''
  if (night) {
    for (let i = 0; i < 18; i++) {
      const sx = 40 + rnd() * 1120
      const sy = 30 + rnd() * 420
      const r = 1.5 + rnd() * 3
      skyElements += `<circle cx="${sx.toFixed(0)}" cy="${sy.toFixed(0)}" r="${r.toFixed(1)}" fill="#ffe9a8" opacity="${0.5 + rnd() * 0.5}"/>`
    }
    const mx = 700 + rnd() * 320
    const my = 120 + rnd() * 120
    skyElements += `<circle cx="${mx.toFixed(0)}" cy="${my.toFixed(0)}" r="64" fill="#fdf3c8"/>`
    skyElements += `<circle cx="${mx.toFixed(0)}" cy="${my.toFixed(0)}" r="60" fill="#fff7d6"/>`
    skyElements += `<circle cx="${(mx - 22).toFixed(0)}" cy="${(my - 14).toFixed(0)}" r="10" fill="#f3e6b0"/>`
  } else {
    const sunX = 180 + rnd() * 700
    skyElements += `<circle cx="${sunX.toFixed(0)}" cy="${120 + rnd() * 80}" r="46" fill="#ffd76e"/>`
    skyElements += `<circle cx="${sunX.toFixed(0)}" cy="${120 + rnd() * 80}" r="38" fill="#ffe79b"/>`
    for (let i = 0; i < 4; i++) {
      const cx = rnd() * 1100
      const cy = 90 + rnd() * 260
      const s = 0.7 + rnd() * 0.9
      skyElements += `<g transform="translate(${cx.toFixed(0)},${cy.toFixed(0)}) scale(${s.toFixed(1)})">
        <circle cx="-22" cy="6" r="16" fill="#ffffff" opacity="0.95"/>
        <circle cx="0" cy="0" r="20" fill="#ffffff" opacity="0.95"/>
        <circle cx="22" cy="6" r="16" fill="#ffffff" opacity="0.95"/>
        <rect x="-24" y="12" width="48" height="14" rx="7" fill="#ffffff" opacity="0.95"/>
      </g>`
    }
  }

  let groundElements = ''
  const hillY = 620 + rnd() * 60
  groundElements += `<ellipse cx="${rnd() * 700}" cy="${hillY.toFixed(0)}" rx="${280 + rnd() * 220}" ry="${120 + rnd() * 70}" fill="${pal.ground}" opacity="0.9"/>`
  groundElements += `<ellipse cx="${600 + rnd() * 550}" cy="${(hillY + 40).toFixed(0)}" rx="${260 + rnd() * 200}" ry="${110 + rnd() * 60}" fill="${pal.ground}" opacity="0.95"/>`
  groundElements += `<rect x="0" y="${H - 190}" width="${W}" height="190" fill="url(#gnd)"/>`

  const flowers = Math.floor(5 + rnd() * 6)
  for (let i = 0; i < flowers; i++) {
    const fx = 40 + rnd() * 1120
    const fy = H - 90 - rnd() * 130
    const fc = i % 2 === 0 ? pal.accent : pal.accent2
    groundElements += `<circle cx="${fx.toFixed(0)}" cy="${(fy - 14).toFixed(0)}" r="9" fill="${fc}"/>`
    groundElements += `<circle cx="${(fx - 9).toFixed(0)}" cy="${(fy - 5).toFixed(0)}" r="9" fill="${fc}"/>`
    groundElements += `<circle cx="${(fx + 9).toFixed(0)}" cy="${(fy - 5).toFixed(0)}" r="9" fill="${fc}"/>`
    groundElements += `<circle cx="${fx.toFixed(0)}" cy="${fy.toFixed(0)}" r="7" fill="#fff3c4"/>`
    groundElements += `<rect x="${(fx - 3).toFixed(0)}" y="${fy.toFixed(0)}" width="6" height="26" fill="${pal.ground2}"/>`
  }

  if (varIdx % 2 === 0) {
    const tx = 60 + rnd() * 260
    groundElements += `<rect x="${tx.toFixed(0)}" y="${(H - 320).toFixed(0)}" width="26" height="130" rx="10" fill="#8a5a3b"/>`
    groundElements += `<circle cx="${(tx + 13).toFixed(0)}" cy="${(H - 350).toFixed(0)}" r="68" fill="${pal.ground2}" opacity="0.95"/>`
    groundElements += `<circle cx="${(tx - 30).toFixed(0)}" cy="${(H - 330).toFixed(0)}" r="46" fill="${pal.ground}"/>`
    groundElements += `<circle cx="${(tx + 56).toFixed(0)}" cy="${(H - 330).toFixed(0)}" r="46" fill="${pal.ground}"/>`
    for (let i = 0; i < 5; i++) {
      const cy2 = H - 320 + rnd() * 26
      const cx2 = tx + 13 + (rnd() - 0.5) * 130
      groundElements += `<circle cx="${cx2.toFixed(0)}" cy="${cy2.toFixed(0)}" r="4" fill="${pal.accent}"/>`
    }
  }

  const charOnLeft = varIdx % 3 === 0
  const charX = charOnLeft ? 230 + rnd() * 60 : 970 - rnd() * 60
  const charY = H - 120
  const cScale = 1.35 + rnd() * 0.2
  const charFlip = charOnLeft === false
  const charEl = charSvg(kind, { x: charX, y: charY, scale: cScale, flip: charFlip }, pal)

  const textEl = `<g transform="translate(80,${H - 60})">
    <rect x="-40" y="-58" width="${W - 160}" height="82" rx="30" fill="#ffffff" opacity="0.92"/>
    <rect x="-40" y="-58" width="${W - 160}" height="82" rx="30" fill="none" stroke="#f3e8d3" stroke-width="3"/>
    <text x="${(W - 160) / 2}" y="8" font-family="'Comic Sans MS', 'Chalkboard SE', 'Segoe UI', sans-serif" font-size="34" font-weight="700" fill="#3a3228" text-anchor="middle" dominant-baseline="middle">${escapeXml(text)}</text>
  </g>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <defs>${sky}${gnd}</defs>
    <rect width="${W}" height="${H}" fill="url(#sky)"/>
    ${skyElements}
    <rect x="0" y="${hillY.toFixed(0)}" width="${W}" height="${H - hillY}" fill="${pal.ground}" opacity="0.35"/>
    ${groundElements}
    ${charEl}
    ${textEl}
  </svg>`
}

export interface SampleAssets {
  cover: string
  pages: string[]
}

export function generateSampleAssets(spec: SampleBookSpec): SampleAssets {
  const pages: string[] = []
  for (let i = 1; i <= 24; i++) {
    const rnd = mulberry32(i * 7919 + spec.title.length * 31)
    const text = spec.storyLines[(i - 1) % spec.storyLines.length]
    pages.push(
      svgDataUrl(
        sceneSvg({
          pal: spec.palette,
          kind: spec.character,
          night: spec.category === 'Space' || spec.category === 'Bedtime',
          text,
          rnd,
          varIdx: i,
        }),
      ),
    )
  }

  const pal = spec.palette
  const coverSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" width="900" height="1200">
    <defs>
      <linearGradient id="csky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${pal.skyTop}"/><stop offset="1" stop-color="${pal.skyBottom}"/>
      </linearGradient>
      <linearGradient id="cgnd" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${pal.ground}"/><stop offset="1" stop-color="${pal.ground2}"/>
      </linearGradient>
    </defs>
    <rect width="900" height="1200" fill="url(#csky)"/>
    <circle cx="700" cy="240" r="80" fill="#ffd76e"/>
    <circle cx="700" cy="240" r="66" fill="#ffe79b"/>
    <ellipse cx="300" cy="830" rx="420" ry="240" fill="url(#cgnd)" opacity="0.9"/>
    <rect x="0" y="830" width="900" height="370" fill="url(#cgnd)"/>
    <circle cx="140" cy="240" r="10" fill="#fff" opacity="0.85"/>
    <circle cx="220" cy="170" r="6" fill="#fff" opacity="0.7"/>
    <circle cx="760" cy="130" r="7" fill="#fff" opacity="0.7"/>
    <rect x="70" y="90" width="760" height="1020" rx="34" fill="none" stroke="#ffffff" stroke-width="10" opacity="0.85"/>
    <text x="450" y="520" font-family="Georgia, 'Times New Roman', serif" font-size="86" font-weight="700" fill="#2e2820" text-anchor="middle">${escapeXml(spec.title)}</text>
    ${charSvg(spec.character, { x: 450, y: 900, scale: 1.7, flip: false }, pal)}
    <rect x="150" y="1040" width="600" height="52" rx="26" fill="#ffffff" opacity="0.92"/>
    <text x="450" y="1075" font-family="'Comic Sans MS', 'Segoe UI', sans-serif" font-size="26" font-weight="700" fill="#a54226" text-anchor="middle">A Wonder Pages Storybook</text>
  </svg>`

  return { cover: svgDataUrl(coverSvg), pages }
}
