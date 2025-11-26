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

import type Pet from "../../types/Pet"; // adjust path if your project layout differs

const STORAGE_KEY = "@mycatbutton_pets";

export default function Pets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [current, setCurrent] = useState<Partial<Pet> | null>(null); // used for add/edit/detail
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
        // initial sample data if nothing stored yet
        const data: Pet[] = [
          { nome: "Whiskers", idade: 3, peso: 4.2, descricao: "Playful Siamese" },
          { nome: "Mittens", idade: 2, peso: 3.8, descricao: "Calm tabby" }
        ];
        setPets(data);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.error("Failed to load pets from storage", e);
      Alert.alert("Error", "Could not load pets.");
    } finally {
      setLoading(false);
    }
  }

  async function persistPets(newPets: Pet[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPets));
    } catch (e) {
      console.error("Failed to save pets to storage", e);
      // Not blocking UI, but inform the user
      Alert.alert("Error", "Could not persist pets.");
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
    Alert.alert("Delete pet", "Are you sure you want to delete this pet?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const newPets = pets.filter((_, i) => i !== index);
            setPets(newPets);
            await persistPets(newPets);
          } catch (e) {
            console.error("Delete failed", e);
            Alert.alert("Error", "Failed to delete pet.");
          }
        },
      },
    ]);
  }

  async function savePet() {
    if (!current) return;
    const { nome, idade = 0, peso = 0, descricao } = current as Pet;
    if (!nome) {
      Alert.alert("Validation", "Please provide a name.");
      return;
    }
    try {
      setSaving(true);
      if (currentIndex !== null) {
        // update
        const updated: Pet = { nome, idade, peso, descricao: descricao || "" };
        const newPets = pets.map((p, i) => (i === currentIndex ? updated : p));
        setPets(newPets);
        await persistPets(newPets);
      } else {
        // create
        const created: Pet = { nome, idade, peso, descricao: descricao || "" };
        const newPets = [created, ...pets];
        setPets(newPets);
        await persistPets(newPets);
      }
      setDialogVisible(false);
      setCurrent(null);
      setCurrentIndex(null);
    } catch (e) {
      console.error("Save failed", e);
      Alert.alert("Error", "Failed to save pet.");
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
              subtitle={`${item.idade} yrs • ${item.peso} kg`}
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
            <Paragraph>No pets found. Add one using the button below.</Paragraph>
          </View>
        }
      />

      {/* Primary button to add more pets */}
      <Button
        mode="contained"
        onPress={() => openEdit()}
        style={styles.addButton}
        uppercase={false}
      >
        Add pet
      </Button>

      {/* Add / Edit Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{currentIndex !== null ? "Edit pet" : "Add pet"}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nome"
              value={(current?.nome as string) || ""}
              onChangeText={(text) => setCurrent((c) => ({ ...(c || {}), nome: text }))}
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Idade"
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
              label="Peso"
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
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button loading={saving} onPress={savePet}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Details Dialog */}
        <Dialog visible={detailsVisible} onDismiss={() => setDetailsVisible(false)}>
          <Dialog.Title>Pet details</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Nome: {(current as Pet)?.nome}</Paragraph>
            <Paragraph>Idade: {(current as Pet)?.idade} anos</Paragraph>
            <Paragraph>Peso: {(current as Pet)?.peso} kg</Paragraph>
            <Paragraph>Descrição: {(current as Pet)?.descricao}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDetailsVisible(false)}>Close</Button>
            <Button onPress={() => { setDetailsVisible(false); openEdit(current as Pet, currentIndex ?? undefined); }}>Edit</Button>
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
});