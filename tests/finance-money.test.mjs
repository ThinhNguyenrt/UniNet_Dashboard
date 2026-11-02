import test from 'node:test';
import assert from 'node:assert/strict';
import { moneyText, refundableVnd } from '../src/utils/finance-money.ts';
test('financial text keeps amounts beyond JS integer precision exact', () => {
  assert.equal(moneyText('9007199254740993'), '9.007.199.254.740.993 ₫');
  assert.equal(moneyText('1234.50'), '1.234,5 ₫');
  assert.equal(refundableVnd('9007199254740993', '1'), '9007199254740992');
  assert.equal(refundableVnd('10.50', '0.75'), '9');
});
