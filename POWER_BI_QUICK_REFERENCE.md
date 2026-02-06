# Power BI Enhancement - Quick Reference

## 🚀 Quick Start

### 1. Wrap Your App
```tsx
import { CrossFilterProvider } from './contexts/CrossFilterContext';

<CrossFilterProvider>
  <YourDashboard />
</CrossFilterProvider>
```

### 2. Use Cross-Filtering
```tsx
import { useCrossFilter } from './contexts/CrossFilterContext';

const { addCrossFilter, getCrossFiltersForWidget } = useCrossFilter();

// Add filter on click
const handleClick = (field: string, value: any) => {
  addCrossFilter({
    id: `filter-${Date.now()}`,
    sourceWidgetId: widget.id,
    field,
    values: [value],
    operator: 'in',
    timestamp: Date.now(),
  });
};

// Get filtered data
const filters = getCrossFiltersForWidget(widget.id);
const filteredData = applyCrossFilters(rawData, filters);
```

### 3. Enable Drill-Down
```tsx
import { drillManager } from './lib/drillManager';

// Start drill mode
drillManager.startDrillDown(widgetId, 'date-hierarchy');

// Drill down on click
drillManager.drillDown(widgetId, clickedValue);

// Drill up
drillManager.drillUp(widgetId);

// Get current level field
const currentField = drillManager.getCurrentLevelField(widgetId);
```

---

## 📦 Core Imports

```tsx
// Data Model
import { 
  inferDataModel, 
  applyAggregation, 
  formatMeasureValue 
} from './lib/dataModel';

// Cross-Filtering
import { 
  crossFilterEngine, 
  applyCrossFilters, 
  applyFilterContext,
  createFilterContext 
} from './lib/crossFilterEngine';

// Drill-Down
import { 
  drillManager, 
  applyDrillFilters,
  enrichWithDateHierarchy 
} from './lib/drillManager';

// Context
import { useCrossFilter } from './contexts/CrossFilterContext';

// Components
import VisualInteractionControls from './components/developer/VisualInteractionControls';
import DrillControls from './components/developer/DrillControls';
```

---

## 🎯 Common Patterns

### Pattern 1: Cross-Filter Between Charts

```tsx
// In your widget component
const { addCrossFilter, getCrossFiltersForWidget } = useCrossFilter();

// Handle chart click
const handleChartClick = (dataPoint: any) => {
  addCrossFilter({
    id: `filter-${Date.now()}`,
    sourceWidgetId: widget.id,
    field: 'category',
    values: [dataPoint.category],
    operator: 'in',
    timestamp: Date.now(),
  });
};

// Apply filters to data
const filters = getCrossFiltersForWidget(widget.id);
const filteredData = applyCrossFilters(rawData, filters);

// Render with filtered data
return <Chart data={filteredData} onClick={handleChartClick} />;
```

### Pattern 2: Date Hierarchy Drill

```tsx
// Enable date drill
const enableDateDrill = () => {
  drillManager.startDrillDown(widget.id, 'date-hierarchy');
  updateWidget({ drillPathId: 'date-hierarchy', allowDrillDown: true });
};

// Handle drill click
const handleDrillClick = (value: any) => {
  if (drillManager.canDrillDown(widget.id)) {
    drillManager.drillDown(widget.id, value);
  }
};

// Get current level field
const currentField = drillManager.getCurrentLevelField(widget.id) || 'year';

// Apply drill filters
const drillFilters = drillManager.getDrillFilters(widget.id);
const drilledData = applyDrillFilters(filteredData, drillFilters);

// Render
return (
  <Chart 
    data={drilledData} 
    xAxis={currentField}
    onClick={handleDrillClick}
  />
);
```

### Pattern 3: Global Slicer

