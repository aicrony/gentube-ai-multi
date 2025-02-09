import { normalizeIp } from '@/utils/ipUtils';
import assert from 'assert';

describe('normalizeIp', () => {
  test('Normalizes a typical IPv4 address', () => {
    const ipv4 = '192.168.1.42';
    const normalizedIpv4 = normalizeIp(ipv4);
    assert.strictEqual(normalizedIpv4, '192.168.1.0');
  });

  test('Leaves IPv6 addresses unchanged', () => {
    const ipv6 = '2001:db8::1';
    const normalizedIpv6 = normalizeIp(ipv6);
    assert.strictEqual(normalizedIpv6, ipv6);
  });

  test('Normalizes an array of IPv4 addresses', () => {
    const ipArray = ['192.168.1.123', '10.0.0.55'];
    const normalizedArray = normalizeIp(ipArray);
    assert.deepStrictEqual(normalizedArray, ['192.168.1.0', '10.0.0.0']);
  });

  test('Returns invalid IP addresses as-is', () => {
    const invalidIp = 'invalid-ip';
    const normalizedInvalid = normalizeIp(invalidIp);
    assert.strictEqual(normalizedInvalid, invalidIp);
  });
});
