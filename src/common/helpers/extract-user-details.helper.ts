import DeviceDetector = require('device-detector-js');

export interface ParsedUserAgent {
  device: string;
  os: string;
  client: string;
  ipAddress: string;
  userAgent: string;
}

export const ParseUserAgentHelper = (req): ParsedUserAgent => {
  if (req.userDetails) {
    return req.userDetails;
  }

  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ipAddress = req.ip || req.connection?.remoteAddress || 'Unknown';
  const parsedAgent = new DeviceDetector().parse(userAgent);

  const device = getDevice(parsedAgent);
  const os = getOs(parsedAgent);
  const client = getClient(parsedAgent);

  const userDetails: ParsedUserAgent = {
    device,
    os,
    client,
    ipAddress,
    userAgent,
  };

  // Attach to request for interceptor access
  req.userDetails = userDetails;

  return userDetails;
};

function getDevice(parsedAgent: DeviceDetector.DeviceDetectorResult): string {
  const device = parsedAgent?.device?.type;
  if (device) {
    return device.charAt(0).toUpperCase() + device.slice(1);
  }
  return 'Unknown device';
}

function getOs(parsedAgent: DeviceDetector.DeviceDetectorResult): string {
  const os = parsedAgent.os;
  if (os) {
    return (os.name === 'Mac' ? 'MacOS' : os.name) + ' ' + os.version;
  }
  return 'Unknown OS';
}

function getClient(parsedAgent: DeviceDetector.DeviceDetectorResult): string {
  const client = parsedAgent.client;
  if (client) {
    return client.name + ' ' + client.version;
  }
  return 'Unknown application';
}
