import { describe, expect, it } from 'vitest';
import { amountInWords } from './numberToWords';

const words = (rupees: number) => amountInWords(Math.round(rupees * 100));

describe('amountInWords', () => {
  it('handles thousands', () => {
    expect(words(1500)).toBe('Indian Rupees One Thousand Five Hundred Only');
    expect(words(25000)).toBe('Indian Rupees Twenty Five Thousand Only');
    expect(words(3250)).toBe('Indian Rupees Three Thousand Two Hundred Fifty Only');
  });

  it('handles lakhs and crores', () => {
    expect(words(125000)).toBe('Indian Rupees One Lakh Twenty Five Thousand Only');
    expect(words(10000000)).toBe('Indian Rupees One Crore Only');
    expect(words(1000000000)).toBe('Indian Rupees One Hundred Crore Only');
  });

  it('handles paise', () => {
    expect(words(125500.5)).toBe(
      'Indian Rupees One Lakh Twenty Five Thousand Five Hundred and Fifty Paise Only',
    );
    expect(words(0.5)).toBe('Indian Rupees Fifty Paise Only');
  });

  it('handles zero', () => {
    expect(words(0)).toBe('Indian Rupees Zero Only');
  });
});
