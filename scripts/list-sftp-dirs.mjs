/**
 * Utility script to list directories on the SFTP server.
 * Run with: node scripts/list-sftp-dirs.mjs [path]
 *
 * Set environment variables before running:
 *   export EMARSYS_SFTP_ADDRESS=your-sftp-host
 *   export EMARSYS_SFTP_USER=your-username
 *   export EMARSYS_SFTP_PASS=your-password
 */

import SftpClient from 'ssh2-sftp-client';

const path = process.argv[2] || '/';

async function main() {
  const sftp = new SftpClient();

  try {
    console.log('Connecting to SFTP...');
    await sftp.connect({
      host: process.env.EMARSYS_SFTP_ADDRESS,
      username: process.env.EMARSYS_SFTP_USER,
      password: process.env.EMARSYS_SFTP_PASS,
    });

    console.log(`\nListing contents of: ${path}\n`);
    const listing = await sftp.list(path);

    for (const item of listing) {
      const type = item.type === 'd' ? '[DIR]' : '[FILE]';
      const size = item.type === '-' ? ` (${item.size} bytes)` : '';
      console.log(`${type} ${item.name}${size}`);
    }

    console.log(`\nTotal: ${listing.length} items`);
  } finally {
    await sftp.end();
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
