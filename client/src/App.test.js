import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Phreddit welcome heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/Welcome to Phreddit/i);
  expect(headingElement).toBeInTheDocument();
});
