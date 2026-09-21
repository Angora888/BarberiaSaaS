import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import api from "@/src/services/api";import {dinero,fechaHora as fechaRegional,obtenerRegional,Regional} from "@/src/services/regional";
import { cerrarSesion } from "@/src/services/session";

type Cita={id:number;fechaInicio?:string;fechaFin?:string;precio?:number;estado?:string;notas?:string;cliente?:{nombre?:string;apellidos?:string;telefono?:string};profesional?:{nombre?:string;apellidos?:string};servicio?:{nombre?:string};servicioVariante?:{nombre?:string}|null};

export default function AgendaScreen(){
 const [regional,setRegional]=useState<Regional>({moneda:"CRC",zonaHoraria:"America/Costa_Rica",idioma:"es",locale:"es-CR"});
 const [fecha,setFecha]=useState(hoyCR());
 const [citas,setCitas]=useState<Cita[]>([]);
 const [cargando,setCargando]=useState(true);
 const [refrescando,setRefrescando]=useState(false);
 const [error,setError]=useState("");

 const cargar=useCallback(async(refresh=false)=>{
   refresh?setRefrescando(true):setCargando(true);setError("");
   try{
     const r=await api.get("/Citas",{params:{desde:`${fecha}T00:00:00`,hasta:`${fecha}T23:59:59`}});
     setCitas(Array.isArray(r.data)?r.data:[]);
   }catch(e:any){
     if(e?.response?.status===401){await cerrarSesion();router.replace("/login");return;}
     setError(e?.response?.data?.mensaje??"No fue posible cargar la agenda.");
   }finally{setCargando(false);setRefrescando(false);}
 },[fecha]);

 useEffect(()=>{obtenerRegional().then(setRegional);cargar();},[cargar]);
 const activas=useMemo(()=>citas.filter(c=>c.estado!=="Cancelada").sort((a,b)=>timestamp(a)-timestamp(b)),[citas]);

 return <SafeAreaView style={s.page}>
   <View style={s.top}><Pressable onPress={()=>router.back()}><Text style={s.back}>‹ Dashboard</Text></Pressable><Text style={s.title}>Agenda</Text><Pressable onPress={()=>router.push("/nueva-cita")}><Text style={s.add}>＋ Nueva</Text></Pressable></View>
   <View style={s.dateNav}><Pressable style={s.navBtn} onPress={()=>setFecha(mover(fecha,-1))}><Text style={s.navText}>‹</Text></Pressable>
     <Pressable onPress={()=>setFecha(hoyCR())}><Text style={s.date}>{fechaLarga(fecha)}</Text><Text style={s.today}>{fecha===hoyCR()?"Hoy":"Tocar para volver a hoy"}</Text></Pressable>
     <Pressable style={s.navBtn} onPress={()=>setFecha(mover(fecha,1))}><Text style={s.navText}>›</Text></Pressable></View>
   {cargando?<View style={s.loading}><ActivityIndicator size="large"/><Text style={s.muted}>Cargando agenda...</Text></View>:
   <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refrescando} onRefresh={()=>cargar(true)}/>}>
     {error?<View style={s.error}><Text style={s.errorText}>{error}</Text><Pressable onPress={()=>cargar()}><Text style={s.retry}>Reintentar</Text></Pressable></View>:null}
     <View style={s.summary}><View><Text style={s.summaryNumber}>{activas.length}</Text><Text style={s.muted}>citas activas</Text></View><View><Text style={s.summaryNumber}>{activas.filter(c=>c.estado==="Completada").length}</Text><Text style={s.muted}>completadas</Text></View></View>
     {activas.length===0?<View style={s.empty}><Text style={s.emptyIcon}>📅</Text><Text style={s.emptyTitle}>Día libre</Text><Text style={s.muted}>No hay citas activas para esta fecha.</Text></View>:
       activas.map(c=><Pressable key={c.id} style={s.card} onPress={()=>router.push({pathname:"/cita/[id]",params:{id:String(c.id)}})}>
         <View style={s.timeCol}><Text style={s.time}>{hora(c)}</Text><Text style={s.duration}>{duracion(c)}</Text></View>
         <View style={s.body}><View style={s.cardTop}><Text style={s.client}>{nombre(c.cliente)||"Cliente"}</Text><Text style={[s.badge,badgeStyle(c.estado)]}>{estado(c.estado)}</Text></View>
         <Text style={s.service}>{c.servicio?.nombre??"Servicio"}{c.servicioVariante?.nombre?` · ${c.servicioVariante.nombre}`:""}</Text>
         <Text style={s.prof}>✂️ {nombre(c.profesional)||"Profesional"}</Text>
         {c.precio!=null?<Text style={s.price}>{dinero(c.precio,regional)}</Text>:null}</View>
       </Pressable>)}
     <Text style={s.hint}>Desliza hacia abajo para actualizar</Text>
   </ScrollView>}
 </SafeAreaView>;
}
function hoyCR(){try{const p=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Costa_Rica",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());const v=(t:string)=>p.find(x=>x.type===t)?.value;return `${v("year")}-${v("month")}-${v("day")}`;}catch{return new Date().toISOString().slice(0,10);}}
function mover(f:string,d:number){const [y,m,day]=f.split("-").map(Number);const x=new Date(y,m-1,day+d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;}
function fechaLarga(f:string){const[y,m,d]=f.split("-").map(Number);return new Intl.DateTimeFormat("es-CR",{weekday:"short",day:"numeric",month:"short"}).format(new Date(y,m-1,d));}
function timestamp(c:Cita){if(!c.fechaInicio)return 0;const v=/Z$|[+-]\d{2}:\d{2}$/.test(c.fechaInicio)?c.fechaInicio:`${c.fechaInicio}Z`;return new Date(v).getTime();}
function hora(c:Cita){const t=timestamp(c);return t?new Intl.DateTimeFormat("es-CR",{timeZone:"America/Costa_Rica",hour:"numeric",minute:"2-digit",hour12:true}).format(new Date(t)):"--:--";}
function duracion(c:Cita){if(!c.fechaInicio||!c.fechaFin)return"";const a=timestamp(c);const raw=c.fechaFin;const b=new Date(/Z$|[+-]\d{2}:\d{2}$/.test(raw)?raw:`${raw}Z`).getTime();const min=Math.round((b-a)/60000);return min>0?`${min} min`:"";}
function nombre(p?:{nombre?:string;apellidos?:string}){return[p?.nombre,p?.apellidos].filter(Boolean).join(" ");}
function estado(v?:string){return v==="EnProceso"?"En proceso":v==="NoAsistio"?"No asistió":v??"Pendiente";}
function badgeStyle(v?:string){if(v==="Completada")return{backgroundColor:"#e8f7ee",color:"#16803d"};if(v==="Confirmada")return{backgroundColor:"#eaf2ff",color:"#2563eb"};if(v==="EnProceso")return{backgroundColor:"#fff4db",color:"#9a6700"};return{backgroundColor:"#f1f5f9",color:"#475569"};}
const s=StyleSheet.create({page:{flex:1,backgroundColor:"#f4f6f8"},top:{paddingHorizontal:20,paddingTop:14,paddingBottom:10,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},back:{color:"#2563eb",fontWeight:"700"},add:{color:"#2563eb",fontWeight:"800"},title:{fontSize:20,fontWeight:"900",color:"#111827"},dateNav:{marginHorizontal:20,marginBottom:10,backgroundColor:"#fff",borderRadius:20,padding:12,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},navBtn:{width:42,height:42,borderRadius:14,backgroundColor:"#f1f5f9",alignItems:"center",justifyContent:"center"},navText:{fontSize:28,color:"#111827",lineHeight:30},date:{fontSize:17,fontWeight:"900",color:"#111827",textAlign:"center",textTransform:"capitalize"},today:{fontSize:11,color:"#64748b",textAlign:"center",marginTop:2},loading:{flex:1,alignItems:"center",justifyContent:"center",gap:10},content:{padding:20,paddingTop:10,paddingBottom:40},muted:{color:"#64748b"},summary:{backgroundColor:"#111827",borderRadius:20,padding:18,marginBottom:14,flexDirection:"row",justifyContent:"space-around"},summaryNumber:{fontSize:26,fontWeight:"900",color:"#fff",textAlign:"center"},card:{backgroundColor:"#fff",borderRadius:20,padding:16,marginBottom:12,flexDirection:"row"},timeCol:{width:78,paddingRight:12,borderRightWidth:StyleSheet.hairlineWidth,borderRightColor:"#e2e8f0"},time:{fontSize:14,fontWeight:"900",color:"#111827"},duration:{fontSize:11,color:"#94a3b8",marginTop:4},body:{flex:1,paddingLeft:14},cardTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:8},client:{fontSize:16,fontWeight:"900",color:"#111827",flex:1},badge:{fontSize:10,fontWeight:"800",paddingHorizontal:8,paddingVertical:5,borderRadius:999,overflow:"hidden"},service:{color:"#475569",marginTop:6},prof:{color:"#64748b",fontSize:12,marginTop:5},price:{fontWeight:"900",color:"#111827",marginTop:8},empty:{backgroundColor:"#fff",borderRadius:20,padding:32,alignItems:"center"},emptyIcon:{fontSize:32},emptyTitle:{fontSize:18,fontWeight:"900",color:"#111827",marginTop:8,marginBottom:4},error:{backgroundColor:"#fff1f2",borderRadius:16,padding:15,marginBottom:12},errorText:{color:"#9f1239"},retry:{color:"#2563eb",fontWeight:"800",marginTop:7},hint:{textAlign:"center",color:"#94a3b8",fontSize:11,marginTop:12}});
