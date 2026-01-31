import { NextRequest, NextResponse } from 'next/server';
import { getZeroGStorage, fileToUint8Array, createContentHash } from '@/lib/zerog-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const action = formData.get('action') as string;
    
    if (!process.env.ZEROG_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'ZEROG_PRIVATE_KEY not configured' },
        { status: 500 }
      );
    }
    
    const storage = getZeroGStorage();
    
    if (action === 'upload') {
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }
      
      console.log('[v0] Uploading file to 0G Storage:', file.name, 'Size:', file.size);
      
      const fileData = await fileToUint8Array(file);
      const result = await storage.uploadFile(fileData, file.name, file.type);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          rootHash: result.rootHash,
          txHash: result.txHash,
          fileSize: result.fileSize,
          timestamp: result.timestamp,
          walletAddress: storage.getWalletAddress(),
          message: 'File uploaded to 0G decentralized storage successfully',
        });
      } else {
        return NextResponse.json(
          { error: result.error || 'Upload failed' },
          { status: 500 }
        );
      }
    }
    
    if (action === 'download') {
      const rootHash = formData.get('rootHash') as string;
      
      if (!rootHash) {
        return NextResponse.json(
          { error: 'No root hash provided' },
          { status: 400 }
        );
      }
      
      const result = await storage.downloadFile(rootHash);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'File retrieved from 0G storage',
        });
      } else {
        return NextResponse.json(
          { error: result.error || 'Download failed' },
          { status: 500 }
        );
      }
    }
    
    if (action === 'list') {
      const files = storage.getUploadedFiles();
      return NextResponse.json({
        success: true,
        files,
        walletAddress: storage.getWalletAddress(),
      });
    }
    
    if (action === 'balance') {
      const balance = await storage.getBalance();
      return NextResponse.json({
        success: true,
        balance,
        walletAddress: storage.getWalletAddress(),
      });
    }
    
    if (action === 'hash') {
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }
      
      const fileData = await fileToUint8Array(file);
      const hash = createContentHash(fileData);
      
      return NextResponse.json({
        success: true,
        hash,
        fileName: file.name,
        fileSize: file.size,
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Use: upload, download, list, balance, or hash' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('[v0] 0G Storage API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: 'Check that ZEROG_PRIVATE_KEY is correctly configured'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!process.env.ZEROG_PRIVATE_KEY) {
      return NextResponse.json({
        configured: false,
        error: 'ZEROG_PRIVATE_KEY not configured',
      });
    }
    
    const storage = getZeroGStorage();
    const balance = await storage.getBalance();
    const files = storage.getUploadedFiles();
    
    return NextResponse.json({
      configured: true,
      walletAddress: storage.getWalletAddress(),
      balance,
      uploadedFilesCount: files.length,
      network: 'testnet',
      rpcUrl: 'https://evmrpc-testnet.0g.ai/',
    });
    
  } catch (error) {
    console.error('[v0] 0G Storage status error:', error);
    return NextResponse.json(
      { 
        configured: false,
        error: error instanceof Error ? error.message : 'Failed to check status'
      },
      { status: 500 }
    );
  }
}
