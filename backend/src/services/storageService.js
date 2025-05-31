const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');

class StorageService {
  constructor() {
    this.storageType = process.env.STORAGE_TYPE || 'local';
    
    if (this.storageType === 's3') {
      this.s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
      });
      this.bucketName = process.env.AWS_BUCKET_NAME;
    }
  }

  async uploadFile(file, key) {
    if (this.storageType === 's3') {
      return this.uploadToS3(file, key);
    } else {
      return this.uploadToLocal(file, key);
    }
  }

  async uploadToS3(file, key) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: await fs.readFile(file.path),
      ContentType: file.mimetype
    };

    const result = await this.s3.upload(params).promise();
    
    // Eliminar ficheiro local após upload para S3
    await fs.unlink(file.path);
    
    return {
      url: result.Location,
      key: result.Key
    };
  }

  async uploadToLocal(file, key) {
    const uploadDir = path.join(__dirname, '../../uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    
    const newPath = path.join(uploadDir, key);
    await fs.rename(file.path, newPath);
    
    return {
      url: `/uploads/${key}`,
      path: newPath
    };
  }

  async deleteFile(key) {
    if (this.storageType === 's3') {
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();
    } else {
      const filePath = path.join(__dirname, '../../uploads', key);
      await fs.unlink(filePath);
    }
  }

  async getFileStream(key) {
    if (this.storageType === 's3') {
      return this.s3.getObject({
        Bucket: this.bucketName,
        Key: key
      }).createReadStream();
    } else {
      const filePath = path.join(__dirname, '../../uploads', key);
      return require('fs').createReadStream(filePath);
    }
  }
}

module.exports = new StorageService();
