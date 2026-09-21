import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import api from "@/src/services/api";
type Cita={id:number;fechaInicio?:string;fechaFin?:string;precio?:number;estado?:string;notas?:string;cliente?:{nombre?:string;apellidos?:string;telefono?:string;email?:string};profesional?:{nombre?:string;apellidos?:string};servicio?:{nombre?:string};servicioVariante?:{nombre?:string}|null;sucursal?:{nombre?:string}};
export default function CitaDetalle(){
 const {id}=useLocalSearchParams<{id:string}>();const[cita,setCita]=useState<Cita|null>(null);const[error,setError]=useState("");
 useEffect(()=>{api.get(`/Citas/${id}`).then(r=>setCita(r.data)).catch(e=>setError(e?.response?.data?.mensaje??"No fue posible cargar la cita."));},[id]);
 if(!cita&&!error)return <SafeAreaView style={s.loading}><ActivityIndicator size="large"/><Text style={s.muted}>Cargando cita...</Text></SafeAreaView>;
 return <SafeAreaView style={s.page}><View style={s.top}><Pressable onPress={()=>router.back()}><Text style={s.back}>‹ Agenda</Text></Pressable><Text style={s.title}>Detalle de cita</Text><View style={{width:60}}/></View>
 <ScrollView contentContainerStyle={s.content}>{error?<View style={s.card}><Text style={s.error}>{error}</Text></View>:cita&&<>
   <View style={s.hero}><Text style={s.heroTime}>{fechaHora(cita.fechaInicio)}</Text><Text style={s.heroService}>{cita.servicio?.nombre??"Servicio"}</Text><Text style={s.heroStatus}>{estado(cita.estado)}</Text></View>
   <Section title="Cliente"><Row label="Nombre" value={nombre(cita.cliente)||"Cliente"}/><Row label="Teléfono" value={cita.cliente?.telefono||"—"}/><Row label="Email" value={cita.cliente?.email||"—"}/></Section>
   <Section title="Servicio"><Row label="Servicio" value={cita.servicio?.nombre||"—"}/>{cita.servicioVariante?.nombre?<Row label="Variante" value={cita.servicioVariante.nombre}/>:null}<Row label="Profesional" value={nombre(cita.profesional)||"—"}/><Row label="Sucursal" value={cita.sucursal?.nombre||"—"}/><Row label="Precio" value={moneda(cita.precio)}/></Section>
   {cita.notas?<Section title="Notas"><Text style={s.notes}>{cita.notas}</Text></Section>:null}
 </>}</ScrollView></SafeAreaView>;
}
function Section({title,children}:{title:string;children:any}){return <View style={s.card}><Text style={s.section}>{title}</Text>{children}</View>}
function Row({label,value}:{label:string;value:string}){return <View style={s.row}><Text style={s.label}>{label}</Text><Text style={s.value}>{value}</Text></View>}
function nombre(p?:{nombre?:string;apellidos?:string}){return[p?.nombre,p?.apellidos].filter(Boolean).join(" ")}
function estado(v?:string){return v==="EnProceso"?"En proceso":v==="NoAsistio"?"No asistió":v??"Pendiente"}
function moneda(v?:number){return new Intl.NumberFormat("es-CR",{style:"currency",currency:"CRC",maximumFractionDigits:0}).format(Number(v??0))}
function fechaHora(raw?:string){if(!raw)return"Fecha no disponible";const v=/Z$|[+-]\d{2}:\d{2}$/.test(raw)?raw:`${raw}Z`;return new Intl.DateTimeFormat("es-CR",{timeZone:"America/Costa_Rica",weekday:"long",day:"numeric",month:"long",hour:"numeric",minute:"2-digit",hour12:true}).format(new Date(v))}
const s=StyleSheet.create({page:{flex:1,backgroundColor:"#f4f6f8"},loading:{flex:1,alignItems:"center",justifyContent:"center",gap:10,backgroundColor:"#f4f6f8"},muted:{color:"#64748b"},top:{padding:20,paddingTop:14,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},back:{color:"#2563eb",fontWeight:"700"},title:{fontSize:18,fontWeight:"900",color:"#111827"},content:{padding:20,paddingTop:4,paddingBottom:40},hero:{backgroundColor:"#111827",borderRadius:24,padding:22,marginBottom:14},heroTime:{color:"#cbd5e1",textTransform:"capitalize"},heroService:{color:"#fff",fontSize:26,fontWeight:"900",marginTop:8},heroStatus:{color:"#93c5fd",fontWeight:"800",marginTop:8},card:{backgroundColor:"#fff",borderRadius:20,padding:18,marginBottom:14},section:{fontSize:17,fontWeight:"900",color:"#111827",marginBottom:10},row:{flexDirection:"row",justifyContent:"space-between",gap:20,paddingVertical:10,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:"#e2e8f0"},label:{color:"#64748b"},value:{color:"#111827",fontWeight:"700",textAlign:"right",flex:1},notes:{color:"#475569",lineHeight:21},error:{color:"#9f1239"}});
