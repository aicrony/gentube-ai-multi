export interface GcloudUserActivity {
  id: string | number;
  AssetSource: string | undefined;
  AssetType: string;
  CountedAssetPreviousState: number;
  CountedAssetState: number;
  CreatedAssetUrl: any;
  DateTime: string;
  Prompt: string;
  SubscriptionTier: number;
  UserId: string | string[] | undefined;
  UserIp: string | string[] | undefined;
}
