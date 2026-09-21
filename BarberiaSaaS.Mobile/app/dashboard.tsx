import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { cerrarSesion, obtenerUsuario, UsuarioSesion } from "@/src/services/session";

export default function DashboardScreen(){
  const [usuario,setUsuario]=useState<UsuarioSesion|null>(null);
  useEffect(()=>{obtenerUsuario().then(u=>{if(!u)router.replace("/login");else setUsuario(u);});},[]);
  const salir=async()=>{await cerrarSesion();router.replace("/login");};
  return <SafeAreaView style={styles.page}><View style={styles.header}>
    <View><Text style={styles.hello}>Hola, {usuario?.nombre ?? ""} 👋</Text><Text style={styles.business}>{usuario?.negocio ?? "Barbería SaaS"}</Text></View>
    <Pressable onPress={salir}><Text style={styles.logout}>Salir</Text></Pressable>
  </View>
  <Text style={styles.heading}>Dashboard</Text>
  <View style={styles.card}><Text style={styles.cardTitle}>📅 Agenda</Text><Text style={styles.cardText}>Aquí construiremos tus citas y disponibilidad.</Text></View>
  <View style={styles.row}><View style={styles.smallCard}><Text style={styles.cardTitle}>👥 Clientes</Text></View><View style={styles.smallCard}><Text style={styles.cardTitle}>✂️ Profesionales</Text></View></View>
  </SafeAreaView>;
}
const styles=StyleSheet.create({
 page:{flex:1,backgroundColor:"#f5f6f8",padding:22},header:{marginTop:18,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
 hello:{fontSize:22,fontWeight:"800",color:"#111827"},business:{color:"#64748b",marginTop:4},logout:{color:"#2563eb",fontWeight:"700"},
 heading:{fontSize:28,fontWeight:"800",color:"#111827",marginTop:34,marginBottom:18},card:{backgroundColor:"#fff",borderRadius:20,padding:22,marginBottom:14},
 cardTitle:{fontSize:17,fontWeight:"800",color:"#1f2937"},cardText:{color:"#64748b",marginTop:8,lineHeight:20},row:{flexDirection:"row",gap:14},
 smallCard:{flex:1,backgroundColor:"#fff",borderRadius:20,padding:20,minHeight:100}
});
