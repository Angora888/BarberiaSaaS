export function telefonoInternacional(valor?:string|null){const raw=String(valor??"").trim();if(!raw)return"";let digits=raw.replace(/\D/g,"");if(digits.startsWith("00"))digits=digits.slice(2);return digits}
export function whatsappUrl(telefono?:string|null,mensaje?:string){const n=telefonoInternacional(telefono);if(!n)return null;return `https://wa.me/${n}${mensaje?`?text=${encodeURIComponent(mensaje)}`:""}`}
export function telUrl(telefono?:string|null){const raw=String(telefono??"").trim();return raw?`tel:${raw}`:null}
