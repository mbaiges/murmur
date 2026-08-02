import { LayoutStyleName } from '../domain/types'

export type LayoutFieldType = 'string' | 'markdown'

export interface LayoutContentFieldSpec {
  key: string
  type: LayoutFieldType
  required: boolean
  description: string
  promptHint?: string
}

export interface LayoutContentSpec {
  schemaId: string
  layoutStyle: LayoutStyleName
  fields: LayoutContentFieldSpec[]
}

const SIMPLE_PHRASE_FIELDS: LayoutContentFieldSpec[] = [
  {
    key: 'phrase',
    type: 'markdown',
    required: true,
    description: 'Single surreal proverb-style phrase from the headlines.',
    promptHint: 'One rhythmic, brief folk-saying structure; may use enabled markdown only.'
  }
]

const SIMPLE_SCHEMA_ID = 'murmur.layout.simple.v1'

function simpleSpec(layoutStyle: LayoutStyleName): LayoutContentSpec {
  return {
    schemaId: SIMPLE_SCHEMA_ID,
    layoutStyle,
    fields: SIMPLE_PHRASE_FIELDS
  }
}

const REGISTRY: Record<LayoutStyleName, LayoutContentSpec> = {
  centered: simpleSpec('centered'),
  scattered: simpleSpec('scattered'),
  'editorial-left': simpleSpec('editorial-left'),
  'editorial-right': simpleSpec('editorial-right'),
  asymmetrical: simpleSpec('asymmetrical'),
  'book-cover': simpleSpec('book-cover'),
  'split-spread': {
    schemaId: 'murmur.layout.split-spread.v1',
    layoutStyle: 'split-spread',
    fields: [
      {
        key: 'left',
        type: 'markdown',
        required: true,
        description: 'Left page half: a complete clause or proverb half.',
        promptHint: 'Must read as a full thought; do not split mid-idiom.'
      },
      {
        key: 'right',
        type: 'markdown',
        required: true,
        description: 'Right page half: completing or contrasting half.',
        promptHint: 'Pair with left for rhythm; complete clause.'
      }
    ]
  },
  'tabloid-stack': {
    schemaId: 'murmur.layout.tabloid.v1',
    layoutStyle: 'tabloid-stack',
    fields: [
      {
        key: 'headline',
        type: 'markdown',
        required: true,
        description: 'All-caps-worthy front-page headline from the surreal phrase.',
        promptHint: 'Short, punchy; can use markdown emphasis sparingly.'
      },
      {
        key: 'deck',
        type: 'markdown',
        required: false,
        description: 'Standfirst / subhead supporting the headline.',
        promptHint: 'Optional; italic tone; shorter than headline.'
      },
      {
        key: 'kicker',
        type: 'string',
        required: false,
        description: 'Optional kicker label above headline (plain text).'
      }
    ]
  },
  'pull-quote': {
    schemaId: 'murmur.layout.pull-quote.v1',
    layoutStyle: 'pull-quote',
    fields: [
      {
        key: 'quote',
        type: 'markdown',
        required: true,
        description: 'Large pull-quote body.',
        promptHint: 'The main surreal proverb as a quotable block.'
      },
      {
        key: 'attribution',
        type: 'string',
        required: false,
        description: 'Optional attribution line (plain text).'
      }
    ]
  },
  'feature-opener': {
    schemaId: 'murmur.layout.feature-opener.v1',
    layoutStyle: 'feature-opener',
    fields: [
      {
        key: 'section',
        type: 'string',
        required: false,
        description: 'Section or masthead label (e.g. Culture, Politics).',
        promptHint: 'Small caps / kicker tone; plain text.'
      },
      {
        key: 'headline',
        type: 'markdown',
        required: true,
        description: 'Dominant feature headline on the opener spread.',
        promptHint: 'Large display type; one clear hero line.'
      },
      {
        key: 'deck',
        type: 'markdown',
        required: false,
        description: 'Standfirst under the headline; minimal body on opener.',
        promptHint: 'Shorter than headline; summarizes the feature.'
      }
    ]
  },
  'sidebar-rail': {
    schemaId: 'murmur.layout.sidebar-rail.v1',
    layoutStyle: 'sidebar-rail',
    fields: [
      {
        key: 'main',
        type: 'markdown',
        required: true,
        description: 'Primary column: headline or lead paragraph.',
        promptHint: 'Wide column voice; complete thoughts.'
      },
      {
        key: 'sidebar',
        type: 'markdown',
        required: true,
        description: 'Narrow margin rail: note, fact box, or related blurb.',
        promptHint: 'Shorter supporting context; can be quote-like.'
      }
    ]
  },
  'byline-lede': {
    schemaId: 'murmur.layout.byline-lede.v1',
    layoutStyle: 'byline-lede',
    fields: [
      {
        key: 'headline',
        type: 'markdown',
        required: true,
        description: 'Article headline (entry point).',
        promptHint: 'Largest type on the page.'
      },
      {
        key: 'byline',
        type: 'string',
        required: false,
        description: 'Author or desk credit (plain text).',
        promptHint: 'e.g. "By …" or "Murmur Desk".'
      },
      {
        key: 'lede',
        type: 'markdown',
        required: true,
        description: 'Opening paragraph (lede) after headline and byline.',
        promptHint: 'One short paragraph; sets the story tone.'
      }
    ]
  }
}

export function getLayoutContentSpec(layoutStyle: LayoutStyleName): LayoutContentSpec {
  return REGISTRY[layoutStyle]
}

export function allLayoutContentSpecs(): LayoutContentSpec[] {
  return Object.values(REGISTRY)
}
