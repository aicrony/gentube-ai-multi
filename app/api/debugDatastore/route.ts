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
    const sampleCount = searchParams.get('sampleCount') || '1';
    
    if (assetId) {
      // Try multiple ways to find the asset
      const results = await tryFindAsset(assetId);
      return NextResponse.json({ 
        message: 'Debug asset lookup results', 
        assetId,
        results 
      });
    } else {
      // Get a few sample records
      const query = datastore
        .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
        .limit(parseInt(sampleCount));
      
      const [entities] = await datastore.runQuery(query);
      
      return NextResponse.json({
        message: 'Sample entities',
        count: entities.length,
        samples: entities.map(entity => ({
          id: entity[datastore.KEY].id || entity[datastore.KEY].name,
          key: entity[datastore.KEY],
          data: entity
        }))
      });
    }
  } catch (error: any) {
    console.error('Debug datastore error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to debug datastore', 
        details: error?.message || 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

async function tryFindAsset(assetId: string) {
  const results = {
    methods: [],
    found: false,
    asset: null
  };
  
  try {
    // Method 1: Try as string directly
    const keyString = datastore.key({
      namespace: NAMESPACE,
      path: [USER_ACTIVITY_KIND, assetId]
    });
    
    results.methods.push({ 
      method: "String ID", 
      key: keyString 
    });
    
    const [assetString] = await datastore.get(keyString);
    if (assetString) {
      results.found = true;
      results.asset = assetString;
      return results;
    }
    
    // Method 2: Try as int
    const keyInt = datastore.key({
      namespace: NAMESPACE,
      path: [USER_ACTIVITY_KIND, parseInt(assetId)]
    });
    
    results.methods.push({ 
      method: "Integer ID", 
      key: keyInt
    });
    
    const [assetInt] = await datastore.get(keyInt);
    if (assetInt) {
      results.found = true;
      results.asset = assetInt;
      return results;
    }
    
    // Method 3: Try as bigint if large
    if (assetId.length > 10) {
      try {
        const bigintId = BigInt(assetId);
        const keyBigInt = datastore.key({
          namespace: NAMESPACE,
          path: [USER_ACTIVITY_KIND, Number(bigintId)]
        });
        
        results.methods.push({ 
          method: "BigInt ID", 
          key: keyBigInt
        });
        
        const [assetBigInt] = await datastore.get(keyBigInt);
        if (assetBigInt) {
          results.found = true;
          results.asset = assetBigInt;
          return results;
        }
      } catch (e) {
        results.methods.push({ 
          method: "BigInt ID", 
          error: e.message
        });
      }
    }
    
    // Method 4: Query by ID field
    const query = datastore
      .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
      .filter('id', '=', assetId)
      .limit(1);
    
    results.methods.push({ method: "Query by id field" });
    
    const [queryResults] = await datastore.runQuery(query);
    if (queryResults && queryResults.length > 0) {
      results.found = true;
      results.asset = queryResults[0];
      return results;
    }
    
    return results;
    
  } catch (error: any) {
    results.methods.push({ 
      method: "Error", 
      error: error?.message || 'Unknown error'
    });
    return results;
  }
}