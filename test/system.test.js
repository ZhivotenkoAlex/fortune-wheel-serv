const assert = require('assert');
const { request } = require('gaxios');

const port = process.env.PORT || '8080';
const url = process.env.SERVICE_URL || `http://localhost:${port}`;
const token = process.env.TOKEN || '';
const timeout = process.env.TIMEOUT || 5000;

describe('Hello World', () => {
  it('can respond to an HTTP request', async () => {
    console.log(`    - Requesting GET ${url}/...`);
    const res = await request({
      url: url + '/',
      headers: { "Authorization": "Bearer " + token },
      timeout: timeout,
    });

    assert.equal(res.status, '200');
    assert.ok(
      res.data.includes('Congratulations, you successfully deployed a container image to Cloud Run'),
    );
  });
});
