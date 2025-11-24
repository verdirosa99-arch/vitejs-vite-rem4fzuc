import React, { useState, useEffect, useRef } from 'react';
import { 
  Thermometer, 
  ClipboardCheck, 
  Truck, 
  AlertTriangle, 
  CheckCircle, 
  LayoutDashboard, 
  History, 
  Save,
  Plus,
  Trash2,
  Menu,
  X,
  Snowflake,
  Settings,
  Sparkles,      
  MessageSquare, 
  FileSearch,    
  Send,
  Loader2,
  User
} from 'lucide-react';

// --- CONFIGURAZIONE GEMINI API ---
const GEMINI_API_KEY = "AIzaSyArOXc6K6HnCfqwwpWJC5V7MoM_6pgs5IU"; 

const callGemini = async (prompt, systemInstruction = "") => {
  if (!GEMINI_API_KEY) {
    console.warn("API Key mancante.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
  };

  const delays = [1000, 2000, 4000, 8000, 16000];
  
  for (let i = 0; i <= delays.length; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Nessuna risposta generata.";
    } catch (error) {
      if (i === delays.length) throw error;
      await new Promise(resolve => setTimeout(resolve, delays[i]));
    }
  }
};

// --- DATI INIZIALI ---

const INITIAL_CLEANING_TASKS = [
  { id: 1, area: 'Cucina', task: 'Sanificazione Piani Inox', frequency: 'Fine Turno', completed: false, signedBy: '' },
  { id: 2, area: 'Cucina', task: 'Pulizia Pavimenti e Sifoni', frequency: 'Giornaliero', completed: false, signedBy: '' },
  { id: 3, area: 'Cucina', task: 'Sanificazione Affettatrice', frequency: 'Dopo l\'uso', completed: false, signedBy: '' },
  { id: 5, area: 'Lavaggio', task: 'Pulizia Filtri Lavastoviglie', frequency: 'Giornaliero', completed: false, signedBy: '' },
];

