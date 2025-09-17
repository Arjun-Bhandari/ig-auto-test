import crypto from "crypto";

export const verifyMetaSignature = (appSecret:string, rawBody:string,header?:string):boolean => {
 if(!header) return false;
 const [algo, signature] = header.split('=');
 if(algo !="sha256" || !signature) return false;

 const hmac = crypto.createHmac("sha256", appSecret);
 hmac.update(rawBody, "utf8");
 const expected = hmac.digest("hex");
 return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}