/* eslint-disable no-undef */
const express = require('express');
describe('Express server test', () => {
  test('should listen on port 8000', async () => {
    const app = express();
    const server = app.listen(8000);
    const address = server.address();
    expect(address.port).toBe(8000);
    await new Promise(resolve => server.close(resolve));
  });
});