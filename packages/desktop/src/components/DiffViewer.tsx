import * as React from 'react'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { highlightCode, ensureSyntaxTheme } from '../hooks/useSyntaxHighlight'

interface Props {
  worktreePath: string
  visible?: boolean
}

interface DiffData {
  files: string[]
  diffs: Record<string, { original: string; modified: string }>
}

type DiffLineType = 'equal' | 'added' | 'removed'
interface DiffLine {
  type: DiffLineType
  lineNum: number | null
  text: string
}

/**
 * Simple LCS-based line diff.
 * Returns two arrays (left/right) with type annotations per line.
 */
function computeLineDiff(original: string, modified: string): { left: DiffLine[]; right: DiffLine[] } {
  const oldLines = original.split('\n')
  const newLines = modified.split('\n')

  // Build LCS table
  const m = oldLines.length
  const n = newLines.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = oldLines[i - 1] === newLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  // Backtrack to produce diff operations
  const ops: Array<{ type: DiffLineType; oldIdx?: number; newIdx?: number }> = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      ops.push({ type: 'equal', oldIdx: i - 1, newIdx: j - 1 })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: 'added', newIdx: j - 1 })
      j--
    } else {
      ops.push({ type: 'removed', oldIdx: i - 1 })
      i--
    }
  }
  ops.reverse()

  const left: DiffLine[] = []
  const right: DiffLine[] = []

  for (const op of ops) {
    if (op.type === 'equal') {
      left.push({ type: 'equal', lineNum: op.oldIdx! + 1, text: oldLines[op.oldIdx!] })
      right.push({ type: 'equal', lineNum: op.newIdx! + 1, text: newLines[op.newIdx!] })
    } else if (op.type === 'removed') {
      left.push({ type: 'removed', lineNum: op.oldIdx! + 1, text: oldLines[op.oldIdx!] })
      right.push({ type: 'removed', lineNum: null, text: '' })
    } else {
      left.push({ type: 'added', lineNum: null, text: '' })
      right.push({ type: 'added', lineNum: op.newIdx! + 1, text: newLines[op.newIdx!] })
    }
  }

  return { left, right }
}

const LINE_STYLES: Record<DiffLineType, React.CSSProperties> = {
  equal: {},
  removed: { backgroundColor: 'rgba(248, 81, 73, 0.15)' },
  added: { backgroundColor: 'rgba(63, 185, 80, 0.15)' },
}

const LINE_NUM_STYLES: Record<DiffLineType, React.CSSProperties> = {
  equal: { color: 'var(--text-disabled)' },
  removed: { color: '#f85149' },
  added: { color: '#3fb950' },
}

