// Same 27-color rotation the original single-batch file used, now shared
// server-side so bulk-imported rosters get consistent per-learner colors.
const DEFAULT_PALETTE = [
  '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22',
  '#E91E63', '#00BCD4', '#8BC34A', '#FF5722', '#673AB7', '#009688', '#FF9800',
  '#607D8B', '#F44336', '#2196F3', '#4CAF50', '#FF8F00', '#9C27B0', '#03A9F4',
  '#8D6E63', '#26C6DA', '#CDDC39', '#EF5350', '#42A5F5', '#66BB6A',
];

function colorForIndex(i) {
  return DEFAULT_PALETTE[((i % DEFAULT_PALETTE.length) + DEFAULT_PALETTE.length) % DEFAULT_PALETTE.length];
}

module.exports = { DEFAULT_PALETTE, colorForIndex };
