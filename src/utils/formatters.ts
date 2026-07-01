/**
 * MIGRATION NOTE:
 * Angular: 3 pipes (DateTimeSplitPipe, Format_SL_StatusPipe, SelectedRowsFilterPipe)
 * React Native: Plain utility functions — no Angular pipe decorator needed.
 *
 * Usage in JSX:
 *   {dateTimeSplit(item.CreatedOn)}          ← was: {{ item.CreatedOn | dateTimeSplit }}
 *   {formatSLStatus(item)}                    ← was: {{ item | Format_SL_Status }}
 *   {selectedRowsFilter(list)}                ← was: list | selectedRowsFilter
 */

/**
 * DateTimeSplitPipe → dateTimeSplit()
 * Converts ISO date "2024-12-25T10:30:00" → "25-12-2024"
 */
export function dateTimeSplit(value: string | null | undefined): string {
    if (!value) {
        return '';
    }
    const fullDate = value.split('T')[0];
    const datePart = fullDate.split('-');
    if (datePart.length !== 3) {
        return value;
    }
    return `${datePart[2]}-${datePart[1]}-${datePart[0]}`;
}

/**
 * Format_SL_StatusPipe → formatSLStatus()
 * Converts internal status IDs to human-readable strings.
 */
export function formatSLStatus(item: { Statusid: number; Stat: string }): string {
    switch (item.Statusid) {
        case 130:
            return 'With RM';
        case 42:
            return 'Forwarded to authorized.';
        case 43:
            return 'HOLD';
        case 59:
            return 'HOLD';
        case 129:
            return 'HOLD';
        default:
            return item.Stat;
    }
}

/**
 * SelectedRowsFilterPipe → selectedRowsFilter()
 * Filters list to only items where IsChecked === true.
 */
export function selectedRowsFilter<T extends { IsChecked: boolean }>(items: T[]): T[] {
    if (!items) {
        return items;
    }
    return items.filter(item => item.IsChecked === true);
}
