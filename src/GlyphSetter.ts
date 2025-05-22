import { along as turf_along } from '@turf/along';
import { length as turf_length } from '@turf/length';
import { LineString, MultiPolygon, Point, Position } from "geojson";
import { IProjectableProperties, PPProjection, PPTransformation, TProjectableFeature } from "pp-geom";
import { IGlyphSetter, TGlyphFeature } from ".";

export class GlyphSetter implements IGlyphSetter {

    /**
     * place glyphs along a horizontal line extending from the given position
     * position must be in WGS84/EPSG:4326
     * @param position4326
     * @returns
     */
    static fromPosition(position: TProjectableFeature<Point, IProjectableProperties>, adv: number = 1): IGlyphSetter {
        const coordinates: Position[] = [position.geometry.coordinates];
        for (let i = 0; i < 100; i++) {
            coordinates.push([
                position.geometry.coordinates[0] + i / 100,
                position.geometry.coordinates[1]
            ]);
        };
        return new GlyphSetter({
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates
            },
            properties: {
                ...position.properties
            }
        }, adv);
    }

    static alongLabelLine(labelLine: TProjectableFeature<LineString, IProjectableProperties>, adv: number = 1): IGlyphSetter {
        return new GlyphSetter(labelLine, adv);
    }

    /**
     * the line along which the label should be placed
     */
    private readonly labelLine: TProjectableFeature<LineString, IProjectableProperties>;

    /**
     * length of the label line in proj units
     */
    private readonly labelLineLength: number;

    private readonly adv: number;

    private labelMultiPolygon: MultiPolygon;

    /**
     * current distance in meters along the label-line
     */
    private distance: number;

    private constructor(labelLine: TProjectableFeature<LineString, IProjectableProperties>, adv: number) {
        this.labelLine = PPProjection.projectFeature(labelLine, '4326'); // be sure the label-line is in WGS84/EPSG:4326
        this.adv = adv;
        this.labelLineLength = turf_length(labelLine, {
            units: labelLine.properties.unitName
        });
        this.distance = 0;
        this.labelMultiPolygon = {
            type: 'MultiPolygon',
            coordinates: []
        };
    }

    acceptGlyph(glyphFeature: TGlyphFeature): void {

        // find current position along label line in label line units
        const labelPoint4326A = turf_along(this.labelLine, this.distance, {
            units: this.labelLine.properties.unitName
        }).geometry;
        // find advance position along label line in label line units
        let labelPoint4326B = turf_along(this.labelLine, this.distance + glyphFeature.properties.hadv, {
            units: this.labelLine.properties.unitName
        }).geometry;
        // convert both positions to proj-cs
        const labelPointProjA = PPProjection.projectGeometry(labelPoint4326A, this.labelLine.properties.projectors['proj']);
        let labelPointProjB = PPProjection.projectGeometry(labelPoint4326B, this.labelLine.properties.projectors['proj']);

        // const distD = Math.sqrt((labelPoint4326B.coordinates[0] - labelPoint4326A.coordinates[0]) ** 2 + (labelPoint4326B.coordinates[1] - labelPoint4326A.coordinates[1]) ** 2);
        const distM = Math.sqrt((labelPointProjB.coordinates[0] - labelPointProjA.coordinates[0]) ** 2 + (labelPointProjB.coordinates[1] - labelPointProjA.coordinates[1]) ** 2);
        const distR = glyphFeature.properties.hadv / distM;

        // find advance position along label line in label line units
        this.distance += glyphFeature.properties.hadv * distR * this.adv;
        labelPoint4326B = turf_along(this.labelLine, this.distance, {
            units: this.labelLine.properties.unitName
        }).geometry;
        // convert both positions to proj-cs
        labelPointProjB = PPProjection.projectGeometry(labelPoint4326B, this.labelLine.properties.projectors['proj']);

        // calculate angle between position
        const angle = Math.atan2(labelPointProjB.coordinates[1] - labelPointProjA.coordinates[1], labelPointProjB.coordinates[0] - labelPointProjA.coordinates[0]);

        // recalculate with corrected distance
        // calculate matrix for char transformation

        const matrixB = PPTransformation.matrixTranslationInstance(labelPointProjA.coordinates[0], labelPointProjA.coordinates[1]);
        const matrixC = PPTransformation.matrixRotationInstance(angle);
        const matrixD = PPTransformation.matrixTranslationInstance(0, -glyphFeature.properties.midY);

        // transform and add
        const transformedGlyphCoordinates = PPTransformation.transformPosition3(glyphFeature.geometry.coordinates, PPTransformation.matrixMultiply(matrixB, matrixC, matrixD)); //
        this.labelMultiPolygon.coordinates.push(...transformedGlyphCoordinates);

    }

    getLabel(): TProjectableFeature<MultiPolygon, IProjectableProperties> {

        const label: TProjectableFeature<MultiPolygon, IProjectableProperties> = {
            type: 'Feature',
            geometry: this.labelMultiPolygon,
            properties: {
                ...this.labelLine.properties,
                projType: 'proj'
            }
        };
        return PPProjection.projectFeature(label, '4326');

    }

}