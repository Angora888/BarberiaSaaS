import { useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import api from "@/src/services/api";
import { guardarSesion } from "@/src/services/session";

export default function LoginScreen() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  const login=async()=>{
    if(!email.trim()||!password){setError("Ingresa tu correo y contraseña.");return;}
    setLoading(true);setError("");
    try{
      const {data}=await api.post("/Auth/login",{email:email.trim(),password});
      await guardarSesion(data.token,data.usuario);
      router.replace("/dashboard");
    }catch(err:any){
      setError(err?.response?.data?.mensaje ?? "No fue posible iniciar sesión.");
    }finally{setLoading(false);}
  };

  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined}>
        <View style={styles.card}>
          <View style={styles.logo}><Text style={styles.logoText}>BS</Text></View>
          <Text style={styles.title}>Barbería SaaS</Text>
          <Text style={styles.subtitle}>Gestión para barberías, salones y centros de belleza</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="correo@ejemplo.com"/>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" placeholder="••••••••"/>
          <Pressable style={styles.forgot} onPress={()=>router.push("/recuperar-password")}><Text style={styles.link}>¿Olvidaste tu contraseña?</Text></Pressable>
          <Pressable style={[styles.button,loading&&styles.disabled]} onPress={login} disabled={loading}>
            {loading?<ActivityIndicator color="#fff"/>:<Text style={styles.buttonText}>Iniciar sesión</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles=StyleSheet.create({
  page:{flex:1,backgroundColor:"#f3f5f8",justifyContent:"center",padding:22},
  card:{backgroundColor:"#fff",borderRadius:28,padding:28,shadowColor:"#0f172a",shadowOpacity:.10,shadowRadius:28,shadowOffset:{width:0,height:12},elevation:5},
  logo:{width:70,height:70,borderRadius:21,backgroundColor:"#1f2937",alignSelf:"center",alignItems:"center",justifyContent:"center"},
  logoText:{color:"#fff",fontSize:24,fontWeight:"800"},title:{fontSize:29,fontWeight:"800",color:"#111827",textAlign:"center",marginTop:20},
  subtitle:{fontSize:14,lineHeight:20,color:"#6b7280",textAlign:"center",marginTop:7,marginBottom:28},
  label:{fontSize:14,fontWeight:"700",color:"#374151",marginBottom:8,marginTop:12},
  input:{height:54,borderWidth:1,borderColor:"#d9dee7",borderRadius:14,paddingHorizontal:15,fontSize:16,color:"#111827"},
  forgot:{alignSelf:"flex-end",paddingVertical:16},link:{color:"#2563eb",fontSize:14},
  button:{height:56,borderRadius:14,backgroundColor:"#1f2937",alignItems:"center",justifyContent:"center"},
  disabled:{opacity:.7},buttonText:{color:"#fff",fontSize:16,fontWeight:"800"},
  error:{backgroundColor:"#fef2f2",color:"#b91c1c",borderRadius:12,padding:12,marginBottom:8}
});
