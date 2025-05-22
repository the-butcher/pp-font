import { describe, expect, test } from '@jest/globals';
import { FacetypeFont } from './FacetypeFont';

describe('facetype font', () => {

  test('resolves font instance', async () => {

    const fontInstanceA = await FacetypeFont.getInstance('noto_serif___thin_regular', 10);
    const fontInstanceB = await FacetypeFont.getInstance('noto_serif___thin_regular', 10);

    expect(fontInstanceA).toBeDefined();
    expect(fontInstanceB).toBeDefined();

    expect(fontInstanceA.getName()).toBe("noto_serif___thin_regular");
    expect(fontInstanceB.getName()).toBe("noto_serif___thin_regular");

    expect(fontInstanceA.getId()).toBe(fontInstanceB.getId());
    expect(fontInstanceA.getScale()).toBe(fontInstanceB.getScale());

  });

  test('resolves char instances', async () => {

    const fontInstance = await FacetypeFont.getInstance('noto_serif___thin_regular', 10);

    const charMultiPolygon0 = fontInstance.getCharMultiPolygon('a');
    const charMultiPolygon1 = fontInstance.getCharMultiPolygon('b');
    const charMultiPolygon2 = fontInstance.getCharMultiPolygon('a');

    expect(charMultiPolygon0).toBeDefined();

  });

});