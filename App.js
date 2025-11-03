import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  TouchableHighlight,
  Platform,
} from "react-native";

// --- FUNÇÃO PARA GERAR INICIAIS (VERSÃO SEGURA) ---
const getInitials = (nome) => {
  if (typeof nome !== 'string' || !nome.trim()) return "?";
  
  const partes = nome.split(" ").filter(Boolean);
  if (partes.length === 0) return "?";

  return partes
    .map((parte) => parte[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// --- COMPONENTE AVATAR COM A LÓGICA DE VERIFICAÇÃO DE IMAGEM CORRETA ---
const Avatar = ({ imagePath, nome, onPress }) => {
  // A CONDIÇÃO CORRIGIDA: Verifica se o caminho da imagem é válido e termina com uma extensão de imagem.
  const hasValidImageExtension = (path) => {
    if (typeof path !== 'string' || !path.trim()) {
      return false;
    }
    // Verifica se o final do texto inclui .jpg, .jpeg, ou .png (insensível a maiúsculas/minúsculas)
    return /\.(jpg|jpeg|png)$/i.test(path);
  };

  const isValidImage = hasValidImageExtension(imagePath);
  const imageUri = isValidImage ? `https://sgl.tds104-senac.online/${imagePath}` : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={!isValidImage}>
      {isValidImage ? (
        <Image source={{ uri: imageUri }} style={styles.fighterImage} />
      ) : (
        <View style={styles.initialsCircle}>
          <Text style={styles.initialsText}>{getInitials(nome)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// --- COMPONENTE PRINCIPAL DO APLICATIVO ---
export default function App() {
  const [activeTab, setActiveTab] = useState("hoje");
  const [todosResultados, setTodosResultados] = useState({ lutadores: [], confrontos: [] });
  const [resultados, setResultados] = useState(null);
  const [confrontosDeHoje, setConfrontosDeHoje] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const formatarData = (dataString) => {
    if (!dataString || !dataString.includes(' ')) return '';
    const [data, hora] = dataString.split(' ');
    const [ano, mes, dia] = data.split('-');
    const [horas, minutos] = hora.split(':');
    return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
  };

  const fetchConfrontosDeHoje = async () => {
    try {
      const res = await fetch("https://sgl.tds104-senac.online/get_confrontos_hoje.php");
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      setConfrontosDeHoje(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar confrontos de hoje:", error);
      alert("Erro ao buscar os confrontos de hoje: " + error.message);
    }
  };

  useEffect(() => {
    fetchConfrontosDeHoje();
  }, []);

  const handleSearch = async () => {
    try {
      const urlLutadores = searchTerm
        ? `https://sgl.tds104-senac.online/get_lutador.php?busca=${encodeURIComponent(searchTerm)}`
        : "https://sgl.tds104-senac.online/get_lutador.php";
      const urlConfrontos = searchTerm
        ? `https://sgl.tds104-senac.online/get_confrontos.php?busca=${encodeURIComponent(searchTerm)}`
        : "https://sgl.tds104-senac.online/get_confrontos.php";
      
      const resLutadores = await fetch(urlLutadores);
      const lutadoresText = await resLutadores.text();
      const lutadores = lutadoresText ? JSON.parse(lutadoresText) : [];

      const resConfrontos = await fetch(urlConfrontos);
      const confrontosText = await resConfrontos.text();
      const confrontos = confrontosText ? JSON.parse(confrontosText) : [];

      setTodosResultados({ lutadores, confrontos });
      setResultados({ lutadores, confrontos });
    } catch (error) {
      console.error(error);
      alert("Erro ao consultar a API: " + error.message);
    }
  };

  const handleFilter = (text) => {
    setSearchTerm(text);
    if (!resultados) return;
    const filtroLutadores = todosResultados.lutadores.filter(l =>
      l.nome.toLowerCase().includes(text.toLowerCase())
    );
    const filtroConfrontos = todosResultados.confrontos.filter(c =>
      c.lutador1.toLowerCase().includes(text.toLowerCase()) ||
      c.lutador2.toLowerCase().includes(text.toLowerCase())
    );
    setResultados({ lutadores: filtroLutadores, confrontos: filtroConfrontos });
  };
  
  const openImageModal = (uri) => {
    setSelectedImage(uri);
    setModalVisible(true);
  };

  const renderLutador = (lutador, index) => {
    return (
      <View key={`lutador-${index}`} style={styles.listItem}>
        <Avatar 
          imagePath={lutador.imagem} 
          nome={lutador.nome} 
          onPress={() => openImageModal(`https://sgl.tds104-senac.online/${lutador.imagem}`)} 
        />
        <View style={styles.fighterInfo}>
          <Text style={styles.fighterName}>{lutador.nome}</Text>
          <Text style={styles.fighterTeam}>{lutador.equipe}</Text>
          <View style={styles.cartelContainer}>
            <Text style={styles.cartelWin}>{lutador.vitorias}V</Text>
            <Text style={styles.cartelLoss}>{lutador.derrotas}D</Text>
            <Text style={styles.cartelDraw}>{lutador.empates}E</Text>
          </View>
        </View>
        <View style={styles.fighterDetails}>
          <Text style={styles.fighterDetailText}>{lutador.modalidade}</Text>
          <Text style={styles.fighterDetailText}>{lutador.peso}</Text>
        </View>
      </View>
    );
  };

  const renderConfronto = (luta, index) => {
    return (
      <View key={`confronto-${index}`} style={styles.fightItem}>
        <View style={styles.fightFighter}>
          <Avatar 
            imagePath={luta.imagem1} 
            nome={luta.lutador1} 
            onPress={() => openImageModal(`https://sgl.tds104-senac.online/${luta.imagem1}`)} 
          />
          <Text style={[styles.fighterName, luta.vencedor_id === luta.lutador1_id && styles.winner]}>
            {luta.lutador1}
            {luta.vencedor_id === luta.lutador1_id && <Text style={styles.resultadoText}> ({luta.resultado})</Text>}
          </Text>
        </View>
  
        <View style={{ alignItems: "center" }}>
          <Text style={styles.vsText}>VS</Text>
          <Text style={{ color: "#ccc", fontSize: 12 }}>{formatarData(luta.data_confronto)}</Text>
          <Text style={{ color: "#ccc", fontSize: 12 }}>{luta.local}</Text>
          {luta.resultado === 'Empate' && <Text style={styles.empateText}>Empate</Text>}
        </View>
  
        <View style={styles.fightFighter}>
          <Avatar 
            imagePath={luta.imagem2} 
            nome={luta.lutador2} 
            onPress={() => openImageModal(`https://sgl.tds104-senac.online/${luta.imagem2}`)} 
          />
          <Text style={[styles.fighterName, luta.vencedor_id === luta.lutador2_id && styles.winner]}>
            {luta.lutador2}
            {luta.vencedor_id === luta.lutador2_id && <Text style={styles.resultadoText}> ({luta.resultado})</Text>}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(!modalVisible)}
      >
        <TouchableHighlight
          style={styles.modalContainer}
          onPress={() => setModalVisible(false)}
          underlayColor="rgba(0, 0, 0, 0.8)"
        >
          <View style={styles.modalView}>
            <Image source={{ uri: selectedImage }} style={styles.zoomedImage} />
          </View>
        </TouchableHighlight>
      </Modal>

      <ScrollView style={styles.container}>
        <View style={styles.navbar}>
          <Text style={styles.navbarBrand}>SGL</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Portal Público de Lutas</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.input}
              placeholder="Busque por lutadores, confrontos..."
              placeholderTextColor="#888"
              value={searchTerm}
              onChangeText={handleFilter}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch} activeOpacity={0.7}>
              <Text style={styles.searchButtonText}>Consultar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity onPress={() => setActiveTab("hoje")} style={[styles.tab, activeTab === "hoje" && styles.activeTab]}>
            <Text style={styles.tabText}>Hoje</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab("lutadores")} style={[styles.tab, activeTab === "lutadores" && styles.activeTab]}>
            <Text style={styles.tabText}>Lutadores</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab("confrontos")} style={[styles.tab, activeTab === "confrontos" && styles.activeTab]}>
            <Text style={styles.tabText}>Confrontos</Text>
          </TouchableOpacity>
        </View>

        {activeTab === "hoje" && (
          <View>
            {confrontosDeHoje.length > 0 ? (
              confrontosDeHoje.map((luta, index) => renderConfronto(luta, `hoje-${index}`))
            ) : (
              <View style={styles.infoCard}><Text style={styles.infoText}>Nenhum confronto agendado para hoje.</Text></View>
            )}
          </View>
        )}

        {activeTab !== "hoje" && !resultados && (
          <View style={styles.infoCard}><Text style={styles.infoText}>Clique em "Consultar" para ver os resultados.</Text></View>
        )}

        {resultados && (
          <View>
            {activeTab === "lutadores" && (resultados.lutadores.length > 0 ? resultados.lutadores.map((lutador, index) => renderLutador(lutador, index)) : <View style={styles.infoCard}><Text style={styles.infoText}>Nenhum lutador encontrado.</Text></View>)}
            {activeTab === "confrontos" && (resultados.confrontos.length > 0 ? resultados.confrontos.map((luta, index) => renderConfronto(luta, index)) : <View style={styles.infoCard}><Text style={styles.infoText}>Nenhum confronto encontrado.</Text></View>)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#101010" },
  container: { flex: 1, paddingHorizontal: 15 },
  navbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, marginBottom: 10 },
  navbarBrand: { fontFamily: Platform.OS === 'ios' ? 'BebasNeue-Regular' : 'BebasNeue', fontSize: 40, color: "#fff", textShadowColor: 'rgba(220, 53, 69, 0.6)', textShadowOffset: {width: 0, height: 0}, textShadowRadius: 8 },
  card: { backgroundColor: "rgba(28, 28, 28, 0.75)", borderRadius: 15, padding: 20, borderWidth: 1, borderColor: 'rgba(220, 53, 69, 0.2)' },
  cardTitle: { color: "#fff", fontSize: 24, fontWeight: "600", textAlign: "center", marginBottom: 20, fontFamily: 'Poppins-SemiBold' },
  searchContainer: { flexDirection: "row" },
  input: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.3)", color: "#fff", borderRadius: 8, paddingHorizontal: 15, marginRight: 10, borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, fontSize: 16 },
  searchButton: { backgroundColor: "#dc3545", justifyContent: "center", paddingHorizontal: 20, borderRadius: 8 },
  searchButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  tabsContainer: { flexDirection: "row", marginTop: 25, marginBottom: 15 },
  tab: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, marginRight: 10, backgroundColor: 'rgba(255,255,255,0.1)' },
  activeTab: { backgroundColor: "#dc3545" },
  tabText: { color: "#fff", fontWeight: "bold" },
  infoCard: { backgroundColor: "rgba(28, 28, 28, 0.75)", borderRadius: 15, padding: 20, alignItems: 'center' },
  infoText: { color: "#888", textAlign: "center", fontSize: 16 },
  listItem: { backgroundColor: "rgba(30, 30, 30, 0.8)", borderRadius: 12, padding: 15, flexDirection: "row", alignItems: "center", marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  fighterImage: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  initialsCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  initialsText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  fighterInfo: { flex: 1, marginLeft: 15 },
  fighterName: { color: "#fff", fontSize: 18, fontWeight: "bold", textAlign: 'center' },
  fighterTeam: { color: "#a0a0a0", marginTop: 4, textAlign: 'center' },
  fighterDetails: { alignItems: "flex-end" },
  fighterDetailText: { color: "#c0c0c0", fontSize: 12 },
  fightItem: { backgroundColor: "rgba(30, 30, 30, 0.8)", borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  fightFighter: { alignItems: "center", flex: 1 },
  vsText: { color: "#dc3545", fontSize: 30, fontWeight: "bold", marginHorizontal: 10, fontFamily: Platform.OS === 'ios' ? 'BebasNeue-Regular' : 'BebasNeue' },
  winner: { color: "#198754" },
  resultadoText: { fontSize: 12, color: '#a0a0a0', fontWeight: 'normal'},
  empateText: { color: '#ffc107', fontWeight: 'bold', marginTop: 5, backgroundColor: 'rgba(255, 193, 7, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  cartelContainer: { alignSelf: 'center', flexDirection: 'row', marginTop: 5, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, },
  cartelWin: { color: '#198754', fontWeight: 'bold', marginRight: 8, fontSize: 12 },
  cartelLoss: { color: '#dc3545', fontWeight: 'bold', marginRight: 8, fontSize: 12 },
  cartelDraw: { color: '#ffc107', fontWeight: 'bold', fontSize: 12 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.8)" },
  modalView: { margin: 20, backgroundColor: "transparent", borderRadius: 20, padding: 10, alignItems: "center" },
  zoomedImage: { width: 350, height: 350, resizeMode: 'contain' },
});