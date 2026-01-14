import { h } from 'preact';

export function virtualList(rows, offset, limit) {
  const windowSlice = rows.slice(offset, offset + limit);
  return h(
    'div',
    { key: 'virtual-list' },
    ...windowSlice.map((row) =>
      h(
        'div',
        { key: `row-${row.id}`, 'data-row': row.id },
        row.label
      )
    )
  );
}
