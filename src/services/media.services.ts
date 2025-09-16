import { getAccessTokenByIgUserId } from "../utils/getAccessToken";
import {IgMediaResponse} from "../types/igMedia";
export const getAllMedia = async(igUserId:bigint,limit:number=10):Promise<IgMediaResponse>=>{
if(!igUserId){
    throw new Error("Access Token is Required");
}
try{
    const access_token = await getAccessTokenByIgUserId(igUserId);
    if(!access_token){
        throw new Error("Access Token Not Found");
    }
    const response = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_url,media_type,timestamp,children{media_url}&limit=${limit}&access_token=${access_token}`);
    const data = await response.json();
    if(!response.ok){
        const errorData = data as any;
        throw new Error(`Error: Failed to Get All Media ${errorData}`);
    }
    return data as IgMediaResponse;
    }
    catch(error){
        if(error instanceof Error){
            throw new Error(`Error: Failed to Get All Media ${error.message}`);
        }
        throw error;
    }
}

