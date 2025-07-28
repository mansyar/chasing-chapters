'use client'

import React, { useState } from 'react'
import { toast } from 'react-toastify'

interface BulkActionsProps {
  selectedDocs: string[]
  collection: string
  onComplete?: () => void
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedDocs,
  collection,
  onComplete,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [action, setAction] = useState<string>('')

  const handleBulkAction = async (actionType: 'publish' | 'unpublish' | 'delete') => {
    if (!selectedDocs.length) {
      toast.error('No documents selected')
      return
    }

    const actionNames = {
      publish: 'publish',
      unpublish: 'unpublish', 
      delete: 'delete'
    }

    const confirmMessage = `Are you sure you want to ${actionNames[actionType]} ${selectedDocs.length} review(s)?`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    setIsLoading(true)
    setAction(actionType)

    try {
      const promises = selectedDocs.map(async (docId) => {
        if (actionType === 'delete') {
          const response = await fetch(`/api/${collection}/${docId}`, {
            method: 'DELETE',
            credentials: 'include',
          })
          if (!response.ok) throw new Error(`Failed to delete document ${docId}`)
          return response.json()
        } else {
          const status = actionType === 'publish' ? 'published' : 'draft'
          const response = await fetch(`/api/${collection}/${docId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ status }),
          })
          if (!response.ok) throw new Error(`Failed to ${actionType} document ${docId}`)
          return response.json()
        }
      })

      await Promise.all(promises)
      
      const successMessage = actionType === 'delete' 
        ? `Successfully deleted ${selectedDocs.length} review(s)`
        : `Successfully ${actionType === 'publish' ? 'published' : 'unpublished'} ${selectedDocs.length} review(s)`
      
      toast.success(successMessage)
      
      if (onComplete) {
        onComplete()
      }
      
      // Refresh the page to update the list
      window.location.reload()
      
    } catch (error) {
      console.error(`Bulk ${actionType} error:`, error)
      toast.error(`Failed to ${actionType} some documents. Please try again.`)
    } finally {
      setIsLoading(false)
      setAction('')
    }
  }

  if (!selectedDocs.length) {
    return null
  }

  return (
    <div className="bulk-actions">
      <style jsx>{`
        .bulk-actions {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--theme-bg, white);
          border: 1px solid var(--theme-elevation-200, #e2e8f0);
          border-radius: 8px;
          padding: 16px 20px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 12px;
          max-width: 90vw;
        }

        .bulk-actions__count {
          font-size: 14px;
          font-weight: 600;
          color: var(--theme-text, #000);
          white-space: nowrap;
        }

        .bulk-actions__buttons {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .bulk-actions__button {
          padding: 8px 16px;
          border: 1px solid transparent;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          min-width: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .bulk-actions__button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .bulk-actions__button--publish {
          background: var(--theme-success, #10b981);
          color: white;
          border-color: var(--theme-success, #10b981);
        }

        .bulk-actions__button--publish:hover:not(:disabled) {
          background: #059669;
          border-color: #059669;
        }

        .bulk-actions__button--unpublish {
          background: var(--theme-warning, #f59e0b);
          color: white;
          border-color: var(--theme-warning, #f59e0b);
        }

        .bulk-actions__button--unpublish:hover:not(:disabled) {
          background: #d97706;
          border-color: #d97706;
        }

        .bulk-actions__button--delete {
          background: var(--theme-error, #ef4444);
          color: white;
          border-color: var(--theme-error, #ef4444);
        }

        .bulk-actions__button--delete:hover:not(:disabled) {
          background: #dc2626;
          border-color: #dc2626;
        }

        .bulk-actions__spinner {
          width: 14px;
          height: 14px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .bulk-actions__divider {
          width: 1px;
          height: 24px;
          background: var(--theme-elevation-200, #e2e8f0);
          margin: 0 4px;
        }

        @media (max-width: 768px) {
          .bulk-actions {
            position: relative;
            bottom: auto;
            left: auto;
            transform: none;
            margin: 16px;
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .bulk-actions__buttons {
            justify-content: center;
            flex-wrap: wrap;
          }

          .bulk-actions__button {
            flex: 1;
            min-width: 100px;
          }
        }
      `}</style>

      <div className="bulk-actions__count">
        {selectedDocs.length} review{selectedDocs.length !== 1 ? 's' : ''} selected
      </div>

      <div className="bulk-actions__divider" />

      <div className="bulk-actions__buttons">
        <button
          type="button"
          className="bulk-actions__button bulk-actions__button--publish"
          onClick={() => handleBulkAction('publish')}
          disabled={isLoading}
        >
          {isLoading && action === 'publish' && (
            <div className="bulk-actions__spinner" />
          )}
          Publish
        </button>

        <button
          type="button"
          className="bulk-actions__button bulk-actions__button--unpublish"
          onClick={() => handleBulkAction('unpublish')}
          disabled={isLoading}
        >
          {isLoading && action === 'unpublish' && (
            <div className="bulk-actions__spinner" />
          )}
          Unpublish
        </button>

        <button
          type="button"
          className="bulk-actions__button bulk-actions__button--delete"
          onClick={() => handleBulkAction('delete')}
          disabled={isLoading}
        >
          {isLoading && action === 'delete' && (
            <div className="bulk-actions__spinner" />
          )}
          Delete
        </button>
      </div>
    </div>
  )
}

export default BulkActions