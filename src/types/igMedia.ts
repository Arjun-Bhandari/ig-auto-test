export interface IgMediaChild {
    id?: string;
    media_url: string;
  }
  
  export interface IgMediaItem {
    id: string;
    caption?: string;
    media_url: string;
    media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
    timestamp: string; // ISO8601
    children?: { data: IgMediaChild[] };
  }
  
  export interface IgPagingCursors {
    before?: string;
    after?: string;
  }
  
  export interface IgPaging {
    cursors?: IgPagingCursors;
    next?: string;
    previous?: string;
  }
  
  export interface IgMediaResponse {
    data: IgMediaItem[];
    paging?: IgPaging;
  }
  
  export interface GetAllMediaParams {
    igUserId: bigint;
    limit?: number;
  }