'use client'

import React, { useState, useEffect } from 'react'

interface ColorPickerProps {
  path?: string
  name: string
  label?: string
  value?: string
  onChange: (value: string) => void
  required?: boolean
  readOnly?: boolean
}

const defaultColors = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#6B7280', // Gray
  '#84CC16', // Lime
]

export const ColorPicker: React.FC<ColorPickerProps> = ({
  name,
  label,
  value = '#3B82F6',
  onChange,
  required,
  readOnly,
}) => {
  const [selectedColor, setSelectedColor] = useState(value)
  const [customColor, setCustomColor] = useState(value)
  const [showCustom, setShowCustom] = useState(false)

  useEffect(() => {
    setSelectedColor(value || '#3B82F6')
    setCustomColor(value || '#3B82F6')
  }, [value])

  const handleColorChange = (color: string) => {
    setSelectedColor(color)
    setCustomColor(color)
    onChange(color)
  }

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color)
    handleColorChange(color)
  }

  const isValidHex = (color: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
  }

  return (
    <div className="color-picker">
      <style jsx>{`
        .color-picker {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .color-picker__label {
          font-size: 14px;
          font-weight: 600;
          color: var(--theme-text, #000);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .color-picker__required {
          color: var(--theme-error, #ef4444);
        }
        
        .color-picker__preview {
          width: 100%;
          height: 40px;
          border-radius: 6px;
          border: 2px solid var(--theme-elevation-50, #f1f5f9);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 500;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
          transition: all 0.2s ease;
        }
        
        .color-picker__grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .color-picker__swatch {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .color-picker__swatch:hover {
          transform: scale(1.1);
          border-color: var(--theme-elevation-200, #e2e8f0);
        }
        
        .color-picker__swatch--selected {
          border-color: var(--theme-text, #000);
          transform: scale(1.1);
        }
        
        .color-picker__swatch--selected::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 14px;
          font-weight: bold;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }
        
        .color-picker__custom {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .color-picker__toggle {
          background: var(--theme-elevation-50, #f8fafc);
          border: 1px solid var(--theme-elevation-200, #e2e8f0);
          color: var(--theme-text, #000);
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .color-picker__toggle:hover {
          background: var(--theme-elevation-100, #f1f5f9);
        }
        
        .color-picker__toggle--active {
          background: var(--theme-success, #10b981);
          color: white;
          border-color: var(--theme-success, #10b981);
        }
        
        .color-picker__input-wrapper {
          flex: 1;
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .color-picker__input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid var(--theme-elevation-200, #e2e8f0);
          border-radius: 4px;
          font-size: 14px;
          font-family: 'Roboto Mono', monospace;
        }
        
        .color-picker__input:focus {
          outline: none;
          border-color: var(--theme-success, #10b981);
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
        }
        
        .color-picker__input--invalid {
          border-color: var(--theme-error, #ef4444);
        }
        
        .color-picker__native {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .color-picker__section-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--theme-text-dim, #6b7280);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>

      {label && (
        <div className="color-picker__label">
          {label}
          {required && <span className="color-picker__required">*</span>}
        </div>
      )}

      <div 
        className="color-picker__preview" 
        style={{ backgroundColor: selectedColor }}
      >
        {selectedColor.toUpperCase()}
      </div>

      {!readOnly && (
        <>
          <div className="color-picker__section-title">Quick Colors</div>
          <div className="color-picker__grid">
            {defaultColors.map((color) => (
              <button
                key={color}
                type="button"
                className={`color-picker__swatch ${
                  selectedColor === color ? 'color-picker__swatch--selected' : ''
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
                title={color}
              />
            ))}
          </div>

          <div className="color-picker__custom">
            <button
              type="button"
              className={`color-picker__toggle ${
                showCustom ? 'color-picker__toggle--active' : ''
              }`}
              onClick={() => setShowCustom(!showCustom)}
            >
              Custom
            </button>

            {showCustom && (
              <div className="color-picker__input-wrapper">
                <input
                  type="text"
                  className={`color-picker__input ${
                    !isValidHex(customColor) ? 'color-picker__input--invalid' : ''
                  }`}
                  value={customColor}
                  onChange={(e) => {
                    const newColor = e.target.value
                    setCustomColor(newColor)
                    if (isValidHex(newColor)) {
                      handleColorChange(newColor)
                    }
                  }}
                  placeholder="#3B82F6"
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  title="Enter a valid hex color (e.g., #3B82F6)"
                />
                <input
                  type="color"
                  className="color-picker__native"
                  value={selectedColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  title="Use color picker"
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Hidden input for Payload */}
      <input
        type="hidden"
        name={name}
        value={selectedColor}
      />
    </div>
  )
}

export default ColorPicker