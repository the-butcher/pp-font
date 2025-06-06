import * as turf from '@turf/boolean-clockwise';
import { MultiPolygon, Position } from 'geojson';
import * as path from 'svg-path-properties';
import { Point } from 'svg-path-properties/dist/types/types';
import { IFacetypeFont, IGlyphSetter, TGlyphFeature, TPredefinedFontName } from '.';
import { FacetypeFontLoader } from './FacetypeFontLoader';
import { simplify as turf_simplify } from '@turf/simplify';

export class FacetypeFont {

    private static PREDEFINED_FONT_PROVIDERS: { [K in TPredefinedFontName]: () => Promise<IFacetypeFont> } = {
        'noto_serif________regular': () => new FacetypeFontLoader().load('/noto_serif________regular.json'),
        'noto_serif_________italic': () => new FacetypeFontLoader().load('/noto_serif_________italic.json'),
        'noto_serif___thin_regular': () => new FacetypeFontLoader().load('/noto_serif___thin_regular.json'),
        'noto_serif___thin__italic': () => new FacetypeFontLoader().load('/noto_serif___thin__italic.json'),
        'noto_serif_medium_regular': () => new FacetypeFontLoader().load('/noto_serif_medium_regular.json'),
        'noto_serif_medium__italic': () => new FacetypeFontLoader().load('/noto_serif_medium__italic.json'),
        'noto_serif___bold_regular': () => new FacetypeFontLoader().load('/noto_serif___bold_regular.json'),
        'noto_serif___bold__italic': () => new FacetypeFontLoader().load('/noto_serif___bold__italic.json'),
    };

    private static FONT_INSTANCES: { [K: string]: FacetypeFont[] } = {
        // empty initially
    };

    public static async getInstance(name: TPredefinedFontName, scale: number): Promise<FacetypeFont> {
        if (!this.FONT_INSTANCES[name]) {
            this.FONT_INSTANCES[name] = [];
        }
        let fontInstance = this.FONT_INSTANCES[name]?.find(f => f.scale === scale);
        if (fontInstance) {
            return fontInstance;
        } else {
            const fontDef = await this.PREDEFINED_FONT_PROVIDERS[name]();
            fontInstance = new FacetypeFont(fontDef, scale);
            this.FONT_INSTANCES[name].push(fontInstance);
            return fontInstance;
        }
    }

    private id: string;
    private facetype: IFacetypeFont;
    private scale: number;

    private glyphFeaturesProj: { [K: string]: TGlyphFeature };

    private constructor(facetype: IFacetypeFont, scale: number) {
        this.id = Math.ceil((Math.random() + 10) * Date.now()).toString(16).padStart(16, '0'); // .substring(0, 16);
        this.facetype = facetype;
        this.scale = scale;
        this.glyphFeaturesProj = {};
    }

    public getId(): string {
        return this.id;
    }

    public getName(): string {
        return this.facetype.familyName;
    }

    getScale(): number {
        return this.scale;
    }

    getMidY(): number {
        return this.facetype.ascender * this.scale * 0.5 + this.facetype.descender * this.scale;
    }

    /**
     * creates text geometry for the given label
     * @param label
     * @param glyphSetter
     * @returns
     */
    getLabel(label: string, glyphSetter: IGlyphSetter): MultiPolygon {

        const chars = Array.from(label);
        let glyphFeatureProj: TGlyphFeature;
        for (let i = 0; i < chars.length; i++) {
            glyphFeatureProj = this.getGlyph(chars[i]);
            glyphSetter.acceptGlyph(glyphFeatureProj);
        }
        return glyphSetter.getLabel().geometry;

    }

    getLength(label: string, glyphSetter: IGlyphSetter): number {

        const chars = Array.from(label);
        let glyphFeatureProj: TGlyphFeature;
        let length = 0;
        for (let i = 0; i < chars.length; i++) {
            glyphFeatureProj = this.getGlyph(chars[i]);
            length += glyphSetter.calculateAdv(glyphFeatureProj);
        }
        return length;

    }

