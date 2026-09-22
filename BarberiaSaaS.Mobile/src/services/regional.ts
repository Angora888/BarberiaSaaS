import api from "./api";

export type Regional={moneda:string;zonaHoraria:string;idioma:string;locale:string};

export const REGIONAL_DEFAULT:Regional={moneda:"CRC",zonaHoraria:"America/Costa_Rica",idioma:"es",locale:"es"};

let cache:Regional|null=null;

const localeFor=(idioma?:string)=>{
 const x=(idioma||"es").trim();
 return x||"es";
};

export async function obtenerRegional(force=false):Promise<Regional>{
 if(cache&&!force)return cache;
 try{
  const r=await api.get("/Configuracion");
  const c=r.data?.configuracion??{};
  cache={moneda:(c.moneda||REGIONAL_DEFAULT.moneda).toUpperCase(),zonaHoraria:c.zonaHoraria||REGIONAL_DEFAULT.zonaHoraria,idioma:c.idioma||REGIONAL_DEFAULT.idioma,locale:localeFor(c.idioma)};
  return cache;
 }catch{
  return REGIONAL_DEFAULT;
 }
}

export function limpiarRegional(){cache=null}

export function dinero(v:number|undefined,r:Regional){
 const n=Number(v??0);
 const simbolos:Record<string,string>={CRC:"₡",USD:"$",GTQ:"Q",HNL:"L",NIO:"C$",PAB:"B/.",BZD:"BZ$",SVC:"$"};
 try{
  const numero=new Intl.NumberFormat(r.locale,{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  return `${simbolos[r.moneda]??r.moneda} ${numero}`;
 }catch{return `${simbolos[r.moneda]??r.moneda} ${n.toFixed(2)}`}
}

export function fechaHora(v:string|undefined,r:Regional,opts:Intl.DateTimeFormatOptions={dateStyle:"medium",timeStyle:"short"}){
 if(!v)return"Sin fecha";
 const z=/Z$|[+-]\d{2}:\d{2}$/.test(v)?v:`${v}Z`;
 try{return new Intl.DateTimeFormat(r.locale,{timeZone:r.zonaHoraria,...opts}).format(new Date(z))}
 catch{return new Date(z).toLocaleString()}
}

export function hoyRegional(r:Regional){
 try{
  const p=new Intl.DateTimeFormat("en-CA",{timeZone:r.zonaHoraria,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const v=(t:string)=>p.find(x=>x.type===t)?.value;
  return `${v("year")}-${v("month")}-${v("day")}`;
 }catch{return new Date().toISOString().slice(0,10)}
}

export function fechaCorta(v:string,r:Regional){
 const[y,m,d]=v.split("-").map(Number);
 try{return new Intl.DateTimeFormat(r.locale,{weekday:"short",day:"numeric",month:"short"}).format(new Date(y,m-1,d))}
 catch{return v}
}

export function horaCorta(v:string,r:Regional){
 const[h,m]=v.split(":").map(Number);
 try{return new Intl.DateTimeFormat(r.locale,{hour:"numeric",minute:"2-digit"}).format(new Date(2000,0,1,h,m))}
 catch{return v}
}

export function duracionCorta(minutos:number|undefined|null){
 const total=Math.max(0,Math.round(Number(minutos??0)));
 if(!total)return"";
 const h=Math.floor(total/60),m=total%60;
 if(h&&m)return `${h}h ${m} min`;
 if(h)return `${h}h`;
 return `${m} min`;
}
