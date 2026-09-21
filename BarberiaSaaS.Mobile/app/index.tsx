import { router } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.card}>
        <View style={styles.logo}><Text style={styles.logoText}>BS</Text></View>
        <Text style={styles.title}>Barbería SaaS</Text>
        <Text style={styles.subtitle}>Tu negocio, más simple.</Text>
        <Text style={styles.description}>
          Agenda, clientes, ventas y profesionales desde cualquier lugar.
        </Text>
        <Pressable style={styles.primary} onPress={() => router.push("/login")}>
          <Text style={styles.primaryText}>INICIAR SESIÓN</Text>
        </Pressable>
        <Text style={styles.trial}>Gestión para barberías, salones y centros de belleza</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:"#f3f5f8",justifyContent:"center",padding:22},
  card:{backgroundColor:"#fff",borderRadius:28,padding:30,shadowColor:"#0f172a",shadowOpacity:.10,shadowRadius:28,shadowOffset:{width:0,height:12},elevation:5},
  logo:{width:76,height:76,borderRadius:22,backgroundColor:"#1f2937",alignSelf:"center",alignItems:"center",justifyContent:"center"},
  logoText:{color:"#fff",fontSize:26,fontWeight:"800"},
  title:{fontSize:31,fontWeight:"800",color:"#111827",textAlign:"center",marginTop:22},
  subtitle:{fontSize:18,color:"#64748b",textAlign:"center",marginTop:6},
  description:{fontSize:16,lineHeight:24,color:"#64748b",textAlign:"center",marginTop:24,marginBottom:30},
  primary:{height:56,borderRadius:15,backgroundColor:"#1f2937",alignItems:"center",justifyContent:"center"},
  primaryText:{color:"#fff",fontSize:15,fontWeight:"800"},
  trial:{fontSize:12,color:"#9ca3af",textAlign:"center",marginTop:24}
});
