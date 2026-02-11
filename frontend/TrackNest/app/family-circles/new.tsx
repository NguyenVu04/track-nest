import { mockFamilyCircles } from "@/constant/mockFamilyCircles";
import { FamilyCircle } from "@/constant/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewFamilyCircle() {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Please enter a family circle name.");
      return;
    }
    setCreating(true);
    // Generate a new familyCircleId
    const newId = `fc-${Math.floor(Math.random() * 1000000)}`;
    const newCircle: FamilyCircle = {
      familyCircleId: newId,
      name: name.trim(),
      createdAtMs: Date.now(),
      memberCount: 1,
      role: "admin",
    };
    // Add to mockFamilyCircles (in-memory, for demo only)
    mockFamilyCircles.push(newCircle);
    setTimeout(() => {
      setCreating(false);
    }, 1000);
    setName("");

    setTimeout(() => {
      router.back();
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          position: "absolute",
          top: 24,
          left: 16,
          gap: 8,
        }}
        onPress={() => {
          // Navigate back
          console.log("Navigating back to previous screen");
          router.back();
        }}
      >
        <Ionicons name="arrow-back" size={18} />
        <Text style={{ fontSize: 18 }}>Back</Text>
      </Pressable>
      <Text style={styles.title}>Create New Family Circle</Text>
      <TextInput
        style={styles.input}
        placeholder="Family Circle Name"
        value={name}
        onChangeText={setName}
        editable={!creating}
      />
      <Pressable
        style={{
          backgroundColor: creating || !name.trim() ? "#ccc" : "#74becb",
          paddingVertical: 12,
          paddingHorizontal: 32,
          borderRadius: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
        onPress={handleCreate}
        disabled={creating || !name.trim()}
      >
        {creating && <ActivityIndicator size="small" color="#74becb" />}
        <Text style={{ color: "#fff", fontSize: 16 }}>
          {creating ? "Creating..." : "Create"}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    position: "relative",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 24,
  },
  input: {
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
});
