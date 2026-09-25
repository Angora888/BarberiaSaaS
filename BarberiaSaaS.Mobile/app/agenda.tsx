import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "@/src/services/api";import {dinero,duracionCorta,fechaCorta,hoyRegional,obtenerRegional,REGIONAL_DEFAULT,Regional} from "@/src/services/regional";
import { cerrarSesion } from "@/src/services/session";

type Cita={id:number;fechaInicio?:string;fechaFin?:string;fechaInicioLocal?:string;precio?:number;estado?:string;notas?:string;cliente?:{nombre?:string;apellidos?:string;telefono?:string};profesional?:{nombre?:string;apellidos?:string};servicio?:{nombre?:string};servicioVariante?:{nombre?:string}|null};
type Modo="dia"|"semana";

export default function AgendaScreen(){
 const insets=useSafeAreaInsets();
 const [regional,setRegional]=useState<Regional>(REGIONAL_DEFAULT),[fecha,setFecha]=useState(""),[modo,setModo]=useState<Modo>("dia");
 const [citas,setCitas]=useState<Cita[]>([]),[cargando,setCargando]=useState(true),[refrescando,setRefrescando]=useState(false),[error,setError]=useState("");

 const rango=useMemo(()=>modo==="semana"?rangoSemana(fecha):{inicio:fecha,fin:fecha},[fecha,modo]);
 const cargar=useCallback(async(refresh=false)=>{
   if(!fecha)return;refresh?setRefrescando(true):setCargando(true);setError("");
   try{
     const r=await api.get("/Citas",{params:{desde:`${rango.inicio}T00:00:00`,hasta:`${rango.fin}T23:59:59`}});
     setCitas(Array.isArray(r.data)?r.data:[]);
   }catch(e:any){
     if(e?.response?.status===401){await cerrarSesion();router.replace("/login");return;}
     setError(e?.response?.data?.mensaje??"No fue posible cargar la agenda.");
   }finally{setCargando(false);setRefrescando(false);}
 },[fecha,rango.inicio,rango.fin]);

 useEffect(()=>{obtenerRegional().then(r=>{setRegional(r);setFecha(x=>x||hoyRegional(r));});},[]);
 useEffect(()=>{if(fecha)cargar();},[cargar,fecha]);

 const activas=useMemo(()=>citas.filter(c=>c.estado!=="Cancelada").sort((a,b)=>timestamp(a)-timestamp(b)),[citas]);
 const dias=useMemo(()=>modo==="semana"?diasSemana(fecha):[],[fecha,modo]);
 const porDia=useMemo(()=>{const m=new Map<string,Cita[]>();for(const d of dias)m.set(d,[]);for(const c of activas){const d=fechaLocalCita(c,regional);if(m.has(d))m.get(d)!.push(c)}return m},[activas,dias,regional]);
 const moverVista=(d:number)=>setFecha(mover(fecha,modo==="semana"?d*7:d));
 const volverHoy=()=>setFecha(hoyRegional(regional));

 return <SafeAreaView style={s.page}>
   <View style={[s.top,{paddingTop:Math.max(insets.top+8,22)}]}><Pressable onPress={()=>router.back()}><Text style={s.back}>‹ Dashboard</Text></Pressable><Text style={s.title}>Agenda</Text><Pressable onPress={()=>router.push("/nueva-cita")}><Text style={s.add}>＋ Nueva</Text></Pressable></View>
   <View style={s.switcher}><Pressable onPress={()=>setModo("dia")} style={[s.switchBtn,modo==="dia"&&s.switchOn]}><Text style={[s.switchText,modo==="dia"&&s.switchTextOn]}>Día</Text></Pressable><Pressable onPress={()=>setModo("semana")} style={[s.switchBtn,modo==="semana"&&s.switchOn]}><Text style={[s.switchText,modo==="semana"&&s.switchTextOn]}>Semana</Text></Pressable></View>
   <View style={s.dateNav}><Pressable style={s.navBtn} onPress={()=>moverVista(-1)}><Text style={s.navText}>‹</Text></Pressable>
     <Pressable onPress={volverHoy}><Text style={s.date}>{modo==="semana"?etiquetaSemana(rango.inicio,rango.fin,regional):fechaCorta(fecha,regional)}</Text><Text style={s.today}>{fecha===hoyRegional(regional)?"Hoy":"Tocar para volver a hoy"}</Text></Pressable>
     <Pressable style={s.navBtn} onPress={()=>moverVista(1)}><Text style={s.navText}>›</Text></Pressable></View>
   {cargando?<View style={s.loading}><ActivityIndicator size="large"/><Text style={s.muted}>Cargando agenda...</Text></View>:
   <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refrescando} onRefresh={()=>cargar(true)}/>}>
     {error?<View style={s.error}><Text style={s.errorText}>{error}</Text><Pressable onPress={()=>cargar()}><Text style={s.retry}>Reintentar</Text></Pressable></View>:null}
     {modo==="dia"?<VistaDia citas={activas} regional={regional}/>:<VistaSemana dias={dias} porDia={porDia} regional={regional} hoy={hoyRegional(regional)} onDia={d=>{setFecha(d);setModo("dia")}}/>}
     <Text style={s.hint}>Desliza hacia abajo para actualizar</Text>
   </ScrollView>}
 </SafeAreaView>;
}

