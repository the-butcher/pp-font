import { describe, expect, test } from '@jest/globals';
import { FacetypeFont } from './FacetypeFont';

describe('facetype font', () => {

  test('resolves font instance', async () => {

    const fontInstanceA = await FacetypeFont.getInstance('Noto Serif Thin', 10);
    const fontInstanceB = await FacetypeFont.getInstance('Noto Serif Thin', 10);

    expect(fontInstanceA).toBeDefined();
    expect(fontInstanceB).toBeDefined();

    expect(fontInstanceA.getName()).toBe("Noto Serif Thin");
    expect(fontInstanceB.getName()).toBe("Noto Serif Thin");

    expect(fontInstanceA.getId()).toBe(fontInstanceB.getId());
    expect(fontInstanceA.getScale()).toBe(fontInstanceB.getScale());

  });

  test('resolves char instances', async () => {

    const fontInstance = await FacetypeFont.getInstance('Noto Serif Thin', 10);

    const charMultiPolygon0 = fontInstance.getCharMultiPolygon('a');
    const charMultiPolygon1 = fontInstance.getCharMultiPolygon('b');
    const charMultiPolygon2 = fontInstance.getCharMultiPolygon('a');

    expect(charMultiPolygon0).toBeDefined();

  });

});