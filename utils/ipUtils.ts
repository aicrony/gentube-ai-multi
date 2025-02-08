import * as ipaddr from 'ipaddr.js';

export default function normalizeIp(ip: string | string[]): string | string[] {
  if (Array.isArray(ip)) {
    return ip.map((item) => normalizeIp(item) as string);
  } else {
    try {
      const addr = ipaddr.parse(ip);
      if (addr.kind() === 'ipv4') {
        const octets = addr.toByteArray();
        octets[3] = 0;
        return octets.join('.');
      } else {
        // For IPv6, return the address unmodified or apply a different normalization as needed
        return ip;
      }
    } catch (e) {
      return ip;
    }
  }
}
