export interface GcloudUserActivity {
  id: string | number | undefined;
  AssetSource: string | undefined;
  AssetType: string;
  CountedAssetPreviousState: number;
  CountedAssetState: number;
  CreatedAssetUrl: any;
  DateTime: string;
  Prompt: string | undefined;
  SubscriptionTier: number;
  UserId: string | string[] | undefined;
  UserIp: string | string[];
}
