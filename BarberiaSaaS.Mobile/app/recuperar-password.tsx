import { useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import api from "@/src/services/api";

export default function RecuperarPasswordScreen(){
 const [email,setEmail]=useState("");const [mensaje,setMensaje]=useState("");const [loading,setLoading]=useState(false);
 const enviar=async()=>{setLoading(true);setMensaje("");try{const {data}=await api.post("/Auth/solicitar-recuperacion-password",{email});setMensaje(data.mensaje);}catch{setMensaje("No fue posible procesar la solicitud.");}finally{setLoading(false);}};
 return <SafeAreaView style={styles.page}><View style={styles.card}><View style={styles.logo}><Text style={styles.logoText}>BS</Text></View>
 <Text style={styles.title}>Recuperar contraseña</Text><Text style={styles.subtitle}>Te enviaremos un enlace seguro a tu correo.</Text>
 {mensaje?<Text style={styles.message}>{mensaje}</Text>:null}<Text style={styles.label}>Correo electrónico</Text><TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="correo@ejemplo.com"/>
 <Pressable style={styles.button} onPress={enviar} disabled={loading}>{loading?<ActivityIndicator color="#fff"/>:<Text style={styles.buttonText}>Enviar enlace</Text>}</Pressable>
 <Pressable onPress={()=>router.back()}><Text style={styles.back}>Volver a iniciar sesión</Text></Pressable></View></SafeAreaView>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:"#f3f5f8",justifyContent:"center",padding:22},card:{backgroundColor:"#fff",borderRadius:28,padding:28},logo:{width:70,height:70,borderRadius:21,backgroundColor:"#1f2937",alignSelf:"center",alignItems:"center",justifyContent:"center"},logoText:{color:"#fff",fontSize:24,fontWeight:"800"},title:{fontSize:26,fontWeight:"800",textAlign:"center",color:"#111827",marginTop:20},subtitle:{textAlign:"center",color:"#6b7280",marginTop:7,marginBottom:24},label:{fontWeight:"700",color:"#374151",marginBottom:8},input:{height:54,borderWidth:1,borderColor:"#d9dee7",borderRadius:14,paddingHorizontal:15,fontSize:16},button:{height:56,borderRadius:14,backgroundColor:"#1f2937",alignItems:"center",justifyContent:"center",marginTop:20},buttonText:{color:"#fff",fontWeight:"800"},back:{color:"#2563eb",textAlign:"center",marginTop:24},message:{padding:12,borderRadius:12,backgroundColor:"#eff6ff",color:"#1e40af",marginBottom:20}});
