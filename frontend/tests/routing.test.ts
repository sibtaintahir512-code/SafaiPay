import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDashboardPath } from '../lib/api';
import { UserRole } from '../lib/types';

describe('SafaiPay Routing and Role Guardrails', () => {
  it('correctly maps customer to /customer/dashboard', () => {
    assert.equal(getDashboardPath('customer'), '/customer/dashboard');
  });

  it('correctly maps collector to /collector/dashboard', () => {
    assert.equal(getDashboardPath('collector'), '/collector/dashboard');
  });

  it('correctly maps recycler to /recycler/dashboard', () => {
    assert.equal(getDashboardPath('recycler'), '/recycler/dashboard');
  });

  it('correctly maps admin to /admin/dashboard', () => {
    assert.equal(getDashboardPath('admin'), '/admin/dashboard');
  });

  it('routes unknown role to /onboarding', () => {
    assert.equal(getDashboardPath('unknown' as UserRole), '/onboarding');
  });
});