const DiffViewer: React.FC<Props> = ({ worktreePath, visible }) => {
  ensureSyntaxTheme()
  const [data, setData] = useState<DiffData>({ files: [], diffs: {} })
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<number>(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const leftScrollRef = useRef<HTMLDivElement | null>(null)
  const rightScrollRef = useRef<HTMLDivElement | null>(null)
  const syncingScroll = useRef(false)

  const fetchDiff = useCallback(() => {
    if (!window.runnio?.github) return
    setLoading(true)
    window.runnio.github.getDiff(worktreePath)
      .then((result) => {
        setData(prev => {
          const newData = result || { files: [], diffs: {} }
          if (selectedFile && !newData.files.includes(selectedFile) && newData.files.length > 0) {
            setSelectedFile(newData.files[0])
          } else if (!selectedFile && newData.files.length > 0) {
            setSelectedFile(newData.files[0])
          }
          return newData
        })
        setLastUpdated(Date.now())
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [worktreePath, selectedFile])

  useEffect(() => { fetchDiff() }, [fetchDiff])
  useEffect(() => { if (visible) fetchDiff() }, [visible, fetchDiff])
  useEffect(() => {
    if (visible) {
      pollRef.current = setInterval(fetchDiff, 5000)
    }
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [visible, fetchDiff])

  const diff = selectedFile ? (data.diffs[selectedFile] || { original: '', modified: '' }) : null

  const diffResult = useMemo(() => {
    if (!diff) return null
    // Cap LCS computation for very large files (> 2000 lines)
    const maxLines = 2000
    let orig = diff.original || ''
    let mod = diff.modified || ''
    if (orig.split('\n').length > maxLines) orig = orig.split('\n').slice(0, maxLines).join('\n') + '\n... (truncated)'
    if (mod.split('\n').length > maxLines) mod = mod.split('\n').slice(0, maxLines).join('\n') + '\n... (truncated)'
    return computeLineDiff(orig, mod)
  }, [diff?.original, diff?.modified])

  // Synchronized scrolling between left and right panes
  const handleScroll = useCallback((source: 'left' | 'right') => {
    if (syncingScroll.current) return
    syncingScroll.current = true
    const src = source === 'left' ? leftScrollRef.current : rightScrollRef.current
    const dst = source === 'left' ? rightScrollRef.current : leftScrollRef.current
    if (src && dst) {
      dst.scrollTop = src.scrollTop
    }
    requestAnimationFrame(() => { syncingScroll.current = false })
  }, [])

  if (loading && data.files.length === 0) {
    return React.createElement('div', {
      style: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 'var(--text-base)' },
    }, 'Loading diff...')
  }

  if (data.files.length === 0) {
    return React.createElement('div', {
      style: { height: '100%', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '8px' },
    },
      React.createElement('span', { style: { fontSize: '24px', color: 'var(--working)' } }, '\u2713'),
      React.createElement('span', { style: { color: 'var(--text-primary)', fontSize: 'var(--text-base)' } }, 'No changes in this workspace'),
      React.createElement('span', { style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' } }, 'All files are up to date'),
      React.createElement('button', {
        onClick: fetchDiff,
        style: { background: 'none', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', padding: '4px 12px', cursor: 'pointer', fontSize: 'var(--text-xs)', marginTop: '8px' },
      }, 'Refresh'),
    )
  }

  // Pre-compute highlighted lines for the selected file
  const highlightedLines = useMemo(() => {
    if (!diff || !selectedFile) return { left: [] as string[], right: [] as string[] }
    const origHtml = highlightCode(diff.original || '', selectedFile)
    const modHtml = highlightCode(diff.modified || '', selectedFile)
    return {
      left: origHtml.split('\n'),
      right: modHtml.split('\n'),
    }
  }, [diff?.original, diff?.modified, selectedFile])

  const renderLineColumn = (lines: DiffLine[], side: 'left' | 'right') => {
    const hlLines = side === 'left' ? highlightedLines.left : highlightedLines.right
    let hlIdx = 0
    return lines.map((line, idx) => {
      // Map diff line to highlighted line
      let lineHtml = ''
      if (line.lineNum !== null) {
        const hlLineIdx = line.lineNum - 1
        lineHtml = hlLines[hlLineIdx] ?? ''
        hlIdx++
      }

      return React.createElement('div', {
        key: idx,
        style: {
          display: 'flex', minHeight: '20px',
          ...LINE_STYLES[line.type],
        },
      },
        // Line number gutter
        React.createElement('span', {
          style: {
            width: '48px', minWidth: '48px', textAlign: 'right' as const,
            padding: '0 8px 0 4px', userSelect: 'none' as const,
            fontSize: 'var(--text-xs)', fontFamily: 'Consolas, monospace',
            borderRight: '1px solid var(--border-subtle)',
            ...LINE_NUM_STYLES[line.type],
          },
        }, line.lineNum ?? ''),
        // +/- indicator
        React.createElement('span', {
          style: {
            width: '16px', minWidth: '16px', textAlign: 'center' as const,
            fontSize: 'var(--text-xs)', fontFamily: 'Consolas, monospace', userSelect: 'none' as const,
            color: line.type === 'removed' ? '#f85149' : line.type === 'added' ? '#3fb950' : 'transparent',
          },
        }, line.type === 'removed' && side === 'left' ? '\u2212' : line.type === 'added' && side === 'right' ? '+' : ''),
        // Line content (highlighted)
        line.lineNum !== null
          ? React.createElement('span', {
              style: {
                flex: 1, padding: '0 8px', fontSize: 'var(--text-sm)',
                fontFamily: 'Consolas, monospace', whiteSpace: 'pre' as const,
              },
              dangerouslySetInnerHTML: { __html: lineHtml },
            })
          : React.createElement('span', {
              style: {
                flex: 1, padding: '0 8px', fontSize: 'var(--text-sm)',
                fontFamily: 'Consolas, monospace', whiteSpace: 'pre' as const,
                color: 'transparent',
              },
            }),
      )
    })
  }

  return React.createElement('div', {
    style: { height: '100%', display: 'flex', flexDirection: 'column' as const },
  },
    // File tabs + stats
    React.createElement('div', {
      style: {
        display: 'flex', alignItems: 'center', gap: 0, padding: '0 8px',
        borderBottom: '1px solid var(--border-default)', overflowX: 'auto' as const, flexShrink: 0,
      },
    },
      ...data.files.map((f) =>
        React.createElement('button', {
          key: f,
          onClick: () => setSelectedFile(f),
          style: {
            background: 'transparent', border: 'none',
            borderBottom: selectedFile === f ? '2px solid var(--accent)' : '2px solid transparent',
            padding: '8px 14px', color: selectedFile === f ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: 'var(--text-sm)', cursor: 'pointer', whiteSpace: 'nowrap' as const,
            fontFamily: 'Consolas, monospace', transition: 'all 150ms',
          },
        }, f.split(/[\\/]/).pop())
      ),
      React.createElement('div', { style: { flex: 1 } }),
      // Change stats
      diffResult ? React.createElement('span', {
        style: { fontSize: 'var(--text-xs)', fontFamily: 'Consolas, monospace', marginRight: '8px', whiteSpace: 'nowrap' as const },
      },
        React.createElement('span', { style: { color: '#3fb950' } },
          '+' + diffResult.right.filter(l => l.type === 'added' && l.lineNum !== null).length),
        ' ',
        React.createElement('span', { style: { color: '#f85149' } },
          '\u2212' + diffResult.left.filter(l => l.type === 'removed' && l.lineNum !== null).length),
      ) : null,
      React.createElement('span', {
        style: { fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginRight: '8px', whiteSpace: 'nowrap' as const },
      }, `${data.files.length} file${data.files.length !== 1 ? 's' : ''}`),
      React.createElement('button', {
        onClick: fetchDiff,
        style: {
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', padding: '4px 8px', fontSize: 'var(--text-sm)',
          transition: 'color 150ms',
        },
        title: 'Refresh diff',
      }, '\u21BB'),
    ),
    // Diff content — side by side with line numbers and highlights
    diffResult
      ? React.createElement('div', {
          style: { display: 'flex', flex: 1, overflow: 'hidden' },
        },
          // Left pane (original)
          React.createElement('div', {
            ref: leftScrollRef,
            onScroll: () => handleScroll('left'),
            style: { flex: 1, overflow: 'auto', borderRight: '1px solid var(--border-default)' },
          },
            React.createElement('div', {
              style: {
                padding: '4px 8px', borderBottom: '1px solid var(--border-default)',
                fontSize: 'var(--text-xs)', color: '#f85149',
                position: 'sticky' as const, top: 0, backgroundColor: '#0a0a0a', zIndex: 1,
              },
            }, '\u2212 Original (HEAD)'),
            React.createElement('div', {
              style: { lineHeight: '20px' },
            }, ...renderLineColumn(diffResult.left, 'left')),
          ),
          // Right pane (modified)
          React.createElement('div', {
            ref: rightScrollRef,
            onScroll: () => handleScroll('right'),
            style: { flex: 1, overflow: 'auto' },
          },
            React.createElement('div', {
              style: {
                padding: '4px 8px', borderBottom: '1px solid var(--border-default)',
                fontSize: 'var(--text-xs)', color: '#3fb950',
                position: 'sticky' as const, top: 0, backgroundColor: '#0a0a0a', zIndex: 1,
              },
            }, '+ Modified'),
            React.createElement('div', {
              style: { lineHeight: '20px' },
            }, ...renderLineColumn(diffResult.right, 'right')),
          ),
        )
      : null,
  )
}

export default DiffViewer