function VistaDia({citas,regional}:{citas:Cita[];regional:Regional}){return <><View style={s.summary}><View><Text style={s.summaryNumber}>{citas.length}</Text><Text style={s.summaryMuted}>citas activas</Text></View><View><Text style={s.summaryNumber}>{citas.filter(c=>c.estado==="Completada").length}</Text><Text style={s.summaryMuted}>completadas</Text></View></View>{citas.length===0?<Vacio texto="No hay citas activas para esta fecha."/>:citas.map(c=><CitaCard key={c.id} c={c} regional={regional}/>)}</>}
function VistaSemana({dias,porDia,regional,hoy,onDia}:{dias:string[];porDia:Map<string,Cita[]>;regional:Regional;hoy:string;onDia:(d:string)=>void}){const total=Array.from(porDia.values()).reduce((n,x)=>n+x.length,0);return <><View style={s.weekSummary}><Text style={s.weekSummaryNumber}>{total}</Text><Text style={s.weekSummaryText}>citas activas esta semana</Text></View>{dias.map(d=>{const cs=porDia.get(d)??[];return <View key={d} style={[s.dayBlock,d===hoy&&s.dayToday]}><Pressable style={s.dayHeader} onPress={()=>onDia(d)}><View><Text style={s.dayTitle}>{fechaCorta(d,regional)}</Text>{d===hoy?<Text style={s.todayBadge}>HOY</Text>:null}</View><Text style={s.dayCount}>{cs.length} {cs.length===1?"cita":"citas"} ›</Text></Pressable>{cs.length?<View style={s.dayAppointments}>{cs.map(c=><CitaCard key={c.id} c={c} regional={regional} compact/>)}</View>:<Text style={s.dayEmpty}>Sin citas</Text>}</View>})}</>}
function CitaCard({c,regional,compact=false}:{c:Cita;regional:Regional;compact?:boolean}){return <Pressable style={[s.card,compact&&s.cardCompact]} onPress={()=>router.push({pathname:"/cita/[id]",params:{id:String(c.id)}})}><View style={s.timeCol}><Text style={s.time}>{hora(c,regional)}</Text><Text style={s.duration}>{duracion(c)}</Text></View><View style={s.body}><View style={s.cardTop}><Text style={s.client}>{nombre(c.cliente)||"Cliente"}</Text><Text style={[s.badge,badgeStyle(c.estado)]}>{estado(c.estado)}</Text></View><Text style={s.service}>{c.servicio?.nombre??"Servicio"}{c.servicioVariante?.nombre?` · ${c.servicioVariante.nombre}`:""}</Text><Text style={s.prof}>✂️ {nombre(c.profesional)||"Profesional"}</Text>{!compact&&c.precio!=null?<Text style={s.price}>{dinero(c.precio,regional)}</Text>:null}</View></Pressable>}
function Vacio({texto}:{texto:string}){return <View style={s.empty}><Text style={s.emptyIcon}>📅</Text><Text style={s.emptyTitle}>Día libre</Text><Text style={s.muted}>{texto}</Text></View>}
function rangoSemana(f:string){if(!f)return{inicio:"",fin:""};const[y,m,d]=f.split("-").map(Number),x=new Date(y,m-1,d,12),dow=x.getDay(),delta=dow===0?-6:1-dow;x.setDate(x.getDate()+delta);const inicio=isoLocal(x),fin=new Date(x);fin.setDate(x.getDate()+6);return{inicio,fin:isoLocal(fin)}}
function diasSemana(f:string){const r=rangoSemana(f),[y,m,d]=r.inicio.split("-").map(Number),x=new Date(y,m-1,d,12);return Array.from({length:7},(_,i)=>{const z=new Date(x);z.setDate(x.getDate()+i);return isoLocal(z)})}
function isoLocal(x:Date){return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`}
function mover(f:string,d:number){const[y,m,day]=f.split("-").map(Number),x=new Date(y,m-1,day+d,12);return isoLocal(x)}
function timestamp(c:Cita){if(!c.fechaInicio)return 0;const v=/Z$|[+-]\d{2}:\d{2}$/.test(c.fechaInicio)?c.fechaInicio:`${c.fechaInicio}Z`;return new Date(v).getTime()}
function fechaLocalCita(c:Cita,r:Regional){if(c.fechaInicioLocal?.includes("T"))return c.fechaInicioLocal.slice(0,10);const t=timestamp(c);if(!t)return"";try{const p=new Intl.DateTimeFormat("en-CA",{timeZone:r.zonaHoraria,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(t)),v=(k:string)=>p.find(x=>x.type===k)?.value;return `${v("year")}-${v("month")}-${v("day")}`}catch{return""}}
function hora(c:Cita,r:Regional){if(c.fechaInicioLocal?.includes("T")){const raw=c.fechaInicioLocal.slice(11,16),[h,m]=raw.split(":").map(Number);try{return new Intl.DateTimeFormat(r.locale,{hour:"numeric",minute:"2-digit",hour12:true}).format(new Date(2000,0,1,h,m))}catch{return raw}}const t=timestamp(c);return t?new Intl.DateTimeFormat(r.locale,{timeZone:r.zonaHoraria,hour:"numeric",minute:"2-digit",hour12:true}).format(new Date(t)):"--:--"}
function duracion(c:Cita){if(!c.fechaInicio||!c.fechaFin)return"";const a=timestamp(c),raw=c.fechaFin,b=new Date(/Z$|[+-]\d{2}:\d{2}$/.test(raw)?raw:`${raw}Z`).getTime(),min=Math.round((b-a)/60000);return min>0?duracionCorta(min):""}
function etiquetaSemana(a:string,b:string,r:Regional){if(!a||!b)return"";return `${fechaCorta(a,r)} – ${fechaCorta(b,r)}`}
function nombre(p?:{nombre?:string;apellidos?:string}){return[p?.nombre,p?.apellidos].filter(Boolean).join(" ")}
function estado(v?:string){return v==="EnProceso"?"En proceso":v==="NoAsistio"?"No asistió":v??"Pendiente"}
function badgeStyle(v?:string){if(v==="Completada")return{backgroundColor:"#e8f7ee",color:"#16803d"};if(v==="Confirmada")return{backgroundColor:"#eaf2ff",color:"#2563eb"};if(v==="EnProceso")return{backgroundColor:"#fff4db",color:"#9a6700"};return{backgroundColor:"#f1f5f9",color:"#475569"}}
const s=StyleSheet.create({page:{flex:1,backgroundColor:"#f4f6f8"},top:{paddingHorizontal:20,paddingBottom:14,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},back:{color:"#2563eb",fontWeight:"700"},add:{color:"#2563eb",fontWeight:"800"},title:{fontSize:20,fontWeight:"900",color:"#111827"},switcher:{marginHorizontal:20,marginBottom:10,backgroundColor:"#e2e8f0",borderRadius:14,padding:3,flexDirection:"row"},switchBtn:{flex:1,paddingVertical:9,borderRadius:11,alignItems:"center"},switchOn:{backgroundColor:"#fff"},switchText:{fontWeight:"800",color:"#64748b"},switchTextOn:{color:"#111827"},dateNav:{marginHorizontal:20,marginBottom:10,backgroundColor:"#fff",borderRadius:20,padding:12,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},navBtn:{width:42,height:42,borderRadius:14,backgroundColor:"#f1f5f9",alignItems:"center",justifyContent:"center"},navText:{fontSize:28,color:"#111827",lineHeight:30},date:{fontSize:15,fontWeight:"900",color:"#111827",textAlign:"center",textTransform:"capitalize"},today:{fontSize:11,color:"#64748b",textAlign:"center",marginTop:2},loading:{flex:1,alignItems:"center",justifyContent:"center",gap:10},content:{padding:20,paddingTop:10,paddingBottom:40},muted:{color:"#64748b"},summary:{backgroundColor:"#111827",borderRadius:20,padding:18,marginBottom:14,flexDirection:"row",justifyContent:"space-around"},summaryNumber:{fontSize:26,fontWeight:"900",color:"#fff",textAlign:"center"},summaryMuted:{color:"#cbd5e1"},weekSummary:{backgroundColor:"#111827",borderRadius:20,padding:17,marginBottom:14,flexDirection:"row",alignItems:"baseline",gap:8},weekSummaryNumber:{fontSize:27,fontWeight:"900",color:"#fff"},weekSummaryText:{color:"#cbd5e1"},dayBlock:{backgroundColor:"#fff",borderRadius:18,padding:13,marginBottom:11,borderWidth:1,borderColor:"transparent"},dayToday:{borderColor:"#2563eb"},dayHeader:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingVertical:3},dayTitle:{fontSize:16,fontWeight:"900",color:"#111827",textTransform:"capitalize"},todayBadge:{fontSize:9,fontWeight:"900",color:"#2563eb",marginTop:2},dayCount:{fontSize:12,fontWeight:"800",color:"#64748b"},dayAppointments:{marginTop:10},dayEmpty:{color:"#94a3b8",fontSize:12,paddingVertical:10},card:{backgroundColor:"#fff",borderRadius:20,padding:16,marginBottom:12,flexDirection:"row"},cardCompact:{backgroundColor:"#f8fafc",borderRadius:14,padding:11,marginBottom:8},timeCol:{width:78,paddingRight:12,borderRightWidth:StyleSheet.hairlineWidth,borderRightColor:"#e2e8f0"},time:{fontSize:14,fontWeight:"900",color:"#111827"},duration:{fontSize:11,color:"#94a3b8",marginTop:4},body:{flex:1,paddingLeft:14},cardTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:8},client:{fontSize:16,fontWeight:"900",color:"#111827",flex:1},badge:{fontSize:10,fontWeight:"800",paddingHorizontal:8,paddingVertical:5,borderRadius:999,overflow:"hidden"},service:{color:"#475569",marginTop:6},prof:{color:"#64748b",fontSize:12,marginTop:5},price:{fontWeight:"900",color:"#111827",marginTop:8},empty:{backgroundColor:"#fff",borderRadius:20,padding:32,alignItems:"center"},emptyIcon:{fontSize:32},emptyTitle:{fontSize:18,fontWeight:"900",color:"#111827",marginTop:8,marginBottom:4},error:{backgroundColor:"#fff1f2",borderRadius:16,padding:15,marginBottom:12},errorText:{color:"#9f1239"},retry:{color:"#2563eb",fontWeight:"800",marginTop:7},hint:{textAlign:"center",color:"#94a3b8",fontSize:11,marginTop:12}});
