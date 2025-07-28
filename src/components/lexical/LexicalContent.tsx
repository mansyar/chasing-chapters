import React from 'react'

// This is a simplified component to render Lexical content as HTML
// In a full implementation, you might want to use @payloadcms/richtext-lexical's React renderer
interface LexicalContentProps {
  content: {
    root: {
      type: string
      children: any[]
      direction: ('ltr' | 'rtl') | null
      format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | ''
      indent: number
      version: number
    }
    [k: string]: unknown
  }
  className?: string
}

// Simple recursive function to convert Lexical nodes to HTML
function renderLexicalNode(node: any): React.ReactNode {
  if (!node) return null

  // Handle text nodes
  if (node.type === 'text') {
    let text = node.text || ''
    
    // Apply formatting
    if (node.format) {
      if (node.format & 1) text = <strong key={Math.random()}>{text}</strong> // Bold
      if (node.format & 2) text = <em key={Math.random()}>{text}</em> // Italic
      if (node.format & 8) text = <u key={Math.random()}>{text}</u> // Underline
      if (node.format & 16) text = <s key={Math.random()}>{text}</s> // Strikethrough
    }
    
    return text
  }

  // Handle paragraph nodes
  if (node.type === 'paragraph') {
    return (
      <p key={Math.random()} className="mb-4">
        {node.children?.map((child: any) => renderLexicalNode(child))}
      </p>
    )
  }

  // Handle heading nodes
  if (node.type === 'heading') {
    const tag = node.tag || 'h2'
    const headingClasses = {
      h1: 'text-3xl font-bold mb-6 mt-8',
      h2: 'text-2xl font-bold mb-4 mt-6',
      h3: 'text-xl font-bold mb-3 mt-5',
      h4: 'text-lg font-bold mb-2 mt-4',
      h5: 'text-base font-bold mb-2 mt-3',
      h6: 'text-sm font-bold mb-2 mt-2'
    }
    
    switch (tag) {
      case 'h1':
        return <h1 key={Math.random()} className={headingClasses.h1}>{node.children?.map((child: any) => renderLexicalNode(child))}</h1>
      case 'h2':
        return <h2 key={Math.random()} className={headingClasses.h2}>{node.children?.map((child: any) => renderLexicalNode(child))}</h2>
      case 'h3':
        return <h3 key={Math.random()} className={headingClasses.h3}>{node.children?.map((child: any) => renderLexicalNode(child))}</h3>
      case 'h4':
        return <h4 key={Math.random()} className={headingClasses.h4}>{node.children?.map((child: any) => renderLexicalNode(child))}</h4>
      case 'h5':
        return <h5 key={Math.random()} className={headingClasses.h5}>{node.children?.map((child: any) => renderLexicalNode(child))}</h5>
      case 'h6':
        return <h6 key={Math.random()} className={headingClasses.h6}>{node.children?.map((child: any) => renderLexicalNode(child))}</h6>
      default:
        return <h2 key={Math.random()} className={headingClasses.h2}>{node.children?.map((child: any) => renderLexicalNode(child))}</h2>
    }
  }

  // Handle list nodes
  if (node.type === 'list') {
    const ListTag = node.listType === 'number' ? 'ol' : 'ul'
    const listClasses = node.listType === 'number' ? 'list-decimal list-inside mb-4' : 'list-disc list-inside mb-4'
    
    return (
      <ListTag key={Math.random()} className={listClasses}>
        {node.children?.map((child: any) => renderLexicalNode(child))}
      </ListTag>
    )
  }

  // Handle list item nodes
  if (node.type === 'listitem') {
    return (
      <li key={Math.random()} className="mb-1">
        {node.children?.map((child: any) => renderLexicalNode(child))}
      </li>
    )
  }

  // Handle quote nodes
  if (node.type === 'quote') {
    return (
      <blockquote key={Math.random()} className="border-l-4 border-primary-200 pl-4 italic text-neutral-600 my-6">
        {node.children?.map((child: any) => renderLexicalNode(child))}
      </blockquote>
    )
  }

  // Handle link nodes
  if (node.type === 'autolink' || node.type === 'link') {
    return (
      <a
        key={Math.random()}
        href={node.url}
        className="text-primary-600 hover:text-primary-700 underline"
        target={node.newTab ? '_blank' : '_self'}
        rel={node.newTab ? 'noopener noreferrer' : undefined}
      >
        {node.children?.map((child: any) => renderLexicalNode(child))}
      </a>
    )
  }

  // Handle line break
  if (node.type === 'linebreak') {
    return <br key={Math.random()} />
  }

  // Fallback for unknown nodes - just render children
  if (node.children) {
    return (
      <div key={Math.random()}>
        {node.children.map((child: any) => renderLexicalNode(child))}
      </div>
    )
  }

  return null
}

export default function LexicalContent({ content, className = '' }: LexicalContentProps) {
  if (!content?.root?.children) {
    return <div className={className}>No content available.</div>
  }

  return (
    <div className={`prose prose-neutral max-w-none ${className}`}>
      {content.root.children.map((node: any) => renderLexicalNode(node))}
    </div>
  )
}