// --- COMPONENTI UTILITY ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled = false }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200",
    magic: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-indigo-200",
  };
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const Badge = ({ children, type = "info" }) => {
  const styles = {
    info: "bg-slate-100 text-slate-600",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    magic: "bg-violet-100 text-violet-700 border border-violet-200"
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[type]}`}>
      {children}
    </span>
  );
};

// --- MODULI DELL'APP ---

// 1. Modulo Temperature
const TemperatureModule = ({ equipmentList }) => {
  const [logs, setLogs] = useState([]);
  const [values, setValues] = useState({});

  const handleInputChange = (id, value) => {
    setValues(prev => ({ ...prev, [id]: value }));
  };

  const saveLog = (equipment) => {
    const temp = parseFloat(values[equipment.id]);
    if (isNaN(temp)) return;

    const isCritical = temp < equipment.min || temp > equipment.max;
    
    const newLog = {
      id: Date.now(),
      equipmentName: equipment.name,
      temp: temp,
      timestamp: new Date().toLocaleString(),
      status: isCritical ? 'CRITICO' : 'OK',
      action: isCritical ? 'Richiede Azione Correttiva' : '-',
    };

    setLogs([newLog, ...logs]);
    setValues(prev => ({ ...prev, [equipment.id]: '' }));
    
    if (isCritical) {
      alert(`ATTENZIONE! Temperatura fuori range per ${equipment.name}. Attuare misure correttive.`);
    }
  };

  return (
    <div className="space-y-6">
      {equipmentList.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-500">Nessun frigo configurato. Vai nelle Impostazioni per aggiungerli.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {equipmentList.map(eq => (
            <Card key={eq.id} className="border-t-4 border-t-blue-500">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-700 truncate w-3/4" title={eq.name}>{eq.name}</h3>
                {eq.type === 'freezer' && <Snowflake size={16} className="text-blue-300" />}
              </div>
              <p className="text-xs text-slate-500 mb-4">Range: {eq.min}°C / {eq.max}°C</p>
              
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="°C" 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={values[eq.id] || ''}
                  onChange={(e) => handleInputChange(eq.id, e.target.value)}
                />
                <Button onClick={() => saveLog(eq)} variant="primary" className="!px-3">
                  <Save size={20} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <History size={20} /> Storico Rilevazioni
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase">
              <tr>
                <th className="p-3">Data/Ora</th>
                <th className="p-3">Attrezzatura</th>
                <th className="p-3">Temp</th>
                <th className="p-3">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr><td colSpan="4" className="p-4 text-center text-slate-400">Nessuna rilevazione oggi</td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id}>
                    <td className="p-3">{log.timestamp}</td>
                    <td className="p-3 font-medium">{log.equipmentName}</td>
                    <td className="p-3">{log.temp}°C</td>
                    <td className="p-3">
                      <Badge type={log.status === 'OK' ? 'success' : 'danger'}>{log.status}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// 2. Modulo Pulizie (Aggiornato per usare props)
const CleaningModule = ({ cleaningTasks, setCleaningTasks, userName }) => {
  const toggleTask = (id) => {
    setCleaningTasks(cleaningTasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed, signedBy: !t.completed ? userName : '' } : t
    ));
  };

  const progress = cleaningTasks.length > 0 
    ? Math.round((cleaningTasks.filter(t => t.completed).length / cleaningTasks.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-none">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg">Avanzamento Giornaliero</h3>
          <span className="font-mono text-2xl font-bold">{progress}%</span>
        </div>
        <div className="w-full bg-black/20 rounded-full h-2.5">
          <div className="bg-white h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
      </Card>

      <div className="grid gap-3">
        {cleaningTasks.length === 0 && (
          <div className="text-center p-8 text-slate-500 bg-white rounded-xl border border-dashed">
            Nessuna task in elenco. Vai su Impostazioni per aggiungere le pulizie.
          </div>
        )}
        {cleaningTasks.map(task => (
          <div 
            key={task.id} 
            onClick={() => toggleTask(task.id)}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
              task.completed 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-white border-slate-200 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover:border-blue-400'
              }`}>
                {task.completed && <CheckCircle size={14} className="text-white" />}
              </div>
              <div>
                <p className={`font-semibold ${task.completed ? 'text-emerald-800 line-through decoration-emerald-500/50' : 'text-slate-700'}`}>
                  {task.task}
                </p>
                <div className="flex gap-2 text-xs mt-1">
                  <Badge type="info">{task.area}</Badge>
                  <span className="text-slate-500">{task.frequency}</span>
                </div>
              </div>
            </div>
            {task.completed && (
              <span className="text-xs text-emerald-600 font-medium">Eseguito da: {task.signedBy}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Modulo Ricevimento Merci
const DeliveryModule = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [form, setForm] = useState({ supplier: '', product: '', batch: '', expiry: '', compliant: true });

  const handleSubmit = (e) => {
    e.preventDefault();
    setDeliveries([{ ...form, id: Date.now(), date: new Date().toLocaleDateString() }, ...deliveries]);
    setForm({ supplier: '', product: '', batch: '', expiry: '', compliant: true });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <h3 className="font-bold text-lg text-slate-800 mb-4">Nuova Consegna</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Fornitore</label>
              <input 
                required
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.supplier}
                onChange={e => setForm({...form, supplier: e.target.value})}
                placeholder="Es. Ortofrutta Srl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Prodotto</label>
              <input 
                required
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.product}
                onChange={e => setForm({...form, product: e.target.value})}
                placeholder="Es. Pomodori Pelati"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Lotto</label>
                <input 
                  required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.batch}
                  onChange={e => setForm({...form, batch: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Scadenza</label>
                <input 
                  type="date"
                  required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.expiry}
                  onChange={e => setForm({...form, expiry: e.target.value})}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <input 
                type="checkbox" 
                id="compliant"
                checked={form.compliant}
                onChange={e => setForm({...form, compliant: e.target.checked})}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="compliant" className="text-sm text-slate-700">Imballi integri e temp. ok?</label>
            </div>
            <Button className="w-full" icon={Plus}>Registra Ingresso</Button>
          </form>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="h-full">
          <h3 className="font-bold text-lg text-slate-800 mb-4">Registro Ingressi</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Fornitore</th>
                  <th className="p-3">Prodotto</th>
                  <th className="p-3">Lotto/Scad</th>
                  <th className="p-3">Esito</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.map(d => (
                  <tr key={d.id}>
                    <td className="p-3">{d.date}</td>
                    <td className="p-3 font-medium">{d.supplier}</td>
                    <td className="p-3">{d.product}</td>
                    <td className="p-3 text-xs">
                      <div>L: {d.batch}</div>
                      <div>S: {d.expiry}</div>
                    </td>
                    <td className="p-3">
                      <Badge type={d.compliant ? 'success' : 'danger'}>
                        {d.compliant ? 'Conforme' : 'Respinto'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {deliveries.length === 0 && (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-400">Nessuna merce in entrata registrata.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

// 4. Modulo Schede Abbattimento
const BlastChillingModule = () => {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({
    product: '',
    batch: '',
    startTime: '',
    startTemp: '',
    endTime: '',
    endTemp: '',
    type: 'positive'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newLog = { ...form, id: Date.now(), date: new Date().toLocaleDateString() };
    setLogs([newLog, ...logs]);
    setForm({ product: '', batch: '', startTime: '', startTemp: '', endTime: '', endTemp: '', type: 'positive' });
  };

  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-cyan-500">
        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <Snowflake size={20} className="text-cyan-600" /> Nuova Scheda Abbattimento
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 flex gap-4 mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" name="type" 
                checked={form.type === 'positive'} 
                onChange={() => setForm({...form, type: 'positive'})}
                className="text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-sm font-medium">Abbattimento Positivo (+3°C)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" name="type" 
                checked={form.type === 'negative'} 
                onChange={() => setForm({...form, type: 'negative'})}
                className="text-blue-800 focus:ring-blue-700"
              />
              <span className="text-sm font-medium">Surgelazione (-18°C)</span>
            </label>
          </div>

          <input 
            required placeholder="Prodotto (es. Ragù)" 
            className="p-2 border rounded-lg"
            value={form.product} onChange={e => setForm({...form, product: e.target.value})}
          />
          <input 
            required placeholder="Lotto Produzione" 
            className="p-2 border rounded-lg"
            value={form.batch} onChange={e => setForm({...form, batch: e.target.value})}
          />
          
          <div className="grid grid-cols-2 gap-2">
            <input type="time" required className="p-2 border rounded-lg" title="Ora Inizio" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} />
            <input type="number" required placeholder="Temp. Cuore Inizio °C" className="p-2 border rounded-lg" value={form.startTemp} onChange={e => setForm({...form, startTemp: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input type="time" required className="p-2 border rounded-lg" title="Ora Fine" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} />
            <input type="number" required placeholder="Temp. Cuore Fine °C" className="p-2 border rounded-lg" value={form.endTemp} onChange={e => setForm({...form, endTemp: e.target.value})} />
          </div>

          <Button className="md:col-span-2 bg-cyan-600 hover:bg-cyan-700 shadow-cyan-200" icon={Save}>Registra Abbattimento</Button>
        </form>
      </Card>

      <Card>
        <h3 className="font-bold text-lg text-slate-800 mb-4">Storico Abbattimenti</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">Prodotto</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Ciclo</th>
                <th className="p-3">Temp. Cuore</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="p-3">{log.date}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-700">{log.product}</div>
                    <div className="text-xs text-slate-400">Lotto: {log.batch}</div>
                  </td>
                  <td className="p-3">
                    <Badge type={log.type === 'positive' ? 'success' : 'info'}>
                      {log.type === 'positive' ? '+3°C' : '-18°C'}
                    </Badge>
                  </td>
                  <td className="p-3 text-xs">
                    {log.startTime} <span className="text-slate-400">→</span> {log.endTime}
                  </td>
                  <td className="p-3 text-xs">
                    {log.startTemp}° <span className="text-slate-400">→</span> <strong>{log.endTemp}°</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// 5. Modulo Gestione Impostazioni (AGGIORNATO)
const SettingsModule = ({ 
  equipmentList, setEquipmentList, 
  cleaningTasks, setCleaningTasks,
  userName, setUserName
}) => {
  // Stati locali per i form
  const [newEq, setNewEq] = useState({ name: '', type: 'fridge', min: 0, max: 4 });
  const [newTask, setNewTask] = useState({ area: 'Cucina', task: '', frequency: 'Giornaliero' });
  const [tempUserName, setTempUserName] = useState(userName);

  // Handlers Macchinari
  const addEquipment = (e) => {
    e.preventDefault();
    setEquipmentList([...equipmentList, { ...newEq, id: Date.now() }]);
    setNewEq({ name: '', type: 'fridge', min: 0, max: 4 });
  };

  const removeEquipment = (id) => {
    if (confirm('Sei sicuro di voler eliminare questo macchinario?')) {
      setEquipmentList(equipmentList.filter(eq => eq.id !== id));
    }
  };

  // Handlers Pulizie
  const addCleaningTask = (e) => {
    e.preventDefault();
    setCleaningTasks([...cleaningTasks, { ...newTask, id: Date.now(), completed: false, signedBy: '' }]);
    setNewTask({ area: 'Cucina', task: '', frequency: 'Giornaliero' });
  };

  const removeCleaningTask = (id) => {
    if (confirm('Eliminare questa voce dal piano pulizie?')) {
      setCleaningTasks(cleaningTasks.filter(t => t.id !== id));
    }
  };

  // Handler Profilo
  const saveProfile = () => {
    setUserName(tempUserName);
    alert('Nome aggiornato con successo!');
  };

  return (
    <div className="space-y-8">
      
      {/* SEZIONE 1: Profilo Utente */}
      <Card className="border-t-4 border-t-purple-500">
        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <User size={20} className="text-purple-600"/> Profilo Responsabile
        </h3>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 mb-1">Nome e Cognome</label>
            <input 
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
              value={tempUserName} 
              onChange={e => setTempUserName(e.target.value)} 
            />
          </div>
          <Button onClick={saveProfile} variant="primary" className="bg-purple-600 hover:bg-purple-700 shadow-purple-200">
            Salva Nome
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-2">Questo nome verrà utilizzato per firmare digitalmente le schede.</p>
      </Card>

      {/* SEZIONE 2: Macchinari (Esistente) */}
      <Card>
        <h3 className="font-bold text-lg text-slate-800 mb-4">Gestione Macchinari</h3>
        <form onSubmit={addEquipment} className="flex flex-col md:flex-row gap-4 items-end mb-6 bg-slate-50 p-4 rounded-lg">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 mb-1">Nome Macchinario</label>
            <input required placeholder="Es. Vetrina Dolci" className="w-full p-2 border rounded-lg bg-white" value={newEq.name} onChange={e => setNewEq({...newEq, name: e.target.value})} />
          </div>
          <div className="w-full md:w-24">
            <label className="block text-xs font-bold text-slate-500 mb-1">Min °C</label>
            <input required type="number" className="w-full p-2 border rounded-lg bg-white" value={newEq.min} onChange={e => setNewEq({...newEq, min: parseFloat(e.target.value)})} />
          </div>
          <div className="w-full md:w-24">
            <label className="block text-xs font-bold text-slate-500 mb-1">Max °C</label>
            <input required type="number" className="w-full p-2 border rounded-lg bg-white" value={newEq.max} onChange={e => setNewEq({...newEq, max: parseFloat(e.target.value)})} />
          </div>
          <Button icon={Plus} className="w-full md:w-auto">Aggiungi</Button>
        </form>

        <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
          {equipmentList.map(eq => (
            <div key={eq.id} className="py-3 flex justify-between items-center group">
              <div>
                <p className="font-bold text-slate-700">{eq.name}</p>
                <p className="text-xs text-slate-500">Range: {eq.min}°C / {eq.max}°C</p>
              </div>
              <button onClick={() => removeEquipment(eq.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* SEZIONE 3: Piano Pulizie (NUOVA) */}
      <Card>
        <h3 className="font-bold text-lg text-slate-800 mb-4">Gestione Piano Pulizie</h3>
        <form onSubmit={addCleaningTask} className="flex flex-col md:flex-row gap-4 items-end mb-6 bg-emerald-50 p-4 rounded-lg">
           <div className="w-full md:w-1/4">
            <label className="block text-xs font-bold text-emerald-700 mb-1">Area</label>
            <select 
              className="w-full p-2 border rounded-lg bg-white"
              value={newTask.area}
              onChange={e => setNewTask({...newTask, area: e.target.value})}
            >
              <option>Cucina</option>
              <option>Lavaggio</option>
              <option>Magazzino</option>
              <option>Bagni</option>
              <option>Sala</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-emerald-700 mb-1">Attività</label>
            <input required placeholder="Es. Pulizia filtri cappa" className="w-full p-2 border rounded-lg bg-white" value={newTask.task} onChange={e => setNewTask({...newTask, task: e.target.value})} />
          </div>
          <div className="w-full md:w-1/4">
            <label className="block text-xs font-bold text-emerald-700 mb-1">Frequenza</label>
            <select 
              className="w-full p-2 border rounded-lg bg-white"
              value={newTask.frequency}
              onChange={e => setNewTask({...newTask, frequency: e.target.value})}
            >
              <option>Giornaliero</option>
              <option>Settimanale</option>
              <option>Mensile</option>
              <option>Fine Turno</option>
              <option>Dopo l'uso</option>
            </select>
          </div>
          <Button icon={Plus} variant="success" className="w-full md:w-auto">Aggiungi</Button>
        </form>

        <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
          {cleaningTasks.map(task => (
            <div key={task.id} className="py-3 flex justify-between items-center group px-2 hover:bg-slate-50 rounded-lg">
              <div>
                <p className="font-bold text-slate-700">{task.task}</p>
                <div className="flex gap-2 text-xs text-slate-500">
                  <Badge type="info">{task.area}</Badge>
                  <span>{task.frequency}</span>
                </div>
              </div>
              <button onClick={() => removeCleaningTask(task.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// 6. MODULO ASSISTENTE AI (NUOVO ✨)
const AiAssistantModule = () => {
  const [subTab, setSubTab] = useState('dish'); // 'dish' o 'chat'
  const [dishInput, setDishInput] = useState('');
  const [dishAnalysis, setDishAnalysis] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'system', text: 'Ciao! Sono il tuo esperto HACCP Virtuale. Chiedimi qualunque cosa sulle normative o sulla sicurezza alimentare.' }
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleDishAnalysis = async () => {
    if (!dishInput.trim()) return;
    setLoading(true);
    setDishAnalysis(null);
    try {
      const prompt = `Analizza il seguente piatto o ingrediente per un ristorante dal punto di vista HACCP: "${dishInput}".
      Fornisci una risposta strutturata in formato JSON (senza markdown) con i seguenti campi:
      - allergens (lista stringhe)
      - ccps (lista stringhe con brevi spiegazioni dei punti critici)
      - storage (consiglio breve sulla conservazione)
      - shelfLife (durata consigliata)`;
      
      const response = await callGemini(prompt, "Sei un esperto tecnologo alimentare specializzato in HACCP e sicurezza alimentare.");
      
      // Pulizia base per estrarre JSON se il modello aggiunge testo extra
      const cleanJson = response.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanJson);
      setDishAnalysis(data);
    } catch (e) {
      alert("Errore nell'analisi. Riprova.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // Costruisci il contesto della chat (semplificato)
      const context = chatHistory.map(m => `${m.role === 'user' ? 'Utente' : 'Esperto'}: ${m.text}`).join('\n');
      const prompt = `${context}\nUtente: ${userMsg}\nEsperto:`;
      
      const response = await callGemini(prompt, "Sei un consulente esperto di HACCP per ristoranti in Italia. Rispondi in modo preciso, professionale ma conciso. Cita le normative UE/Italia quando necessario.");
      
      setChatHistory(prev => [...prev, { role: 'system', text: response }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'system', text: "Errore di connessione. Riprova." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex gap-2 p-1 bg-slate-200 rounded-lg w-fit">
        <button 
          onClick={() => setSubTab('dish')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${subTab === 'dish' ? 'bg-white shadow text-violet-700' : 'text-slate-600 hover:text-slate-800'}`}
        >
          <FileSearch size={16} /> Analisi Rischi Piatto ✨
        </button>
        <button 
          onClick={() => setSubTab('chat')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${subTab === 'chat' ? 'bg-white shadow text-violet-700' : 'text-slate-600 hover:text-slate-800'}`}
        >
          <MessageSquare size={16} /> Consulente HACCP ✨
        </button>
      </div>

      {subTab === 'dish' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="h-fit">
            <h3 className="font-bold text-lg text-slate-800 mb-2">Cosa vuoi analizzare?</h3>
            <p className="text-slate-500 text-sm mb-4">Inserisci un piatto (es. "Carbonara") o una lavorazione per identificare rischi e CCP.</p>
            <div className="flex gap-2">
              <input 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                placeholder="Es. Tartare di manzo marinata"
                value={dishInput}
                onChange={(e) => setDishInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDishAnalysis()}
              />
              <Button onClick={handleDishAnalysis} variant="magic" disabled={loading} className="whitespace-nowrap">
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                Analizza
              </Button>
            </div>
          </Card>

          {dishAnalysis && (
            <Card className="border-t-4 border-t-violet-500 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="font-bold text-xl text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles className="text-violet-500" size={20} /> Report Analisi
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Allergeni Rilevati</h4>
                  <div className="flex flex-wrap gap-2">
                    {dishAnalysis.allergens.length > 0 ? (
                      dishAnalysis.allergens.map((a, i) => <Badge key={i} type="warning">{a}</Badge>)
                    ) : <span className="text-slate-500 text-sm">Nessun allergene rilevato</span>}
                  </div>
                </div>

                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                  <h4 className="text-xs font-bold uppercase text-red-800 tracking-wider mb-2 flex items-center gap-1">
                    <AlertTriangle size={14} /> Punti Critici (CCP)
                  </h4>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {dishAnalysis.ccps.map((ccp, i) => <li key={i}>{ccp}</li>)}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <h4 className="text-xs font-bold uppercase text-blue-800 tracking-wider mb-1">Conservazione</h4>
                    <p className="text-sm text-blue-900">{dishAnalysis.storage}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">Shelf Life</h4>
                    <p className="text-sm text-slate-700">{dishAnalysis.shelfLife}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card className="flex-1 flex flex-col p-0 overflow-hidden h-[500px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                }`}>
                  {msg.role !== 'user' && <div className="font-bold text-xs text-violet-600 mb-1 flex items-center gap-1"><Sparkles size={10}/> HACCP AI</div>}
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="animate-spin" size={16} /> Sta scrivendo...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
            <input 
              className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
              placeholder="Fai una domanda sulle norme HACCP..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
            />
            <Button onClick={handleChatSend} variant="magic" disabled={loading} className="!px-3">
              <Send size={18} />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

// --- APP PRINCIPALE ---

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Stato Utente
  const [userName, setUserName] = useState("Mario Rossi");

  // Stato Macchinari
  const [equipmentList, setEquipmentList] = useState([
    { id: 1, name: 'Frigo Positivo 1 (Cucina)', type: 'fridge', min: 0, max: 4 },
    { id: 2, name: 'Frigo Positivo 2 (Bevande)', type: 'fridge', min: 0, max: 8 },
    { id: 3, name: 'Freezer Pozzetto', type: 'freezer', min: -24, max: -18 },
  ]);

  // Stato Pulizie (Nuovo: Spostato da costante a stato)
  const [cleaningTasks, setCleaningTasks] = useState(INITIAL_CLEANING_TASKS);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai_assistant', label: 'Assistente AI', icon: Sparkles, magic: true },
    { id: 'temps', label: 'Temperature', icon: Thermometer },
    { id: 'blast', label: 'Abbattimento', icon: Snowflake },
    { id: 'cleaning', label: 'Piano Pulizie', icon: ClipboardCheck },
    { id: 'delivery', label: 'Ricevimento Merci', icon: Truck },
    { id: 'settings', label: 'Impostazioni', icon: Settings },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <h1 className="text-2xl font-bold mb-2">Benvenuto, Chef!</h1>
                <p className="opacity-90">Oggi è {new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <Sparkles className="absolute right-4 bottom-4 text-white/10 w-32 h-32" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div onClick={() => setActiveTab('ai_assistant')} className="cursor-pointer md:col-span-2">
                <Card className="hover:shadow-md transition-shadow h-full border-2 border-violet-100 bg-gradient-to-br from-white to-violet-50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-violet-100 rounded-lg text-violet-600"><Sparkles size={24} /></div>
                    <Badge type="magic">Novità</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Assistente HACCP AI</h3>
                  <p className="text-slate-600 text-sm mt-1">Analizza rischi ricette e chiedi normative al tuo consulente virtuale.</p>
                </Card>
              </div>

              <div onClick={() => setActiveTab('temps')} className="cursor-pointer">
                <Card className="hover:shadow-md transition-shadow h-full border-l-4 border-l-blue-500">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Thermometer size={24} /></div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-700">Temperature</h3>
                  <p className="text-slate-500 text-sm mt-1">{equipmentList.length} macchinari attivi.</p>
                </Card>
              </div>

              <div onClick={() => setActiveTab('cleaning')} className="cursor-pointer">
                <Card className="hover:shadow-md transition-shadow h-full border-l-4 border-l-emerald-500">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600"><ClipboardCheck size={24} /></div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-700">Pulizie</h3>
                  <p className="text-slate-500 text-sm mt-1">Piano giornaliero avviato.</p>
                </Card>
              </div>
            </div>
          </div>
        );
      case 'temps': return <TemperatureModule equipmentList={equipmentList} />;
      case 'cleaning': return <CleaningModule cleaningTasks={cleaningTasks} setCleaningTasks={setCleaningTasks} userName={userName} />;
      case 'delivery': return <DeliveryModule />;
      case 'blast': return <BlastChillingModule />;
      case 'settings': return (
        <SettingsModule 
          equipmentList={equipmentList} setEquipmentList={setEquipmentList} 
          cleaningTasks={cleaningTasks} setCleaningTasks={setCleaningTasks}
          userName={userName} setUserName={setUserName}
        />
      );
      case 'ai_assistant': return <AiAssistantModule />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-full z-10 overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">H</div>
          <span className="font-bold text-xl tracking-tight">HACCP Pro</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                activeTab === item.id 
                  ? item.magic ? 'bg-violet-50 text-violet-700 border border-violet-100' : 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon size={20} className={item.magic ? "text-violet-600" : ""} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
              {userName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
            </div>
            <div className="text-sm overflow-hidden">
              <p className="font-bold text-slate-700 truncate">{userName}</p>
              <p className="text-slate-500 text-xs">Responsabile</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-slate-200 z-20 flex justify-between items-center p-4">
         <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">H</div>
           <span className="font-bold text-lg">HACCP Pro</span>
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600">
           {isMobileMenuOpen ? <X /> : <Menu />}
         </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-10 pt-20 px-6 space-y-4 md:hidden overflow-y-auto pb-10">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-lg font-medium border ${
                activeTab === item.id 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'border-slate-100 text-slate-600'
              }`}
            >
              <item.icon size={24} />
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto">
        <header className="mb-8 hidden md:block">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            {menuItems.find(i => i.id === activeTab)?.label}
            {activeTab === 'ai_assistant' && <Sparkles className="text-violet-500 animate-pulse" size={24} />}
          </h2>
          <p className="text-slate-500">Gestisci e monitora la conformità del tuo ristorante.</p>
        </header>
        
        {renderContent()}
      </main>
    </div>
  );
};

export default App;