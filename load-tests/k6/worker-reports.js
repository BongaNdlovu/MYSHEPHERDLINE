import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const latency = new Trend('report_summary_duration', true);

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 150 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    report_summary_duration: ['p(95)<1000', 'p(99)<2000'],
  },
};

const baseUrl = __ENV.LOAD_BASE_URL;
const token = __ENV.LOAD_AUTH_TOKEN;

export default function () {
  const res = http.get(`${baseUrl}/reports/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  latency.add(res.timings.duration);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has summary fields': (r) =>
      typeof r.json('membersNeedingAttention') === 'number' &&
      typeof r.json('tasksOpen') === 'number',
  });
  sleep(0.5);
}
