import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Dialog,
  IconButton,
  Paragraph,
  Portal,
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
        const data: Tratamento[] = [
          { nome: "Antibiótico", nomeRemedio: "Amoxicilina", descricao: "Para infecção", dataInicio: "2024-01-01", dataFim: "2024-01-10" },
          { nome: "Alergia", nomeRemedio: "Cetirizina", descricao: "Para coceira", dataInicio: "2024-01-05", dataFim: "2024-02-05" }
        ];
        setTratamentos(data);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.error("Failed to load tratamentos", e);
      Alert.alert("Error", "Could not load tratamentos.");
    } finally {
      setLoading(false);
    }
  }

  async function persistTratamentos(newList: Tratamento[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error("Failed to persist tratamentos", e);
      Alert.alert("Error", "Could not persist tratamentos.");
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
    Alert.alert("Delete tratamento", "Are you sure you want to delete this tratamento?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const newTratamentos = tratamentos.filter((_, i) => i !== index);
            setTratamentos(newTratamentos);
            await persistTratamentos(newTratamentos);
          } catch (e) {
            console.error("Delete failed", e);
            Alert.alert("Error", "Failed to delete tratamento.");
          }
        },
      },
    ]);
  }

  async function saveTratamento() {
    if (!current) return;
    const { nome, nomeRemedio, descricao, dataInicio, dataFim } = current as Tratamento;
    if (!nome || !nomeRemedio) {
      Alert.alert("Validation", "Please provide a name and medicine name.");
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
      console.error("Save failed", e);
      Alert.alert("Error", "Failed to save tratamento.");
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
              <Paragraph>{item.descricao || "No description."}</Paragraph>
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={{ padding: 8 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Paragraph>No tratamentos found. Add one using the button below.</Paragraph>
          </View>
        }
      />

      <Button
        mode="contained"
        onPress={() => openEdit()}
        style={styles.addButton}
        uppercase={false}
      >
        Add tratamento
      </Button>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{currentIndex !== null ? "Edit tratamento" : "Add tratamento"}</Dialog.Title>
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
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button loading={saving} onPress={saveTratamento}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={detailsVisible} onDismiss={() => setDetailsVisible(false)}>
          <Dialog.Title>Tratamento details</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Nome: {(current as Tratamento)?.nome}</Paragraph>
            <Paragraph>Remédio: {(current as Tratamento)?.nomeRemedio}</Paragraph>
            <Paragraph>Descrição: {(current as Tratamento)?.descricao}</Paragraph>
            <Paragraph>Data Início: {(current as Tratamento)?.dataInicio}</Paragraph>
            <Paragraph>Data Fim: {(current as Tratamento)?.dataFim}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDetailsVisible(false)}>Close</Button>
            <Button onPress={() => { setDetailsVisible(false); openEdit(current as Tratamento, currentIndex ?? undefined); }}>Edit</Button>
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
});
