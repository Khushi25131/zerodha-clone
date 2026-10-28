import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';
import Stats from './home/Stats';

test('mobile menu exposes state, selects the current route, and closes after navigation', () => {
  render(<MemoryRouter initialEntries={['/pricing']}><Navbar /></MemoryRouter>);
  const toggle = screen.getByRole('button', { name: 'Toggle navigation' });
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute('aria-current', 'page');
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(screen.getByRole('link', { name: 'About' }));
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('home demo link respects the deployed dashboard URL', () => {
  const saved = process.env.REACT_APP_DASHBOARD_URL;
  process.env.REACT_APP_DASHBOARD_URL = 'https://dashboard.example.test';
  try {
    render(<Stats />);
    expect(screen.getByRole('link', { name: /Try Kite demo/ })).toHaveAttribute('href', 'https://dashboard.example.test');
  } finally {
    if (saved === undefined) delete process.env.REACT_APP_DASHBOARD_URL;
    else process.env.REACT_APP_DASHBOARD_URL = saved;
  }
});
