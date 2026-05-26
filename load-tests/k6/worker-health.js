import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const latency = new Trend('health_duration', true);

export const options = {
  vus: 30,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    health_duration: ['p(95)<200'],
  },
};

const baseUrl = __ENV.LOAD_BASE_URL;

export default function () {
  const res = http.get(`${baseUrl}/health`);
  latency.add(res.timings.duration);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'healthy payload': (r) => r.json('status') === 'healthy',
  });
  sleep(0.2);
}
