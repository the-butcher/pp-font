import { Feature, MultiPolygon } from "geojson";
import { IProjectableProperties, TProjectableFeature } from 'pp-geom';
import { FacetypeFont } from "./FacetypeFont";
import { FacetypeFontLoader } from "./FacetypeFontLoader";
import { GlyphSetter } from "./GlyphSetter";

export { FacetypeFont, FacetypeFontLoader, GlyphSetter };

export interface IGlyphProperties {
    /**
     * the scale that was applied when the glyph was created
     */
    scale: number;
    /**
     * the character that this instance refers to
     */
    char: string;
    /**
     * horizontal advance
     */
    hadv: number;

    midY: number;
}

export type TGlyphFeature = Feature<MultiPolygon, IGlyphProperties>;

/**
 * definition for types that can place glyphs, i.e. extending from a given position, or along a curved path, ...
 * @author h.fleischer
 * @since 19.05.2025
 */
export interface IGlyphSetter {
    acceptGlyph: (glyphFeature: TGlyphFeature) => void;
    calculateAdv: (glyphFeature: TGlyphFeature) => number;
    getLabel: () => TProjectableFeature<MultiPolygon, IProjectableProperties>; // TODO :: determine if i.e. hatching of characters would be a thing done in the pp-font library itself or in some dedicated style code
}

export type TPredefinedFontName =
    'noto_serif________regular' |
    'noto_serif_________italic' |
    'noto_serif___thin_regular' |
    'noto_serif___thin__italic' |
    'noto_serif_medium_regular' |
    'noto_serif_medium__italic' |
    'noto_serif___bold_regular' |
    'noto_serif___bold__italic';

export interface IFacetypeFont {
    glyphs: { [K in string]: IFacetypeGlyph };
    familyName: string;
    [x: string | number | symbol]: unknown;
    ascender: number;
    descender: number;
    // underlinePosition: number;
    // underlineThickness: number;
    // boundingBox: ITypefaceBBox;
    // resolution: number;
    // cssFontWeight: string;
    // cssFontStyle: string;
    // original_font_information: ITypefaceOriginal;
}

// export interface ITypefaceBBox {
//     yMin: number;
//     xMin: number;
//     yMax: number;
//     xMax: number;
// }

export interface IFacetypeGlyph {
    ha: number;
    // x_min: number;
    // x_max: number;
    o: string;
}

// export interface ITypefaceOriginal {
//     "format": number;
//     "copyright": string;
//     "fontFamily": string;
//     "fontSubfamily": string;
//     "uniqueID": string;
//     "fullName": string;
//     "version": string;
//     "postScriptName": string;
//     "trademark": string;
//     "manufacturer": string;
//     "designer": string;
//     "description": string;
//     "manufacturerURL": string;
//     "designerURL": string;
//     "licence": string;
//     "licenceURL": string;
// }