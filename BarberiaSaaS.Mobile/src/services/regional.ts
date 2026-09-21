import api from "./api";
export type Regional={moneda:string;zonaHoraria:string;idioma:string;locale:string};
let cache:Regional|null=null;
const localeFor=(idioma?:string)=>{const x=(idioma||"es").trim();return x.includes("-")?x:x.toLowerCase()==="en"?"en-US":x.toLowerCase()==="pt"?"pt-BR":"es-CR"};
export async function obtenerRegional(force=false):Promise<Regional>{if(cache&&!force)return cache;try{const r=await api.get("/Configuracion");const c=r.data?.configuracion??{};cache={moneda:(c.moneda||"CRC").toUpperCase(),zonaHoraria:c.zonaHoraria||"America/Costa_Rica",idioma:c.idioma||"es",locale:localeFor(c.idioma)};}catch{cache={moneda:"CRC",zonaHoraria:"America/Costa_Rica",idioma:"es",locale:"es-CR"};}return cache}
export function limpiarRegional(){cache=null}
export function dinero(v:number|undefined,r:Regional){try{return new Intl.NumberFormat(r.locale,{style:"currency",currency:r.moneda,maximumFractionDigits:2}).format(Number(v??0))}catch{return `${r.moneda} ${Number(v??0).toFixed(2)}`}}
export function fechaHora(v:string|undefined,r:Regional,opts:Intl.DateTimeFormatOptions={dateStyle:"medium",timeStyle:"short"}){if(!v)return"Sin fecha";const z=/Z$|[+-]\d{2}:\d{2}$/.test(v)?v:`${v}Z`;try{return new Intl.DateTimeFormat(r.locale,{timeZone:r.zonaHoraria,...opts}).format(new Date(z))}catch{return new Date(z).toLocaleString()}}
