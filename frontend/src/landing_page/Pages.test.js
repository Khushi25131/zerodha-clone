import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Signup from './signup/Signup';
import Hero from './home/Hero';
import ProductPage from './products/ProductPage';
import Footer from './Footer';
import OpenAccount from './OpenAccount';
test('shared open-account call to action navigates to signup', () => {
  render(<OpenAccount />);
  expect(screen.getByRole('link', { name: 'Sign up Now' })).toHaveAttribute('href', '/signup');
});
test('signup does not pretend to create a real financial account', () => {
  render(<Signup />);
  expect(screen.getByText(/demo-only accounts to isolate sample data/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Open demo dashboard' })).toHaveAttribute('href', 'http://localhost:3001');
});
test('home signup action works and hero asset uses correct case', () => {
  render(<Hero />);
  expect(screen.getByRole('link', { name: 'Signup Now' })).toHaveAttribute('href', '/signup');
  expect(screen.getByAltText('Investment platform overview')).toHaveAttribute('src', '/media/images/homeHero.png');
});
test('products use actual prop URLs and no placeholder links', () => {
  render(<ProductPage />);
  expect(screen.getByRole('link', { name: 'Try demo →' })).toHaveAttribute('href', 'http://localhost:3001');
  for (const link of screen.getAllByRole('link')) {
    expect(link.getAttribute('href')).toMatch(/^(https?:\/\/|\/)/);
    expect(link.getAttribute('href')).not.toMatch(/[{}]/);
  }
});
test('footer internal navigation has real routes', () => {
  render(<Footer />);
  expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
  expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/product');
});
