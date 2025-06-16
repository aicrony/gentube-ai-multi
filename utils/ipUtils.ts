import * as ipaddr from 'ipaddr.js';

export function normalizeIp(
  ip: string | string[] | undefined
): string | string[] {
  // Handle undefined or null cases
  if (ip === undefined || ip === null) {
    return '0.0.0.0';
  }

  if (Array.isArray(ip)) {
    // Filter out any undefined/null entries in the array
    const validIps = ip.filter((item) => item !== undefined && item !== null);

    // If array is empty after filtering, return a default IP
    if (validIps.length === 0) {
      return ['0.0.0.0'];
    }

    return validIps.map((item) => normalizeIp(item) as string);
  } else {
    try {
      // Make sure ip is a string
      const ipString = String(ip);

      const addr = ipaddr.parse(ipString);
      if (addr.kind() === 'ipv4') {
        const octets = addr.toByteArray();
        octets[3] = 0;
        return octets.join('.');
      } else {
        // For IPv6, return the address unmodified or apply a different normalization as needed
        return ipString;
      }
    } catch (e) {
      // If parsing fails, return the IP as is or a safe default
      return ip || '0.0.0.0';
    }
  }
}

export function localIpConfig(
  localIp: string | string[] | undefined
): string | string[] {
  // Handle undefined/null cases
  if (localIp === undefined || localIp === null) {
    return '192.168.1.1';
  }

  // Handle array case
  if (Array.isArray(localIp)) {
    // If array is empty, return a default IP
    if (localIp.length === 0) {
      return ['192.168.1.1'];
    }

    // Map through array and localize each IP
    return localIp.map((ip) =>
      ip === undefined || ip === null || ip === '::1' ? '192.168.1.1' : ip
    );
  }

  // Handle single IP case
  return localIp === '::1' ? '192.168.1.1' : localIp;
}
