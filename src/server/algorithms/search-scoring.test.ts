import { describe, expect, it } from 'vitest';
import { buildSearchWhereClause, computeSearchScore, normalizeText, scoreField } from './search-scoring';

describe('search scoring', () => {
  it('normalizes Arabic/Persian characters and digits consistently', () => {
    expect(normalizeText('  آیفون‌ ۱۲۳  ')).toBe('ایفون 123');
    expect(normalizeText('ي ك')).toBe('ی ک');
  });

  it('matches Persian variants through scoreField', () => {
    expect(scoreField('آیفون ۱۲۳', 'ایفون 123')).toBeGreaterThan(0);
  });

  it('gives a brand match meaningful relevance weight', () => {
    const brandScore = computeSearchScore({
      id: '1',
      name: 'Smart Phone',
      brand: 'Apple',
    }, 'Apple');
    const descriptionScore = computeSearchScore({
      id: '2',
      name: 'Smart Phone',
      shortDescription: 'Apple compatible phone',
    }, 'Apple');
    expect(brandScore).toBeGreaterThan(descriptionScore);
  });

  it('requires every token of a multi-word query to match the DB recall clause', () => {
    const where = buildSearchWhereClause('iphone 15');
    expect(where).toHaveProperty('AND');
    expect(Array.isArray((where as { AND?: unknown[] }).AND)).toBe(true);
    expect((where as { AND: unknown[] }).AND).toHaveLength(2);
  });

  it('returns an empty Prisma filter for an empty query', () => {
    expect(buildSearchWhereClause('   ')).toEqual({});
  });
});
