import { NextRequest, NextResponse } from 'next/server';
import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const USER_ACTIVITY_KIND = 'UserActivity';
const NAMESPACE = 'GenTube';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const assetId = searchParams.get('assetId');
    
    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }
    
    // Query UserActivity directly by Datastore ID
    const query = datastore
      .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
      .limit(50);
    
    const [entities] = await datastore.runQuery(query);
    
    // Look for the asset by ID
    let foundEntity = null;
    let allKeys = [];
    
    for (const entity of entities) {
      const key = entity[datastore.KEY];
      const keyId = key.id || key.name;
      
      allKeys.push({
        id: keyId,
        type: typeof keyId,
        stringValue: String(keyId),
        numberValue: Number(keyId),
        matches: {
          exactMatch: keyId === assetId,
          stringMatch: String(keyId) === assetId,
          numberMatch: Number(keyId) === Number(assetId)
        }
      });
      
      // Check for a match
      if (
        keyId === assetId || 
        String(keyId) === assetId || 
        Number(keyId) === Number(assetId)
      ) {
        foundEntity = {
          key,
          keyId,
          data: entity
        };
      }
    }
    
    const result = {
      status: foundEntity ? 'found' : 'not_found',
      searchedId: assetId,
      searchedIdType: typeof assetId,
      searchedIdAsNumber: Number(assetId),
      totalEntitiesScanned: entities.length,
      foundEntity,
      keyAnalysis: allKeys.slice(0, 10) // Just send the first 10 for analysis
    };
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error finding asset:', error);
    return NextResponse.json(
      { error: 'Failed to find asset', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}