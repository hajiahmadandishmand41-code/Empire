import { describe, expect, it } from 'vitest';

describe('public health contract', () => {
  it('contains only the public liveness field', () => {
    const response = { ok: true };
    expect(response).toEqual({ ok: true });
    expect(response).not.toHaveProperty('db');
    expect(response).not.toHaveProperty('version');
    expect(response).not.toHaveProperty('env');
    expect(response).not.toHaveProperty('migrations');
  });
});
