'use client'

import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'

interface Tag {
  id: string
  name: string
  slug: string
  color: string
  description?: string
}

interface TagManagerProps {
  value?: string[] // Array of tag IDs
  onChange: (value: string[]) => void
  path?: string
  name: string
  label?: string
  required?: boolean
  readOnly?: boolean
}

export const TagManager: React.FC<TagManagerProps> = ({
  value = [],
  onChange,
  name,
  label = 'Tags',
  required,
  readOnly,
}) => {
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3B82F6')
  const [filteredTags, setFilteredTags] = useState<Tag[]>([])

  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch all tags on component mount
  useEffect(() => {
    fetchTags()
  }, [])

  // Update selected tags when value prop changes
  useEffect(() => {
    if (value.length > 0 && tags.length > 0) {
      const selected = tags.filter(tag => value.includes(tag.id))
      setSelectedTags(selected)
    } else {
      setSelectedTags([])
    }
  }, [value, tags])

  // Filter tags based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredTags(tags.filter(tag => !selectedTags.find(selected => selected.id === tag.id)))
    } else {
      const filtered = tags.filter(tag =>
        tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedTags.find(selected => selected.id === tag.id)
      )
      setFilteredTags(filtered)
    }
  }, [searchTerm, tags, selectedTags])

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchTags = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/tags?limit=100&sort=name', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setTags(data.docs || [])
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error)
      toast.error('Failed to load tags')
    } finally {
      setIsLoading(false)
    }
  }

  const createTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Tag name is required')
      return
    }

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
        }),
      })

      if (response.ok) {
        const newTag = await response.json()
        setTags(prev => [...prev, newTag])
        addTag(newTag)
        setNewTagName('')
        setNewTagColor('#3B82F6')
        setShowCreateModal(false)
        toast.success(`Tag "${newTag.name}" created successfully`)
      } else {
        throw new Error('Failed to create tag')
      }
    } catch (error) {
      console.error('Failed to create tag:', error)
      toast.error('Failed to create tag')
    }
  }

  const addTag = (tag: Tag) => {
    const newSelectedTags = [...selectedTags, tag]
    setSelectedTags(newSelectedTags)
    onChange(newSelectedTags.map(t => t.id))
    setSearchTerm('')
    setShowDropdown(false)
  }

  const removeTag = (tagId: string) => {
    const newSelectedTags = selectedTags.filter(tag => tag.id !== tagId)
    setSelectedTags(newSelectedTags)
    onChange(newSelectedTags.map(t => t.id))
  }

  const handleInputFocus = () => {
    if (!readOnly) {
      setShowDropdown(true)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredTags.length === 1) {
        addTag(filteredTags[0])
      } else if (searchTerm && filteredTags.length === 0) {
        setNewTagName(searchTerm)
        setShowCreateModal(true)
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
      setSearchTerm('')
    }
  }

  return (
    <div className="tag-manager">
      <style jsx>{`
        .tag-manager {
          position: relative;
          width: 100%;
        }

        .tag-manager__label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--theme-text, #000);
          margin-bottom: 8px;
        }

        .tag-manager__required {
          color: var(--theme-error, #ef4444);
          margin-left: 4px;
        }

        .tag-manager__selected {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
          min-height: 32px;
          align-items: flex-start;
        }

        .tag-manager__tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          color: white;
          position: relative;
        }

        .tag-manager__tag-remove {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          padding: 0;
          margin-left: 4px;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .tag-manager__tag-remove:hover {
          opacity: 1;
        }

        .tag-manager__input-container {
          position: relative;
        }

        .tag-manager__input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--theme-elevation-200, #e2e8f0);
          border-radius: 4px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .tag-manager__input:focus {
          outline: none;
          border-color: var(--theme-success, #10b981);
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
        }

        .tag-manager__input:disabled {
          background: var(--theme-elevation-50, #f8fafc);
          color: var(--theme-text-dim, #6b7280);
          cursor: not-allowed;
        }

        .tag-manager__dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--theme-bg, white);
          border: 1px solid var(--theme-elevation-200, #e2e8f0);
          border-radius: 4px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          max-height: 200px;
          overflow-y: auto;
        }

        .tag-manager__option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          cursor: pointer;
          transition: background-color 0.2s;
          border-bottom: 1px solid var(--theme-elevation-100, #f1f5f9);
        }

        .tag-manager__option:hover {
          background: var(--theme-elevation-50, #f8fafc);
        }

        .tag-manager__option:last-child {
          border-bottom: none;
        }

        .tag-manager__option-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .tag-manager__option-name {
          font-size: 14px;
          color: var(--theme-text, #000);
        }

        .tag-manager__create-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          width: 100%;
          background: var(--theme-elevation-50, #f8fafc);
          border: none;
          cursor: pointer;
          font-size: 14px;
          color: var(--theme-success, #10b981);
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .tag-manager__create-button:hover {
          background: var(--theme-elevation-100, #f1f5f9);
        }

        .tag-manager__empty {
          padding: 12px;
          text-align: center;
          color: var(--theme-text-dim, #6b7280);
          font-size: 14px;
        }

        .tag-manager__modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .tag-manager__modal-content {
          background: var(--theme-bg, white);
          border-radius: 8px;
          padding: 24px;
          width: 400px;
          max-width: 90vw;
        }

        .tag-manager__modal-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: var(--theme-text, #000);
        }

        .tag-manager__form-group {
          margin-bottom: 16px;
        }

        .tag-manager__form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 6px;
          color: var(--theme-text, #000);
        }

        .tag-manager__form-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--theme-elevation-200, #e2e8f0);
          border-radius: 4px;
          font-size: 14px;
        }

        .tag-manager__form-input:focus {
          outline: none;
          border-color: var(--theme-success, #10b981);
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
        }

        .tag-manager__color-input {
          width: 60px;
          height: 40px;
          border: 1px solid var(--theme-elevation-200, #e2e8f0);
          border-radius: 4px;
          cursor: pointer;
        }

        .tag-manager__modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .tag-manager__button {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tag-manager__button--primary {
          background: var(--theme-success, #10b981);
          color: white;
          border: 1px solid var(--theme-success, #10b981);
        }

        .tag-manager__button--primary:hover {
          background: #059669;
          border-color: #059669;
        }

        .tag-manager__button--secondary {
          background: transparent;
          color: var(--theme-text, #000);
          border: 1px solid var(--theme-elevation-200, #e2e8f0);
        }

        .tag-manager__button--secondary:hover {
          background: var(--theme-elevation-50, #f8fafc);
        }
      `}</style>

      {label && (
        <label className="tag-manager__label">
          {label}
          {required && <span className="tag-manager__required">*</span>}
        </label>
      )}

      <div className="tag-manager__selected">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="tag-manager__tag"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            {!readOnly && (
              <button
                type="button"
                className="tag-manager__tag-remove"
                onClick={() => removeTag(tag.id)}
                title={`Remove ${tag.name}`}
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>

      {!readOnly && (
        <div className="tag-manager__input-container" ref={dropdownRef}>
          <input
            ref={searchInputRef}
            type="text"
            className="tag-manager__input"
            placeholder="Search or add tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            disabled={isLoading}
          />

          {showDropdown && (
            <div className="tag-manager__dropdown">
              {filteredTags.length > 0 ? (
                filteredTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="tag-manager__option"
                    onClick={() => addTag(tag)}
                  >
                    <div
                      className="tag-manager__option-dot"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="tag-manager__option-name">{tag.name}</span>
                  </div>
                ))
              ) : searchTerm ? (
                <button
                  type="button"
                  className="tag-manager__create-button"
                  onClick={() => {
                    setNewTagName(searchTerm)
                    setShowCreateModal(true)
                    setShowDropdown(false)
                  }}
                >
                  <span>+</span>
                  Create &quot;{searchTerm}&quot;
                </button>
              ) : (
                <div className="tag-manager__empty">
                  {isLoading ? 'Loading tags...' : 'No tags available'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="tag-manager__modal">
          <div className="tag-manager__modal-content">
            <h3 className="tag-manager__modal-title">Create New Tag</h3>
            
            <div className="tag-manager__form-group">
              <label className="tag-manager__form-label">Name</label>
              <input
                type="text"
                className="tag-manager__form-input"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
                autoFocus
              />
            </div>

            <div className="tag-manager__form-group">
              <label className="tag-manager__form-label">Color</label>
              <input
                type="color"
                className="tag-manager__color-input"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
              />
            </div>

            <div className="tag-manager__modal-actions">
              <button
                type="button"
                className="tag-manager__button tag-manager__button--secondary"
                onClick={() => {
                  setShowCreateModal(false)
                  setNewTagName('')
                  setNewTagColor('#3B82F6')
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tag-manager__button tag-manager__button--primary"
                onClick={createTag}
                disabled={!newTagName.trim()}
              >
                Create Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={JSON.stringify(value)}
      />
    </div>
  )
}

export default TagManager