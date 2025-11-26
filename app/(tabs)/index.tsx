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

import type Pet from "@/types/Pet";

const STORAGE_KEY = "@mycatbutton_pets";

export default function Pets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [current, setCurrent] = useState<Partial<Pet> | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPets();
  }, []);

  async function fetchPets() {
    try {
      setLoading(true);
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data: Pet[] = JSON.parse(raw);
        setPets(data);
      } else {
        // Exemplos iniciais
        const data: Pet[] = [
          { nome: "Luke", idade: 3, peso: 4.2, descricao: "Gatinho mordedor de pé" },
          { nome: "Lilly", idade: 3, peso: 3.8, descricao: "Brrrrrr" }
        ];
        setPets(data);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.error("Erro ao ler pets.", e);
      Alert.alert("Erro", "Não foi possível ler pets.");
    } finally {
      setLoading(false);
    }
  }

  async function persistPets(newPets: Pet[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPets));
    } catch (e) {
      console.error("Falha ao persistir pets.", e);
      Alert.alert("Erro", "Não foi possível salvar pets.");
    }
  }

  function openEdit(pet?: Pet, index?: number) {
    if (pet) {
      setCurrent({ ...pet });
      setCurrentIndex(typeof index === "number" ? index : null);
    } else {
      setCurrent({ nome: "", descricao: "", idade: 0, peso: 0 });
      setCurrentIndex(null);
    }
    setDialogVisible(true);
  }

  function openDetails(pet: Pet, index: number) {
    setCurrent(pet);
    setCurrentIndex(index);
    setDetailsVisible(true);
  }

  async function handleDelete(index: number) {
    Alert.alert("Remover pet", "Você tem certeza que gostaria de remover esse pet da lista?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            const newPets = pets.filter((_, i) => i !== index);
            setPets(newPets);
            await persistPets(newPets);
          } catch (e) {
            console.error("Erro ao remover pet.", e);
            Alert.alert("Erro", "Erro ao remover pet da lista.");
          }
        },
      },
    ]);
  }

  async function savePet() {
    if (!current) return;
    const { nome, idade = 0, peso = 0, descricao } = current as Pet;
    if (!nome) {
      Alert.alert("Nome obrigatório", "Por favor, insira o nome do pet.");
      return;
    }
    try {
      setSaving(true);
      if (currentIndex !== null) {
        const updated: Pet = { nome, idade, peso, descricao: descricao || "" };
        const newPets = pets.map((p, i) => (i === currentIndex ? updated : p));
        setPets(newPets);
        await persistPets(newPets);
      } else {
        const created: Pet = { nome, idade, peso, descricao: descricao || "" };
        const newPets = [created, ...pets];
        setPets(newPets);
        await persistPets(newPets);
      }
      setDialogVisible(false);
      setCurrent(null);
      setCurrentIndex(null);
    } catch (e) {
      console.error("Falha ao salvar estado do pet.", e);
      Alert.alert("Erro", "Falha ao salvar estado do pet.");
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
        data={pets}
        keyExtractor={(_, index) => String(index)}
        renderItem={({ item, index }) => (
          <Card style={styles.card}>
            <Card.Title
              title={item.nome}
              subtitle={`${item.idade} anos • ${item.peso} kg`}
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
              <Text variant="bodyMedium">{item.descricao || "Sem descrição."}</Text>
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={{ padding: 8 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text variant="bodyMedium" style={styles.backgroundText}>Nenhum pet encontrado.</Text>
          </View>
        }
      />

      <Button
        mode="contained"
        onPress={() => openEdit()}
        style={styles.addButton}
        uppercase={false}
      >
        Adicionar um gatinho
      </Button>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{currentIndex !== null ? "Atualizar gatinho" : "Adicionar gatinho"}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nome"
              value={(current?.nome as string) || ""}
              onChangeText={(text) => setCurrent((c) => ({ ...(c || {}), nome: text }))}
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Idade (anos)"
              keyboardType="numeric"
              value={
                current && typeof current.idade === "number"
                  ? String(current.idade)
                  : ""
              }
              onChangeText={(text) =>
                setCurrent((c) => ({ ...(c || {}), idade: Number(text) || 0 }))
              }
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Peso (kg)"
              keyboardType="numeric"
              value={
                current && typeof current.peso === "number" ? String(current.peso) : ""
              }
              onChangeText={(text) =>
                setCurrent((c) => ({ ...(c || {}), peso: Number(text) || 0 }))
              }
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Descrição"
              value={(current?.descricao as string) || ""}
              onChangeText={(text) => setCurrent((c) => ({ ...(c || {}), descricao: text }))}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancelar</Button>
            <Button loading={saving} onPress={savePet}>
              Salvar
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Details Dialog */}
        <Dialog visible={detailsVisible} onDismiss={() => setDetailsVisible(false)}>
          <Dialog.Title>Detalhes do gatinho</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">Nome: {(current as Pet)?.nome}</Text>
            <Text variant="bodyMedium">Idade: {(current as Pet)?.idade} anos</Text>
            <Text variant="bodyMedium">Peso: {(current as Pet)?.peso} kg</Text>
            <Text variant="bodyMedium">Descrição: {(current as Pet)?.descricao}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDetailsVisible(false)}>Fechar</Button>
            <Button onPress={() => { setDetailsVisible(false); openEdit(current as Pet, currentIndex ?? undefined); }}>Alterar</Button>
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
  header: { margin: 12 },
  backgroundText: { color: "black" },
});