    /**
     * glyph parsing as of https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/FontLoader.js
     * @param char must be
     * @param charOffset
     */
    getGlyph(char: string): TGlyphFeature {

        let glyphFeatureProj = this.glyphFeaturesProj[char];
        if (glyphFeatureProj) {

            return glyphFeatureProj;

        } else {

            const coordinates: Position[][][] = [];

            // if (char === '\n') {
            //     return {
            //         type: 'MultiPolygon',
            //         coordinates
            //     };
            // }

            const facetypeGlyph = this.facetype.glyphs[char] ?? this.facetype.glyphs['?'];

            const glyphData = facetypeGlyph.o;
            const glyphCommands = glyphData.split(' ');

            let x, y, cpx, cpy, cpx1, cpy1, cpx2, cpy2: number;
            let pathData = '';
            for (let i = 0, l = glyphCommands.length; i < l;) {

                const action = glyphCommands[i++];
                if (action === 'm') {

                    if (pathData !== '') {
                        const ringCoordinates = this.getCoordinates(pathData);
                        if (turf.booleanClockwise(ringCoordinates)) { // an outer ring
                            coordinates.push([]);
                        }
                        coordinates[coordinates.length - 1].push(ringCoordinates);
                        pathData = '';
                    }

                    x = parseInt(glyphCommands[i++]) * this.scale;
                    y = -parseInt(glyphCommands[i++]) * this.scale;

                    pathData = `${pathData}M${x} ${y}`;

                } else if (action === 'l') {

                    x = parseInt(glyphCommands[i++]) * this.scale;
                    y = -parseInt(glyphCommands[i++]) * this.scale;

                    pathData = `${pathData}L${x} ${y}`;

                } else if (action === 'q') {

                    cpx = parseInt(glyphCommands[i++]) * this.scale;
                    cpy = -parseInt(glyphCommands[i++]) * this.scale;
                    cpx1 = parseInt(glyphCommands[i++]) * this.scale;
                    cpy1 = -parseInt(glyphCommands[i++]) * this.scale;

                    pathData = `${pathData}Q${cpx1} ${cpy1} ${cpx} ${cpy}`;

                } else if (action === 'b') {

                    cpx = parseInt(glyphCommands[i++]) * this.scale;
                    cpy = -parseInt(glyphCommands[i++]) * this.scale;
                    cpx1 = parseInt(glyphCommands[i++]) * this.scale;
                    cpy1 = -parseInt(glyphCommands[i++]) * this.scale;
                    cpx2 = parseInt(glyphCommands[i++]) * this.scale;
                    cpy2 = -parseInt(glyphCommands[i++]) * this.scale;

                    pathData = `${pathData}Q${cpx1} ${cpy1} ${cpx2} ${cpy2} ${cpx} ${cpy}`;

                } else if (action === 'z') {

                    const ringCoordinates = this.getCoordinates(pathData);
                    if (turf.booleanClockwise(ringCoordinates)) { // an outer ring
                        coordinates.push([]);
                    }
                    coordinates[coordinates.length - 1].push(ringCoordinates);

                }

            }

            const geometry: MultiPolygon = {
                type: 'MultiPolygon',
                coordinates
            };

            turf_simplify(geometry, {
                tolerance: this.scale * 2,
                highQuality: true,
                mutate: true
            });

            // const minX = 0;
            // const minY = 0;
            // const maxX = facetypeGlyph.ha * this.scale;
            // const maxY = this.scale * 1000;
            // const valid = true;

            // if (valid) {
            //     const bbCoordinates: Position[] = [];
            //     bbCoordinates.push([
            //         minX, minY
            //     ]);
            //     bbCoordinates.push([
            //         minX, maxY
            //     ]);
            //     bbCoordinates.push([
            //         maxX, maxY
            //     ]);
            //     bbCoordinates.push([
            //         maxX, minY
            //     ]);
            //     bbCoordinates.push([
            //         minX, minY
            //     ]);
            //     geometry.coordinates.push([[...bbCoordinates.reverse()]]);
            // }

            // console.log(char, maxY - minY, this.scale);

            const midY = this.getMidY();

            glyphFeatureProj = {
                type: 'Feature',
                geometry,
                properties: {
                    scale: this.scale,
                    hadv: facetypeGlyph.ha * this.scale,
                    char,
                    midY
                }
            };
            this.glyphFeaturesProj[char] = glyphFeatureProj;
            return glyphFeatureProj;

        }

    }

    private getCoordinates(pathData: string): Position[] {

        const svgPathElement = new path.svgPathProperties(pathData);

        const pathLength = svgPathElement.getTotalLength();
        const pathSegmts = Math.ceil(pathLength / (25 * this.scale));
        const segmtLength = pathLength / pathSegmts;

        let pointAtLength: Point;
        const coordinates: Position[] = [];
        for (let i = 0; i <= pathSegmts; i++) {
            pointAtLength = svgPathElement.getPointAtLength(i * segmtLength);
            coordinates.push([
                pointAtLength.x,
                pointAtLength.y * -1
            ]);
        }

        return coordinates;

    }

}