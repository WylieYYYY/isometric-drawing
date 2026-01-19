import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import App from '../src/App'

import '../src/main.scss'

test('app initial render looks correct', async () => {
  await render(
    <div id='root' data-testid='root'>
      <App />
    </div>
  )
  await expect(document.getElementById('root')).toMatchScreenshot()
})
