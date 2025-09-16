export interface IgAuthError{
    error_type:string;
    code:number;
    error_message:string;
}

export interface IgShortLivedSuccessResponse{ 
access_token:string;
user_id:number;
permissions:string[];
  
}

export interface IgLongLivedTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
  }
  export interface IgSixtyDaysTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
  }

  export interface UnifiedIgAuthResponse {
    igUserId: string;
    username?: string; 
    name?: string; 
    profilePictureUrl?: string; 
    accountType?: string; 
    accessToken: string;
    tokenCreatedAt: Date;
    tokenExpireDay: Date;
    tokenExpireIn: number;
    permissions?: string[];
  }

  export interface IgUserInfoResponse{
    id: number;
    username: string;
    name:string;
    profile_picture_url:string;
    account_type:string;
  }