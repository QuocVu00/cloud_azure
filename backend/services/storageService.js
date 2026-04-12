const { 
    BlobServiceClient, 
    BlobSASPermissions, 
    generateBlobSASQueryParameters, 
    StorageSharedKeyCredential 
} = require('@azure/storage-blob');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Azure Storage Service
 * Handles SAS token generation for direct browser-to-cloud uploads.
 */
class AzureStorageService {
    constructor() {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error('Azure Storage Connection String is missing in .env');
        }

        this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'user-uploads';
        
        // Parse account name and key from connection string for SAS generation
        const parts = connectionString.split(';');
        this.accountName = parts.find(p => p.startsWith('AccountName=')).split('=')[1];
        this.accountKey = parts.find(p => p.startsWith('AccountKey=')).split('=')[1];
        this.sharedKeyCredential = new StorageSharedKeyCredential(this.accountName, this.accountKey);
    }

    /**
     * Generates a SAS URL for a specific blob.
     * Permissions: Read, Add, Create, Write (rac)
     * Expiry: 30 minutes
     * @param {string} fileName 
     * @returns {string} Fully qualified SAS URL
     */
    async generateUploadSas(fileName) {
        try {
            const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
            
            // Ensure container exists
            await containerClient.createIfNotExists();

            const blobClient = containerClient.getBlobClient(fileName);

            const sasOptions = {
                containerName: this.containerName,
                blobName: fileName,
                startsOn: new Date(new Date().valueOf() - 15 * 60 * 1000), // 15 minutes ago for clock skew
                expiresOn: new Date(new Date().valueOf() + 60 * 60 * 1000), // 60 minutes
                permissions: BlobSASPermissions.parse('racw') // Read, Add, Create, Write
            };

            const sasToken = generateBlobSASQueryParameters(
                sasOptions,
                this.sharedKeyCredential
            ).toString();

            return `${blobClient.url}?${sasToken}`;
        } catch (error) {
            console.error('Error generating SAS Token:', error);
            throw new Error('Failed to generate upload SAS');
        }
    }

    /**
     * Deletes a blob from Azure Storage.
     * @param {string} fileName 
     */
    async deleteBlob(fileName) {
        try {
            const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
            const blobClient = containerClient.getBlobClient(fileName);
            await blobClient.delete();
        } catch (error) {
            console.error('Azure Delete Error:', error);
            throw new Error('Failed to delete blob from Azure');
        }
    }

    /**
     * Generates a read-only SAS URL for a specific blob.
     * Permissions: Read (r)
     * Expiry: 10 minutes
     * @param {string} fileName 
     * @param {string} originalName - Optional name to set in Content-Disposition
     * @returns {string} Fully qualified Read SAS URL
     */
    async generateReadSas(fileName, originalName) {
        try {
            const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
            const blobClient = containerClient.getBlobClient(fileName);

            const sasOptions = {
                containerName: this.containerName,
                blobName: fileName,
                startsOn: new Date(new Date().valueOf() - 15 * 60 * 1000), // 15 minutes in the past to avoid clock skew
                expiresOn: new Date(new Date().valueOf() + 60 * 60 * 1000), // Increased to 60 minutes
                permissions: BlobSASPermissions.parse('r') // Read only
            };

            // Force download by setting content-disposition if originalName is provided
            if (originalName) {
                sasOptions.contentDisposition = `attachment; filename="${encodeURIComponent(originalName)}"`;
            }

            const sasToken = generateBlobSASQueryParameters(
                sasOptions,
                this.sharedKeyCredential
            ).toString();

            return `${blobClient.url}?${sasToken}`;
        } catch (error) {
            console.error('Error generating Read SAS Token:', error);
            throw new Error('Failed to generate download SAS');
        }
    }
}


module.exports = new AzureStorageService();
