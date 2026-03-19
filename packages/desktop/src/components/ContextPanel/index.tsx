import * as React from 'react'
import { PluginContextData } from '../../types'
import AgencyOSPanel from './AgencyOSPanel'
import BmadPanel from './BmadPanel'

interface Props {
  pluginName: string | null
  context: PluginContextData | null
}

const ContextPanel: React.FC<Props> = ({ pluginName, context }) => {
  if (!context) return null

  return React.createElement('div', {
    style: {
      padding: '16px',
      borderBottom: '1px solid #1f1f1f',
    },
  },
    pluginName === 'agency-os'
      ? React.createElement(AgencyOSPanel, { context })
      : pluginName === 'bmad'
        ? React.createElement(BmadPanel, { context })
        : React.createElement('div', {
            style: { fontSize: '13px', color: '#888' },
          }, context.summary)
  )
}

export default ContextPanel
