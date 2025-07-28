import {
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  StrikethroughFeature,
  SubscriptFeature,
  SuperscriptFeature,
  InlineCodeFeature,
  ParagraphFeature,
  HeadingFeature,
  AlignFeature,
  IndentFeature,
  UnorderedListFeature,
  OrderedListFeature,
  ChecklistFeature,
  LinkFeature,
  RelationshipFeature,
  BlockquoteFeature,
  UploadFeature,
  HorizontalRuleFeature,
} from '@payloadcms/richtext-lexical'

// Enhanced feature configuration for book reviews
export const defaultFeatures = [
  // Text formatting
  BoldFeature(),
  ItalicFeature(),
  UnderlineFeature(),
  StrikethroughFeature(),
  SubscriptFeature(),
  SuperscriptFeature(),
  InlineCodeFeature(),

  // Paragraph and structure
  ParagraphFeature(),
  HeadingFeature({
    enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'],
  }),
  AlignFeature(),

  // Lists and organization
  UnorderedListFeature(),
  OrderedListFeature(),
  ChecklistFeature(),
  IndentFeature(),

  // Interactive elements
  LinkFeature({
    enabledCollections: ['media'],
    fields: [
      {
        name: 'rel',
        label: 'Rel Attribute',
        type: 'select',
        hasMany: true,
        options: ['noopener', 'noreferrer', 'nofollow'],
        admin: {
          description: 'The rel attribute defines the relationship between the current page and the linked page/resource.',
        },
      },
    ],
  }),

  // Media and uploads
  UploadFeature({
    collections: {
      media: {
        fields: [
          {
            name: 'caption',
            type: 'richText',
            editor: {
              // Use a simpler editor for captions to prevent infinite nesting
              features: [BoldFeature(), ItalicFeature(), LinkFeature()],
            },
          },
          {
            name: 'alignment',
            type: 'radio',
            options: [
              {
                label: 'Left',
                value: 'left',
              },
              {
                label: 'Center',
                value: 'center',
              },
              {
                label: 'Right',
                value: 'right',
              },
            ],
            defaultValue: 'center',
          },
        ],
      },
    },
  }),

  // Relationships (for linking to other reviews, tags, etc.)
  RelationshipFeature({
    enabledCollections: ['reviews', 'tags'],
    maxDepth: 1,
  }),

  // Content elements
  BlockquoteFeature(),
  HorizontalRuleFeature(),
]