import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import api from "@/src/services/api";
type Cliente={id:number;nombre:string;apellidos?:string;telefono?:string;email?:string;deuda?:number};
export default function ClientesScreen(){
 const [clientes,setClientes]=useState<Cliente[]>([]),[q,setQ]=useState(""),[loading,setLoading]=useState(true),[refresh,setRefresh]=useState(false),[error,setError]=useState("");
 const cargar=useCallback(async(r=false)=>{r?setRefresh(true):setLoading(true);setError("");try{const x=await api.get("/Clientes");setClientes(Array.isArray(x.data)?x.data:[]);}catch(e:any){setError(e?.response?.data?.mensaje??"No fue posible cargar los clientes.");}finally{setLoading(false);setRefresh(false)}},[]);
 useEffect(()=>{cargar()},[cargar]);
 const lista=useMemo(()=>{const s=q.trim().toLowerCase();return !s?clientes:clientes.filter(c=>[c.nombre,c.apellidos,c.telefono,c.email].filter(Boolean).join(" ").toLowerCase().includes(s))},[clientes,q]);
 if(loading)return <SafeAreaView style={s.center}><ActivityIndicator size="large"/><Text style={s.muted}>Cargando clientes...</Text></SafeAreaView>;
 return <SafeAreaView style={s.page}><ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refresh} onRefresh={()=>cargar(true)}/>}>
  <View style={s.header}><Pressable onPress={()=>router.back()}><Text style={s.back}>‹ Volver</Text></Pressable><Pressable onPress={()=>router.push("/nuevo-cliente")} style={s.newBtn}><Text style={s.newText}>＋ Nuevo</Text></Pressable></View>
  <Text style={s.title}>Clientes</Text><Text style={s.sub}>{clientes.length} cliente(s) activo(s)</Text>
  <TextInput value={q} onChangeText={setQ} placeholder="Buscar por nombre, teléfono o email" style={s.input} autoCapitalize="none"/>
  {error?<Text style={s.error}>{error}</Text>:null}
  <View style={s.card}>{lista.length?lista.map((c,i)=><View key={c.id} style={[s.row,i===lista.length-1&&s.last]}><View style={s.avatar}><Text style={s.avatarText}>{(c.nombre?.[0]??"?").toUpperCase()}</Text></View><View style={s.body}><Text style={s.name}>{[c.nombre,c.apellidos].filter(Boolean).join(" ")}</Text><Text style={s.detail}>{c.telefono||c.email||"Sin datos de contacto"}</Text>{Number(c.deuda)>0?<Text style={s.debt}>Saldo pendiente: {money(c.deuda)}</Text>:null}</View></View>):<Text style={s.empty}>No encontramos clientes.</Text>}</View>
 </ScrollView></SafeAreaView>
}
const money=(v?:number)=>new Intl.NumberFormat("es-CR",{style:"currency",currency:"CRC",maximumFractionDigits:0}).format(Number(v??0));
const s=StyleSheet.create({page:{flex:1,backgroundColor:"#f4f6f8"},content:{padding:20,paddingBottom:40},center:{flex:1,alignItems:"center",justifyContent:"center",gap:10},muted:{color:"#64748b"},header:{marginTop:8,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},back:{color:"#2563eb",fontWeight:"800"},newBtn:{backgroundColor:"#111827",borderRadius:12,paddingHorizontal:14,paddingVertical:10},newText:{color:"#fff",fontWeight:"900"},title:{fontSize:30,fontWeight:"900",color:"#111827",marginTop:22},sub:{color:"#64748b",marginTop:4},input:{backgroundColor:"#fff",borderWidth:1,borderColor:"#e2e8f0",borderRadius:16,paddingHorizontal:15,paddingVertical:13,marginTop:18,color:"#111827"},card:{backgroundColor:"#fff",borderRadius:20,paddingHorizontal:16,marginTop:14},row:{flexDirection:"row",alignItems:"center",paddingVertical:15,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:"#e5e7eb"},last:{borderBottomWidth:0},avatar:{width:42,height:42,borderRadius:21,backgroundColor:"#e2e8f0",alignItems:"center",justifyContent:"center",marginRight:12},avatarText:{fontWeight:"900",color:"#334155"},body:{flex:1},name:{fontWeight:"900",color:"#111827"},detail:{color:"#64748b",fontSize:12,marginTop:3},debt:{color:"#be123c",fontSize:11,fontWeight:"800",marginTop:4},empty:{paddingVertical:28,textAlign:"center",color:"#64748b"},error:{color:"#be123c",marginTop:12}});
