import { getAccessToken, getProjectKey, getApiUrl } from './auth';
import type { CTChannelPagedResult, ChannelMap } from './types';
import type { SubrequestLogger } from './logger';

export async function fetchSupplyChannels(logger: SubrequestLogger): Promise<ChannelMap> {
  const projectKey = getProjectKey();
  const apiUrl = getApiUrl();
  const accessToken = await getAccessToken(logger);

  const channelMap: ChannelMap = {};
  let offset = 0;
  const limit = 100;
  let total = 0;

  do {
    const params = new URLSearchParams({
      where: 'roles contains any ("InventorySupply")',
      limit: String(limit),
      offset: String(offset),
    });

    const url = `https://${apiUrl}/${projectKey}/channels?${params}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    logger.log('channels', 'fetch_page');

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { message?: string };
      throw new Error(`Failed to fetch channels: ${errorData.message || response.statusText}`);
    }

    const data = (await response.json()) as CTChannelPagedResult;
    total = data.total;

    for (const channel of data.results) {
      // Use key first, then name (first available locale), then ID
      const displayName = channel.key
        || (channel.name ? Object.values(channel.name)[0] : null)
        || channel.id;
      channelMap[channel.id] = displayName;
    }

    offset += data.results.length;
  } while (offset < total);

  return channelMap;
}
