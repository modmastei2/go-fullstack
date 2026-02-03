# DataGrid Components - Dual Implementation

This folder contains two DataGrid implementations for maximum flexibility:

## 1. Custom DataGrid (Default)
**Files:**
- `DataGrid.tsx` - Custom built grid with manual implementation
- `DataGridModel.tsx` - Type definitions
- `ColumnSelector.tsx` - Category-based column selector

**Features:**
- ✅ Custom filter operators (contains, startsWith, endsWith, equals)
- ✅ Client-side pagination
- ✅ Sorting & filtering
- ✅ Frozen columns (sticky positioning)
- ✅ Inline editing
- ✅ Row selection
- ✅ Full customization

## 2. MUI X DataGrid (Premium-Ready)
**Files:**
- `DataGridPremiumWrapper.tsx` - MUI X DataGrid wrapper
- `DataGridPremiumModel.tsx` - Type definitions
- `ColumnSelectorPremium.tsx` - Category-based column selector

**Features:**
- ✅ Quick search toolbar
- ✅ Built-in pagination
- ✅ Built-in sorting & filtering
- ✅ Column visibility management
- ✅ Row selection
- ✅ Inline editing
- 🔄 Ready for upgrade to Premium features

**Current Status:** Uses `@mui/x-data-grid` (free version)

### Upgrade to Premium
To unlock advanced features (column pinning, aggregation, row grouping, Excel export):

```bash
npm install @mui/x-data-grid-premium
```

Then update `DataGridPremiumWrapper.tsx`:
```typescript
// Change import from:
import { DataGrid } from '@mui/x-data-grid';

// To:
import { DataGridPremium } from '@mui/x-data-grid-premium';

// And update component usage:
<DataGridPremium ... />
```

## Usage in Historical Page

Toggle between implementations with the button at top of page:
- **Custom Grid** - Full custom implementation
- **MUI X Premium** - MUI X DataGrid (upgradeable)

## Column Categories

Both grids support the same category system:
- **Core** - Always visible (Client Code, Name, Type)
- **Bond** - Bond-related columns
- **Mutual Fund (MF)** - Mutual fund columns  
- **Structure Note (SN)** - Structure note columns
- **All** - Select all non-core columns

## Feature Comparison

| Feature | Custom Grid | MUI X Grid | MUI X Premium |
|---------|-------------|------------|---------------|
| Basic Grid | ✅ | ✅ | ✅ |
| Custom Filters | ✅ | ⚠️ Basic | ✅ Advanced |
| Frozen Columns | ✅ Manual | ❌ | ✅ Built-in |
| Pagination | ✅ | ✅ | ✅ |
| Inline Edit | ✅ | ✅ | ✅ |
| Excel Export | ❌ | ❌ | ✅ |
| Row Grouping | ❌ | ❌ | ✅ |
| Aggregation | ❌ | ❌ | ✅ |
| Performance | Good | Good | Excellent |

## Recommendations

**Use Custom Grid when:**
- You need specific filter behavior
- Full control over styling
- No budget for premium license

**Use MUI X Grid when:**
- Want standardized UX
- Need quick implementation
- Plan to upgrade to Premium later
- Want built-in accessibility
