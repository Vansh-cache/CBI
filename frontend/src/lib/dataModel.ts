/**
 * Semantic Data Model for Power BI-style analytics
 * Separates dimensions (categorical) from measures (numeric aggregations)
 */

export type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'countDistinct' | 'first' | 'last';
export type FieldType = 'dimension' | 'measure';

export interface DataField {
    name: string;
    type: FieldType;
    dataType: 'string' | 'number' | 'date' | 'boolean';
    aggregation?: AggregationType;
    format?: string; // e.g., "$0,0.00" for currency
}

export interface Measure {
    id: string;
    name: string;
    field: string;
    aggregation: AggregationType;
    format?: string;
    expression?: string; // For calculated measures (future)
}

export interface Dimension {
    id: string;
    name: string;
    field: string;
    hierarchyLevel?: number; // For drill-down paths
    parentDimension?: string; // For hierarchies
}

export interface DatasetModel {
    datasetId: number;
    name: string;
    dimensions: Dimension[];
    measures: Measure[];
    relationships?: DataRelationship[]; // For future multi-table support
}

export interface DataRelationship {
    fromDataset: number;
    fromField: string;
    toDataset: number;
    toField: string;
    cardinality: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

/**
 * Infer field type from data sample
 */
export function inferFieldType(values: unknown[]): 'string' | 'number' | 'date' | 'boolean' {
    const sample = values.filter(v => v != null).slice(0, 100);
    if (sample.length === 0) return 'string';

    let numCount = 0;
    let dateCount = 0;
    let boolCount = 0;

    for (const val of sample) {
        if (typeof val === 'number') {
            numCount++;
        } else if (typeof val === 'boolean') {
            boolCount++;
        } else if (val instanceof Date) {
            dateCount++;
        } else {
            const str = String(val);
            // Check if it's a date string
            const d = new Date(str);
            if (!isNaN(d.getTime()) && str.match(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
                dateCount++;
            }
            // Check if it's a number string
            else if (!isNaN(Number(str)) && str.trim() !== '') {
                numCount++;
            }
        }
    }

    const total = sample.length;
    if (boolCount / total > 0.8) return 'boolean';
    if (dateCount / total > 0.6) return 'date';
    if (numCount / total > 0.8) return 'number';
    return 'string';
}

/**
 * Auto-detect dimensions and measures from dataset
 */
export function inferDataModel(
    datasetId: number,
    datasetName: string,
    data: any[],
    schema?: { name: string; type: string }[]
): DatasetModel {
    if (!data || data.length === 0) {
        return {
            datasetId,
            name: datasetName,
            dimensions: [],
            measures: [],
        };
    }

    const dimensions: Dimension[] = [];
    const measures: Measure[] = [];

    const firstRow = data[0];
    const fields = Object.keys(firstRow);

    fields.forEach((field) => {
        const values = data.map(row => row[field]);
        const dataType = inferFieldType(values);
        const schemaType = schema?.find(s => s.name === field)?.type;

        // Numeric fields become measures, others become dimensions
        if (dataType === 'number' && schemaType !== 'id') {
            measures.push({
                id: `${datasetId}_${field}_sum`,
                name: `Sum of ${field}`,
                field,
                aggregation: 'sum',
            });
            measures.push({
                id: `${datasetId}_${field}_avg`,
                name: `Average of ${field}`,
                field,
                aggregation: 'avg',
            });
            measures.push({
                id: `${datasetId}_${field}_min`,
                name: `Min of ${field}`,
                field,
                aggregation: 'min',
            });
            measures.push({
                id: `${datasetId}_${field}_max`,
                name: `Max of ${field}`,
                field,
                aggregation: 'max',
            });
        } else {
            dimensions.push({
                id: `${datasetId}_${field}`,
                name: field,
                field,
            });
        }
    });

    // Add count measure (always available)
    measures.push({
        id: `${datasetId}_count`,
        name: 'Count of Rows',
        field: '*',
        aggregation: 'count',
    });

    return {
        datasetId,
        name: datasetName,
        dimensions,
        measures,
    };
}

/**
 * Apply aggregation to data
 */
export function applyAggregation(
    data: any[],
    measure: Measure,
    groupByFields?: string[]
): any[] {
    if (!data || data.length === 0) return [];

    // If no grouping, return single aggregated value
    if (!groupByFields || groupByFields.length === 0) {
        const value = aggregateValues(data, measure);
        return [{ [measure.name]: value }];
    }

    // Group by dimensions
    const groups = new Map<string, any[]>();

    data.forEach(row => {
        const key = groupByFields.map(f => String(row[f] ?? '')).join('|');
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(row);
    });

    // Aggregate each group
    const result: any[] = [];
    groups.forEach((groupData, key) => {
        const keyParts = key.split('|');
        const row: any = {};

        groupByFields.forEach((field, idx) => {
            row[field] = groupData[0][field]; // Use first value for dimension
        });

        row[measure.name] = aggregateValues(groupData, measure);
        result.push(row);
    });

    return result;
}

/**
 * Aggregate values based on measure definition
 */
function aggregateValues(data: any[], measure: Measure): number {
    if (data.length === 0) return 0;

    const { field, aggregation } = measure;

    switch (aggregation) {
        case 'count':
            return data.length;

        case 'countDistinct':
            if (field === '*') return data.length;
            const uniqueValues = new Set(data.map(row => row[field]));
            return uniqueValues.size;

        case 'sum':
            return data.reduce((acc, row) => acc + (Number(row[field]) || 0), 0);

        case 'avg': {
            const sum = data.reduce((acc, row) => acc + (Number(row[field]) || 0), 0);
            return sum / data.length;
        }

        case 'min': {
            const values = data.map(row => Number(row[field])).filter(v => !isNaN(v));
            return values.length > 0 ? Math.min(...values) : 0;
        }

        case 'max': {
            const values = data.map(row => Number(row[field])).filter(v => !isNaN(v));
            return values.length > 0 ? Math.max(...values) : 0;
        }

        case 'first':
            return Number(data[0][field]) || 0;

        case 'last':
            return Number(data[data.length - 1][field]) || 0;

        default:
            return 0;
    }
}

/**
 * Format value based on measure format
 */
export function formatMeasureValue(value: number, format?: string): string {
    if (format) {
        // Simple format parsing (can be extended)
        if (format.startsWith('$')) {
            return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (format.includes('%')) {
            return `${(value * 100).toFixed(1)}%`;
        }
        if (format.includes(',')) {
            return value.toLocaleString();
        }
    }

    return value.toLocaleString();
}
