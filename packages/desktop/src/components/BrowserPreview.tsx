// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import * as React from 'react'
import { useState, useCallback } from 'react'
import { useStore } from '../hooks/useStore'

interface Props {
  url: string
}

const BrowserPreview: React.FC<Props> = ({ url }) => {
  const [inputUrl, setInputUrl] = useState(url)
  const [currentUrl, setCurrentUrl] = useState(url)
  const setBrowserPreviewUrl = useStore(s => s.setBrowserPreviewUrl)
  const toggleBrowserPreview = useStore(s => s.toggleBrowserPreview)

  const handleNavigate = useCallback(() => {
    let target = inputUrl.trim()
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'http://' + target
    }
    setCurrentUrl(target)
    setBrowserPreviewUrl(target)
  }, [inputUrl, setBrowserPreviewUrl])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNavigate()
  }, [handleNavigate])

  const handleOpenExternal = useCallback(() => {
    // Open in system browser via shell.openExternal
    window.open(currentUrl, '_blank')
  }, [currentUrl])

  const handleClose = useCallback(() => {
    toggleBrowserPreview()
  }, [toggleBrowserPreview])

  // Update input when url prop changes
  React.useEffect(() => {
    setInputUrl(url)
    setCurrentUrl(url)
  }, [url])

  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100%',
      borderLeft: '1px solid var(--border-default)',
      backgroundColor: 'var(--bg-surface)',
    },
  },
    // URL bar
    React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderBottom: '1px solid var(--border-default)',
        flexShrink: 0,
      },
    },
      // Refresh button
      React.createElement('button', {
        onClick: handleNavigate,
        style: {
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', fontSize: 'var(--text-sm)', padding: '2px 4px',
        },
        title: 'Refresh',
      }, '\u21BB'),
      // URL input
      React.createElement('input', {
        value: inputUrl,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setInputUrl(e.target.value),
        onKeyDown: handleKeyDown,
        style: {
          flex: 1, background: 'var(--bg-app)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
          fontSize: 'var(--text-xs)', padding: '3px 8px', fontFamily: 'Consolas, monospace',
          outline: 'none',
        },
        placeholder: 'http://localhost:3000',
      }),
      // Open external button
      React.createElement('button', {
        onClick: handleOpenExternal,
        style: {
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', fontSize: 'var(--text-sm)', padding: '2px 4px',
        },
        title: 'Open in browser',
      }, '\u2197'),
      // Close button
      React.createElement('button', {
        onClick: handleClose,
        style: {
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', fontSize: 'var(--text-sm)', padding: '2px 4px',
        },
        title: 'Close preview',
      }, '\u00D7'),
    ),

    // Iframe content
    React.createElement('iframe', {
      src: currentUrl,
      style: {
        flex: 1,
        width: '100%',
        border: 'none',
        background: 'white',
      },
      sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups',
    }),
  )
}

export default BrowserPreview
