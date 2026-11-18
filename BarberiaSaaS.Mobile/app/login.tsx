import { useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import api from "@/src/services/api";
import AppleSignIn from "@/src/components/AppleSignIn";
import { guardarSesion } from "@/src/services/session";
import { registrarPushNotifications } from "@/src/services/push";
import BrandEmblem from "@/src/components/BrandEmblem";
import { brand, brandName, isMiAgendaIOS } from "@/src/theme/brand";

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
      try {
        await registrarPushNotifications();
      } catch (pushError) {
        console.warn("No fue posible registrar push:", pushError);
      }
      router.replace(data.usuario?.rol === "Profesional" ? "/agenda" : "/dashboard");
    }catch(err:any){
      setError(err?.response?.data?.mensaje ?? "No fue posible iniciar sesión.");
    }finally{setLoading(false);}
  };

  return (
    <SafeAreaView style={[styles.page, isMiAgendaIOS && { backgroundColor: brand.canvas }]}>
      <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined}>
        <View style={[styles.card, isMiAgendaIOS && { borderWidth: 1, borderColor: brand.stroke }]}>
          <BrandEmblem size={76} />
          <Text style={[styles.title, isMiAgendaIOS && { color: brand.ink }]}>{brandName}</Text>
          <Text style={styles.subtitle}>{isMiAgendaIOS ? "La agenda de tu negocio, siempre contigo." : "Gestión para barberías, salones y centros de belleza"}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput style={[styles.input, isMiAgendaIOS && { borderColor: brand.stroke }]} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="correo@ejemplo.com"/>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" placeholder="••••••••"/>
          <Pressable style={styles.forgot} onPress={()=>router.push("/recuperar-password")}><Text style={[styles.link, isMiAgendaIOS && { color: brand.primary }]}>¿Olvidaste tu contraseña?</Text></Pressable>
          <Pressable style={[styles.button, isMiAgendaIOS && { backgroundColor: brand.primary }, loading&&styles.disabled]} onPress={login} disabled={loading}>
            {loading?<ActivityIndicator color="#fff"/>:<Text style={styles.buttonText}>Iniciar sesión</Text>}
          </Pressable>
          {isMiAgendaIOS && <Text style={styles.dividerText}>o continuá con</Text>}
          <AppleSignIn mode="login" onSuccess={(role) => router.replace(role === "Profesional" ? "/agenda" : "/dashboard")} />
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
  dividerText:{color:"#846575",fontSize:12,textAlign:"center",marginTop:18,fontWeight:"700"},
  error:{backgroundColor:"#fef2f2",color:"#b91c1c",borderRadius:12,padding:12,marginBottom:8}
});
