import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Dialog,
  IconButton,
  Portal,
  Text,
  TextInput
} from "react-native-paper";

import type Tratamento from "../../types/Tratamento";

const STORAGE_KEY = "@mycatbutton_tratamentos";

export default function Tratamentos() {
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [current, setCurrent] = useState<Partial<Tratamento> | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTratamentos();
  }, []);

  async function fetchTratamentos() {
    try {
      setLoading(true);
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data: Tratamento[] = JSON.parse(raw);
        setTratamentos(data);
      } else {
        // Exemplos iniciais
        const data: Tratamento[] = [
          { nome: "Antibiótico", nomeRemedio: "Amoxicilina", descricao: "Para infecção", dataInicio: "2024-01-01", dataFim: "2024-01-10" },
          { nome: "Alergia", nomeRemedio: "Cetirizina", descricao: "Para coceira", dataInicio: "2024-01-05", dataFim: "2024-02-05" }
        ];
        setTratamentos(data);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.error("Falha ao carregar tratamentos", e);
      Alert.alert("Erro", "Não foi possível carregar tratamentos.");
    } finally {
      setLoading(false);
    }
  }

  async function persistTratamentos(newList: Tratamento[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error("Falha ao persistir tratamentos", e);
      Alert.alert("Erro", "Não foi possível persistir tratamentos.");
    }
  }

  function openEdit(tratamento?: Tratamento, index?: number) {
    if (tratamento) {
      setCurrent({ ...tratamento });
      setCurrentIndex(typeof index === "number" ? index : null);
    } else {
      setCurrent({ nome: "", nomeRemedio: "", descricao: "", dataInicio: "", dataFim: "" });
      setCurrentIndex(null);
    }
    setDialogVisible(true);
  }

  function openDetails(tratamento: Tratamento, index: number) {
    setCurrent(tratamento);
    setCurrentIndex(index);
    setDetailsVisible(true);
  }

  async function handleDelete(index: number) {
    Alert.alert("Remover tratamento", "Você tem certeza que gostaria de remover o tratamento?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            const newTratamentos = tratamentos.filter((_, i) => i !== index);
            setTratamentos(newTratamentos);
            await persistTratamentos(newTratamentos);
          } catch (e) {
            console.error("Falha ao remover tratamento", e);
            Alert.alert("Erro", "Falha ao remover tratamento.");
          }
        },
      },
    ]);
  }

  async function saveTratamento() {
    if (!current) return;
    const { nome, nomeRemedio, descricao, dataInicio, dataFim } = current as Tratamento;
    if (!nome || !nomeRemedio) {
      Alert.alert("Nome obrigatório", "Por favor, insira o nome do tratamento e do remédio.");
      return;
    }
    try {
      setSaving(true);
      let newTratamentos: Tratamento[];
      if (currentIndex !== null) {
        const updated: Tratamento = { nome, nomeRemedio, descricao: descricao || "", dataInicio: dataInicio || "", dataFim: dataFim || "" };
        newTratamentos = tratamentos.map((t, i) => (i === currentIndex ? updated : t));
      } else {
        const created: Tratamento = { nome, nomeRemedio, descricao: descricao || "", dataInicio: dataInicio || "", dataFim: dataFim || "" };
        newTratamentos = [created, ...tratamentos];
      }
      setTratamentos(newTratamentos);
      await persistTratamentos(newTratamentos);
      setDialogVisible(false);
      setCurrent(null);
      setCurrentIndex(null);
    } catch (e) {
      console.error("Falha ao salvar tratamento", e);
      Alert.alert("Erro", "Falha ao salvar tratamento.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator animating size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tratamentos}
        keyExtractor={(_, index) => String(index)}
        renderItem={({ item, index }) => (
          <Card style={styles.card}>
            <Card.Title
              title={item.nome}
              subtitle={item.nomeRemedio}
              right={() => (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <IconButton
                    icon="information-outline"
                    onPress={() => openDetails(item, index)}
                  />
                  <IconButton icon="pencil" onPress={() => openEdit(item, index)} />
                  <IconButton
                    icon="delete"
                    onPress={() => handleDelete(index)}
                  />
                </View>
              )}
            />
            <Card.Content>
              <Text variant="bodyMedium">{item.descricao || "Sem descrição"}</Text>
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={{ padding: 8 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text variant="bodyMedium" style={styles.backgroundText}>Não foram encontrados tratamentos registrados.</Text>
          </View>
        }
      />

      <Button
        mode="contained"
        onPress={() => openEdit()}
        style={styles.addButton}
        uppercase={false}
      >
        Adicionar tratamento
      </Button>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{currentIndex !== null ? "Alterar tratamento" : "Adicionar tratamento"}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nome"
              value={(current?.nome as string) || ""}
              onChangeText={(text) => setCurrent((c) => ({ ...(c || {}), nome: text }))}
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Nome do Remédio"
              value={(current?.nomeRemedio as string) || ""}
              onChangeText={(text) => setCurrent((c) => ({ ...(c || {}), nomeRemedio: text }))}
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Descrição"
              value={(current?.descricao as string) || ""}
              onChangeText={(text) => setCurrent((c) => ({ ...(c || {}), descricao: text }))}
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Data Início"
              value={(current?.dataInicio as string) || ""}
              onChangeText={(text) => setCurrent((c) => ({ ...(c || {}), dataInicio: text }))}
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Data Fim"
              value={(current?.dataFim as string) || ""}
              onChangeText={(text) => setCurrent((c) => ({ ...(c || {}), dataFim: text }))}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancelar</Button>
            <Button loading={saving} onPress={saveTratamento}>
              Salvar
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={detailsVisible} onDismiss={() => setDetailsVisible(false)}>
          <Dialog.Title>Detalhes do tratamento</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">Nome: {(current as Tratamento)?.nome}</Text>
            <Text variant="bodyMedium">Remédio: {(current as Tratamento)?.nomeRemedio}</Text>
            <Text variant="bodyMedium">Descrição: {(current as Tratamento)?.descricao}</Text>
            <Text variant="bodyMedium">Data Início: {(current as Tratamento)?.dataInicio}</Text>
            <Text variant="bodyMedium">Data Fim: {(current as Tratamento)?.dataFim}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDetailsVisible(false)}>Fechar</Button>
            <Button onPress={() => { setDetailsVisible(false); openEdit(current as Tratamento, currentIndex ?? undefined); }}>Alterar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  card: { marginVertical: 6 },
  addButton: {
    margin: 12,
    borderRadius: 4,
  },
  backgroundText: { color: "black" },
});
