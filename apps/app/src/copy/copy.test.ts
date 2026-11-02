import { describe, expect, it } from 'vitest';
import { copy } from './index';

describe('copy deck', () => {
  it('has updated brand identity to What Does The Law Say', () => {
    expect(copy.productName).toBe('What Does The Law Say');
    expect(copy.scenario.title).toBe('What Does The Law Say');
    expect(copy.scenario.description).toBe(
      'Describe a situation and see what the law says',
    );
  });

  it('matches copy snapshot', () => {
    expect(copy).toMatchSnapshot();
  });
});
