import { NextRequest } from "next/server";
export class HttpError extends Error{constructor(public status:400|403|409|503,message:string){super(message)}}
export async function readJsonBody(request:NextRequest,maxBytes=16_384):Promise<unknown>{const length=Number(request.headers.get("content-length")??0);if(length>maxBytes)throw new HttpError(400,"request body too large");const text=await request.text();if(new TextEncoder().encode(text).length>maxBytes)throw new HttpError(400,"request body too large");try{return JSON.parse(text)}catch{throw new HttpError(400,"invalid JSON")}}
