import * as React from 'react'
import { Box, Text } from 'ink'

const HelpBar: React.FC = () => {
  return React.createElement(
    Box,
    { marginTop: 1 },
    React.createElement(
      Text,
      { dimColor: true },
      '[\u2191\u2193] navegar  [enter] abrir  [n] novo  [d] deletar  [r] refresh  [q] sair'
    )
  )
}

export default HelpBar
