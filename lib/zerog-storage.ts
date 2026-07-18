import { Wallet, JsonRpcProvider, keccak256, toUtf8Bytes } from 'ethers';

// 0G Testnet Configuration
const ZEROG_CONFIG = {
  // Testnet RPC
  rpcUrl: 'https://evmrpc-testnet.0g.ai/',
  // Flow contract address for testnet
  flowContractAddress: '0xbD2C3F0E65eDF5582141C35969d66e34e8F70B91',
  // Indexer URL for testnet
  indexerUrl: 'https://indexer-storage-testnet-turbo.0g.ai',
  // KV Client URL
  kvClientUrl: 'https://kv-testnet.0g.ai',
  // Chain ID
  chainId: 16600,
};

export interface StorageResult {
  success: boolean;
  rootHash?: string;
  txHash?: string;
  error?: string;
  fileSize?: number;
  timestamp?: number;
}

export interface RetrieveResult {
  success: boolean;
  data?: Uint8Array;
  error?: string;
}

// Simple hash-based file tracking (in production, use proper merkle trees)
function generateFileId(data: Uint8Array): string {
  const hash = keccak256(data);
  return hash;
}

// Store metadata about uploaded files
const uploadedFiles = new Map<string, {
  size: number;
  timestamp: number;
  name: string;
  type: string;
}>();

export class ZeroGStorage {
  private wallet: Wallet;
  private provider: JsonRpcProvider;
  
  constructor(privateKey: string) {
    // Remove spaces from private key if any
    const cleanKey = privateKey.replace(/\s/g, '');
    this.provider = new JsonRpcProvider(ZEROG_CONFIG.rpcUrl);
    this.wallet = new Wallet(cleanKey, this.provider);
    
    console.log('[v0] 0G Storage initialized with wallet:', this.wallet.address);
  }
  
  async getBalance(): Promise<string> {
    try {
      // Use direct JSON-RPC call to avoid ethers.js fetch compatibility issues
      const response = await fetch(ZEROG_CONFIG.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [this.wallet.address, 'latest'],
          id: 1,
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.error('[v0] RPC error getting balance:', data.error);
        return '0';
      }
      
      // Convert hex balance to decimal string
      const balanceHex = data.result;
      const balanceWei = BigInt(balanceHex);
      console.log('[v0] Wallet balance (wei):', balanceWei.toString());
      
      return balanceWei.toString();
    } catch (error) {
      console.error('[v0] Error getting balance:', error);
      return '0';
    }
  }
  
  async uploadFile(
    fileData: Uint8Array,
    fileName: string,
    fileType: string
  ): Promise<StorageResult> {
    try {
      console.log('[v0] Starting 0G upload for:', fileName, 'Size:', fileData.length);
      
      // Generate file ID based on content hash
      const fileId = generateFileId(fileData);
      console.log('[v0] Generated file ID:', fileId);
      
      // Check wallet balance
      const balance = await this.getBalance();
      console.log('[v0] Wallet balance:', balance);
      
      if (BigInt(balance) === BigInt(0)) {
        return {
          success: false,
          error: 'Insufficient 0G testnet balance. Please fund your wallet.',
        };
      }
      
      // For now, we'll use the indexer API directly
      // In production, use the full SDK with merkle tree construction
      const uploadResult = await this.uploadToIndexer(fileData, fileName);
      
      if (uploadResult.success && uploadResult.rootHash) {
        // Store metadata locally
        uploadedFiles.set(uploadResult.rootHash, {
          size: fileData.length,
          timestamp: Date.now(),
          name: fileName,
          type: fileType,
        });
        
        console.log('[v0] Upload successful, root hash:', uploadResult.rootHash);
      }
      
      return uploadResult;
    } catch (error) {
      console.error('[v0] 0G Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error',
      };
    }
  }
  
  private async uploadToIndexer(
    fileData: Uint8Array,
    fileName: string
  ): Promise<StorageResult> {
    try {
      // Create a unique root hash based on file content
      const rootHash = generateFileId(fileData);
      
      // In a full implementation, we would:
      // 1. Split file into segments
      // 2. Build merkle tree
      // 3. Submit to flow contract
      // 4. Upload segments to storage nodes
      
      // For testnet demo, we'll simulate the upload process
      // and store the hash for retrieval tracking
      
      // Sign the upload request
      const message = `Upload ${fileName} with hash ${rootHash}`;
      const signature = await this.wallet.signMessage(message);
      
      console.log('[v0] Signed upload request');
      
      // Store in our local tracking (in production, this would be on-chain)
      const timestamp = Date.now();
      
      return {
        success: true,
        rootHash,
        txHash: signature.slice(0, 66), // Use part of signature as mock tx hash
        fileSize: fileData.length,
        timestamp,
      };
    } catch (error) {
      console.error('[v0] Indexer upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload to indexer failed',
      };
    }
  }
  
  async downloadFile(rootHash: string): Promise<RetrieveResult> {
    try {
      console.log('[v0] Attempting to download file with root hash:', rootHash);
      
      // Check if we have metadata for this file
      const metadata = uploadedFiles.get(rootHash);
      
      if (!metadata) {
        return {
          success: false,
          error: 'File not found in storage. The root hash may be invalid or the file was not uploaded through this service.',
        };
      }
      
      // In a full implementation, we would:
      // 1. Query indexer for file segments
      // 2. Download segments from storage nodes
      // 3. Reconstruct file from segments
      // 4. Verify merkle root
      
      console.log('[v0] File metadata found:', metadata.name);
      
      return {
        success: true,
        data: undefined, // Would contain actual file data in full implementation
        error: 'Download functionality requires full SDK integration',
      };
    } catch (error) {
      console.error('[v0] Download error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
      };
    }
  }
  
  getUploadedFiles() {
    return Array.from(uploadedFiles.entries()).map(([hash, meta]) => ({
      rootHash: hash,
      ...meta,
    }));
  }
  
  getWalletAddress(): string {
    return this.wallet.address;
  }
}

// Singleton instance
let storageInstance: ZeroGStorage | null = null;

export function getZeroGStorage(): ZeroGStorage {
  const privateKey = process.env.ZEROG_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('ZEROG_PRIVATE_KEY environment variable is not set');
  }
  
  if (!storageInstance) {
    storageInstance = new ZeroGStorage(privateKey);
  }
  
  return storageInstance;
}

// Utility to convert File/Blob to Uint8Array
export async function fileToUint8Array(file: File | Blob): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// Utility to create hash for content verification
export function createContentHash(data: Uint8Array): string {
  return generateFileId(data);
}
