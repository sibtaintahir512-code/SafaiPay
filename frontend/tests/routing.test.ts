import { getDashboardPath } from '../lib/api';
import { UserRole } from '../lib/types';

describe('SafaiPay Routing and Role Guardrails', () => {
  it('correctly maps customer to /customer/dashboard', () => {
    expect(getDashboardPath('customer')).toBe('/customer/dashboard');
  });

  it('correctly maps collector to /collector/dashboard', () => {
    expect(getDashboardPath('collector')).toBe('/collector/dashboard');
  });

  it('correctly maps recycler to /recycler/dashboard', () => {
    expect(getDashboardPath('recycler')).toBe('/recycler/dashboard');
  });

  it('correctly maps admin to /admin/dashboard', () => {
    expect(getDashboardPath('admin')).toBe('/admin/dashboard');
  });

  it('routes unknown role to /onboarding', () => {
    expect(getDashboardPath('unknown' as UserRole)).toBe('/onboarding');
  });
});
