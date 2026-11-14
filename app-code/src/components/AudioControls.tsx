import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AudioContext, AudioManager, AudioRecorder } from 'react-native-audio-api';

export function AudioControls() {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState('جاهز للبدء');
  const recorder = useRef<AudioRecorder | null>(null);
  const context = useRef<AudioContext | null>(null);
  const gain = useRef<any>(null);
  const busy = useRef(false);

  useEffect(() => {
    recorder.current = new AudioRecorder();
    context.current = new AudioContext();
    gain.current = context.current.createGain();
    gain.current.gain.value = 1.5;
    gain.current.connect(context.current.destination);
    return () => {
      void (async () => {
        try { await recorder.current?.stop(); } catch {}
        try { context.current?.close(); } catch {}
        try { await AudioManager.setAudioSessionActivity(false); } catch {}
      })();
    };
  }, []);

  const stop = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      recorder.current?.disconnect();
      await recorder.current?.stop();
      await context.current?.suspend();
      await AudioManager.setAudioSessionActivity(false);
      setActive(false);
      setStatus('تم إيقاف الاستماع');
    } catch (e) {
      setStatus('تعذر إيقاف الصوت بشكل طبيعي');
    } finally { busy.current = false; }
  };

  const start = async () => {
    if (busy.current || active || !recorder.current || !context.current || !gain.current) return;
    busy.current = true;
    setStatus('جارٍ طلب إذن الميكروفون...');
    try {
      const permission = await AudioManager.requestRecordingPermissions();
      if (permission !== 'Granted') {
        setStatus('يلزم السماح باستخدام الميكروفون من الهاتف');
        return;
      }
      await AudioManager.setAudioSessionActivity(true);
      if (context.current.state === 'suspended') await context.current.resume();
      recorder.current.connect(context.current, gain.current);
      const result = await recorder.current.start();
      if (result.status === 'error') throw new Error(result.message);
      setActive(true);
      setStatus('يعمل الميكروفون والصوت المباشر. استخدم سماعات أذن سلكية أو Bluetooth.');
    } catch (e) {
      try { recorder.current?.disconnect(); await recorder.current?.stop(); } catch {}
      try { await context.current?.suspend(); await AudioManager.setAudioSessionActivity(false); } catch {}
      setStatus('تعذر تشغيل الصوت: تحقق من إذن الميكروفون وتوصيل سماعات الأذن');
      setActive(false);
    } finally { busy.current = false; }
  };

  return <View style={s.card}>
    <Text style={s.title}>الاستماع المباشر</Text>
    <Text style={s.status}>{status}</Text>
    <Pressable accessibilityRole="button" onPress={active ? stop : start} style={[s.button,active&&s.stop]}>
      <Text style={s.buttonText}>{active?'إيقاف الاستماع':'ابدأ الاستماع'}</Text>
    </Pressable>
    <Text style={s.hint}>يتطلب إذن الميكروفون. استخدم سماعات الأذن لتجنب الصدى والصفير. مستوى التضخيم الأولي محدود لحماية السمع.</Text>
  </View>;
}
const s=StyleSheet.create({card:{backgroundColor:'#fff',padding:18,borderRadius:20,gap:10},title:{fontSize:18,fontWeight:'800',textAlign:'right',color:'#123B4B'},status:{textAlign:'right',color:'#607783',lineHeight:22},button:{backgroundColor:'#167B56',padding:15,borderRadius:13},stop:{backgroundColor:'#A33D3D'},buttonText:{color:'#fff',fontWeight:'800',textAlign:'center',fontSize:16},hint:{fontSize:12,color:'#75858D',textAlign:'right',lineHeight:19}});
