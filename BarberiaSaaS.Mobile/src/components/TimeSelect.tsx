import {useMemo,useState} from "react";
import {Modal,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from "react-native";
import {horaCorta,Regional} from "@/src/services/regional";

type Props={label?:string;value:string;onChange:(value:string)=>void;regional:Regional;step?:number};

export default function TimeSelect({label,value,onChange,regional,step=15}:Props){
 const[open,setOpen]=useState(false);
 const options=useMemo(()=>Array.from({length:Math.floor((24*60)/step)},(_,i)=>{const n=i*step;return `${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`}),[step]);
 return <View style={s.wrap}>{label?<Text style={s.label}>{label}</Text>:null}
  <Pressable style={s.field} onPress={()=>setOpen(true)}><Text style={s.value}>{horaCorta(value,regional)}</Text><Text style={s.arrow}>⌄</Text></Pressable>
  <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setOpen(false)}>
   <SafeAreaView style={s.modal}><View style={s.head}><Text style={s.title}>Seleccionar hora</Text><Pressable onPress={()=>setOpen(false)}><Text style={s.close}>Cerrar</Text></Pressable></View>
    <ScrollView contentContainerStyle={s.list}>{options.map(x=><Pressable key={x} style={[s.option,x===value&&s.selected]} onPress={()=>{onChange(x);setOpen(false)}}><Text style={[s.optionText,x===value&&s.selectedText]}>{horaCorta(x,regional)}</Text>{x===value?<Text style={s.check}>✓</Text>:null}</Pressable>)}</ScrollView>
   </SafeAreaView>
  </Modal>
 </View>
}
const s=StyleSheet.create({wrap:{flex:1},label:{fontWeight:"800",fontSize:12,color:"#475569",marginBottom:6},field:{backgroundColor:"#fff",borderWidth:1,borderColor:"#e2e8f0",borderRadius:14,paddingHorizontal:14,height:52,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},value:{fontSize:16,fontWeight:"800",color:"#111827"},arrow:{fontSize:20,color:"#64748b"},modal:{flex:1,backgroundColor:"#f4f6f8"},head:{padding:20,flexDirection:"row",justifyContent:"space-between",alignItems:"center",borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:"#e2e8f0"},title:{fontSize:22,fontWeight:"900",color:"#111827"},close:{color:"#2563eb",fontWeight:"900"},list:{padding:16,paddingBottom:40},option:{backgroundColor:"#fff",borderRadius:14,paddingHorizontal:16,paddingVertical:15,marginBottom:8,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},selected:{borderWidth:1,borderColor:"#2563eb",backgroundColor:"#eff6ff"},optionText:{fontSize:16,fontWeight:"700",color:"#334155"},selectedText:{color:"#1d4ed8"},check:{color:"#2563eb",fontWeight:"900",fontSize:18}});
