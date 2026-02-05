import SftpClient from 'ssh2-sftp-client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// UPDATE THESE PATHS to match your SFTP structure
const CSV_FILES = [
  './v_dim_plant.csv',
  './v_dim_product.csv',
];

async function main() {
  const sftp = new SftpClient();
  const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  try {
    await sftp.connect({
      host: process.env.EMARSYS_SFTP_ADDRESS,
      username: process.env.EMARSYS_SFTP_USER,
      password: process.env.EMARSYS_SFTP_PASS,
    });

    for (const remotePath of CSV_FILES) {
      const filename = remotePath.split('/').pop();
      console.log(`Downloading ${filename}...`);

      const buffer = await sftp.get(remotePath);

      console.log(`Uploading ${filename} to R2...`);
      await s3.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: filename,
        Body: buffer,
        ContentType: 'text/csv',
      }));

      console.log(`✓ ${filename} synced`);
    }
  } finally {
    await sftp.end();
  }
}

main().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