```tsx
const { addSlicerFilter, slicerFilters } = useCrossFilter();

// Handle slicer change
const handleSlicerChange = (value: string, selected: boolean) => {
  const existingFilter = slicerFilters.find(f => f.field === 'region');
  
  if (existingFilter) {
    updateSlicerFilter(existingFilter.id, {
      values: selected 
        ? [...(existingFilter.values || []), value]
        : (existingFilter.values || []).filter(v => v !== value)
    });
  } else {
    addSlicerFilter({
      id: `slicer-${Date.now()}`,
      field: 'region',
      level: 'report',
      type: 'basic',
      operator: 'in',
      values: [value],
      isEnabled: true,
    });
  }
};

// Slicer filters automatically apply to all widgets
```

### Pattern 4: Complete Filter Stack

```tsx
const {
  crossFilters,
  slicerFilters,
  pageFilters,
  reportFilters,
} = useCrossFilter();

// Create filter context
const filterContext = createFilterContext(
  crossFilters,
  slicerFilters,
  pageFilters,
  reportFilters
);

// Apply all filters
const filteredData = applyFilterContext(rawData, filterContext, widget.id);

// Apply drill filters if in drill mode
let finalData = filteredData;
if (widget.drillPathId) {
  const drillFilters = drillManager.getDrillFilters(widget.id);
  finalData = applyDrillFilters(filteredData, drillFilters);
}

// Render
return <Chart data={finalData} />;
```

---

## 🎨 UI Integration

### Add Controls to Toolbar

```tsx
const [showInteractions, setShowInteractions] = useState(false);
const [showDrill, setShowDrill] = useState(false);

<Toolbar>
  <button onClick={() => setShowInteractions(true)}>
    <Settings /> Visual Interactions
  </button>
  
  <button onClick={() => setShowDrill(true)}>
    <Layers /> Drill Controls
  </button>
  
  <button onClick={clearAllFilters}>
    <X /> Clear Filters
  </button>
</Toolbar>

{showInteractions && (
  <VisualInteractionControls
    widgets={widgets}
    selectedWidgetId={selectedWidgetId}
    onSetInteraction={setInteraction}
    onGetInteraction={getInteraction}
    onClose={() => setShowInteractions(false)}
    isDark={isDark}
    colors={colors}
  />
)}

{showDrill && (
  <DrillControls
    widgets={widgets}
    selectedWidgetId={selectedWidgetId}
    onDrillDown={(id, val) => drillManager.drillDown(id, val)}
    onDrillUp={(id) => drillManager.drillUp(id)}
    onResetDrill={(id) => drillManager.resetDrill(id)}
    onStartDrill={(id, path) => drillManager.startDrillDown(id, path)}
    onClose={() => setShowDrill(false)}
    isDark={isDark}
    colors={colors}
  />
)}
```

### Filter Indicator

```tsx
const { crossFilters, clearAllCrossFilters } = useCrossFilter();

{crossFilters.length > 0 && (
  <div className="filter-indicator">
    <Filter className="w-4 h-4" />
    {crossFilters.length} active filter{crossFilters.length > 1 ? 's' : ''}
    <button onClick={clearAllCrossFilters}>
      <X className="w-3 h-3" />
    </button>
  </div>
)}
```

---

## 🔧 Widget Configuration

### Extended Widget Schema

```tsx
interface Widget {
  // Existing fields
  id: string;
  type: string;
  title: string;
  datasetId?: number;
  
  // Legacy aggregation (still supported)
  field?: string;
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'first' | 'last' | 'percentage';
  
  // Power BI enhancements
  measures?: string[];           // ['sales_sum', 'quantity_avg']
  dimensions?: string[];         // ['category', 'region']
  drillPathId?: string;          // 'date-hierarchy'
  interactionMode?: 'filter' | 'highlight' | 'none';
  allowDrillDown?: boolean;
  allowDrillThrough?: boolean;
  drillThroughTarget?: string;   // 'detail-table-widget-id'
  
  // Styling
  showDataLabels?: boolean;
  showLegend?: boolean;
  showGridLines?: boolean;
  locked?: boolean;
}
```

---

## 📊 Data Model Usage

### Infer Data Model

