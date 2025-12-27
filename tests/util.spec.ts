import { expect, test } from 'vitest'

import { updateMinMax } from '../src/util'

test('single value should have same value for min and max', async () => {
  const accMinMax = { field: { min: Infinity, max: -Infinity } }
  updateMinMax(accMinMax, { field: 0 })

  expect(accMinMax).toMatchObject({ field: { min: 0, max: 0 } })
})
