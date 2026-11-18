import { router } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import BrandEmblem from "@/src/components/BrandEmblem";
import { brand, brandName, isMiAgendaIOS } from "@/src/theme/brand";

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={[styles.page, isMiAgendaIOS && { backgroundColor: brand.canvas }]}>
      <View style={[styles.card, isMiAgendaIOS && { borderWidth: 1, borderColor: brand.stroke }]}>
        <BrandEmblem size={82} />
        <Text style={[styles.title, isMiAgendaIOS && { color: brand.ink }]}>{brandName}</Text>
        <Text style={styles.subtitle}>{isMiAgendaIOS ? "Tu belleza, tu tiempo, tu agenda." : "Tu negocio, más simple."}</Text>
        <Text style={styles.description}>
          Agenda, clientes, ventas y profesionales desde cualquier lugar.
        </Text>
        <Pressable style={[styles.primary, isMiAgendaIOS && { backgroundColor: brand.primary }]} onPress={() => router.push("/login")}>
          <Text style={styles.primaryText}>{isMiAgendaIOS ? "EMPEZAR AHORA" : "INICIAR SESIÓN"}</Text>
        </Pressable>
        <Text style={styles.trial}>{isMiAgendaIOS ? "Belleza organizada, donde estés ✨" : "Gestión para barberías, salones y centros de belleza"}</Text>
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