```tsx
import { inferDataModel } from './lib/dataModel';

const dataModel = inferDataModel(
  datasetId,
  'Sales Data',
  rawData,
  schema
);

// Access dimensions
dataModel.dimensions.forEach(dim => {
  console.log(`Dimension: ${dim.name} (${dim.field})`);
});

// Access measures
dataModel.measures.forEach(measure => {
  console.log(`Measure: ${measure.name} - ${measure.aggregation}`);
});
```

### Apply Aggregation

```tsx
import { applyAggregation } from './lib/dataModel';

const measure = {
  id: 'sales_sum',
  name: 'Total Sales',
  field: 'sales',
  aggregation: 'sum' as const,
};

// Aggregate without grouping
const total = applyAggregation(data, measure);
// Returns: [{ 'Total Sales': 150000 }]

// Aggregate with grouping
const byCategory = applyAggregation(data, measure, ['category']);
// Returns: [
//   { category: 'Electronics', 'Total Sales': 50000 },
//   { category: 'Clothing', 'Total Sales': 30000 },
//   ...
// ]
```

---

## 🎯 Aggregation Types

| Type | Description | Example |
|------|-------------|---------|
| `count` | Count rows | 1,234 |
| `sum` | Sum values | $150,000 |
| `avg` | Average values | $1,234.56 |
| `min` | Minimum value | $10.00 |
| `max` | Maximum value | $5,000.00 |
| `countDistinct` | Count unique values | 42 |
| `first` | First value | Electronics |
| `last` | Last value | Clothing |

---

## 🔄 Interaction Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| `filter` | Filters target data | Default, most common |
| `highlight` | Highlights related data | Compare subsets |
| `none` | No interaction | Independent visuals |

---

## 📁 Drill Paths

### Built-in Paths

```tsx
// Date Hierarchy
'date-hierarchy'
  Year → Quarter → Month → Day

// Geography Hierarchy
'geography-hierarchy'
  Country → Region → City

// Product Hierarchy
'product-hierarchy'
  Category → Subcategory → Product
```

### Custom Drill Path

```tsx
import { drillManager } from './lib/drillManager';

drillManager.registerDrillPath({
  id: 'custom-hierarchy',
  name: 'Custom Hierarchy',
  levels: [
    { field: 'level1', displayName: 'Level 1', order: 0 },
    { field: 'level2', displayName: 'Level 2', order: 1 },
    { field: 'level3', displayName: 'Level 3', order: 2 },
  ],
});
```

---

## ⚡ Performance Tips

1. **Memoize filtered data**:
   ```tsx
   const filteredData = useMemo(() => 
     applyCrossFilters(rawData, filters),
     [rawData, filters]
   );
   ```

2. **Debounce filter updates**:
   ```tsx
   const debouncedAddFilter = useMemo(
     () => debounce(addCrossFilter, 100),
     [addCrossFilter]
   );
   ```

3. **Cache aggregations**:
   ```tsx
   // Already built into applyAggregation
   ```

4. **Use React.memo for widgets**:
   ```tsx
   const MemoizedWidget = React.memo(Widget, (prev, next) =>
     prev.data === next.data && prev.filters === next.filters
   );
   ```

---

## 🐛 Debugging

### Check Filter State

```tsx
const { crossFilters } = useCrossFilter();
console.log('Active filters:', crossFilters);
```

### Check Drill State

```tsx
const drillState = drillManager.getDrillState(widgetId);
console.log('Drill state:', drillState);
console.log('Can drill down:', drillManager.canDrillDown(widgetId));
console.log('Can drill up:', drillManager.canDrillUp(widgetId));
```

### Check Data Model

```tsx
const dataModel = inferDataModel(datasetId, name, data);
console.log('Dimensions:', dataModel.dimensions);
console.log('Measures:', dataModel.measures);
```

---

## 📚 Full Documentation

- **Implementation Guide**: `POWER_BI_ENHANCEMENT_GUIDE.md`
- **Summary**: `POWER_BI_ENHANCEMENT_SUMMARY.md`
- **This Quick Reference**: `POWER_BI_QUICK_REFERENCE.md`

---

**Last Updated**: 2026-01-30
**Version**: 1.0.0
