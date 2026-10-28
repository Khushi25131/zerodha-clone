import { dailyActivity, filterOrders, holdingTotals, money, orderValue, portfolioRows } from './analytics';
const holdings = [{ name: 'BETA', qty: 2, avg: 10, price: 12 }, { name: 'ALPHA', qty: 3, avg: 20, price: 10 }];
test('portfolio totals and sorting use quantities, not unit-price proportions', () => {
  expect(holdingTotals(holdings)).toEqual({ investment: 80, value: 54 });
  expect(portfolioRows(holdings).map(row => row.name)).toEqual(['ALPHA', 'BETA']);
  expect(portfolioRows(holdings, ' beta ', 'profit')[0]).toMatchObject({ value: 24, investment: 20, profit: 4 });
  expect(portfolioRows(holdings, '', 'name')[0].name).toBe('ALPHA');
  expect(holdingTotals([])).toEqual({ investment: 0, value: 0 });
});
const orders = [
  { name: 'INFY', qty: 2, price: 100, mode: 'BUY', createdAt: '2026-01-10T12:00:00Z' },
  { name: 'INFY', mode: 'SELL', createdAt: '2026-01-09T12:00:00Z' },
  { name: 'TCS', mode: 'BUY', createdAt: '2025-01-01T00:00:00Z' },
  { name: 'OLD', mode: 'BUY' },
];
test('order filters combine search, side and rolling dates without fabricating dates', () => {
  expect(filterOrders(orders, { search: ' infy ', mode: 'BUY', days: '7' }, Date.parse('2026-01-11T00:00:00Z'))).toEqual([orders[0]]);
  expect(filterOrders(orders)).toHaveLength(4);
  expect(filterOrders(orders, { search: 'missing' })).toEqual([]);
  expect(orderValue(orders[0])).toBe(200);
});
test('activity groups real timestamps in chronological UTC order', () => {
  expect(dailyActivity(orders)).toEqual([
    { date: '2025-01-01', BUY: 1, SELL: 0 },
    { date: '2026-01-09', BUY: 0, SELL: 1 },
    { date: '2026-01-10', BUY: 1, SELL: 0 },
  ]);
  expect(dailyActivity([])).toEqual([]);
  expect(dailyActivity([{ mode: 'BUY', createdAt: 'invalid' }])).toEqual([]);
});
test('currency formats real values and empty portfolios safely', () => {
  expect(money(1234)).toContain('1,234');
  expect(money(undefined)).toContain('0.00');
});
