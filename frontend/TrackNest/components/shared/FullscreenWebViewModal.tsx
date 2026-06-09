import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { colors } from "@/styles/styles";

const FULLSCREEN_SCRIPT = `(function(){
  var meta = document.querySelector('meta[name="viewport"]');
  if (!meta) { meta = document.createElement('meta'); meta.name='viewport'; document.head.appendChild(meta); }
  meta.setAttribute('content','width=device-width,initial-scale=1.0,maximum-scale=5.0,user-scalable=yes');
  true;
})();`;

interface Props {
  html: string;
  visible: boolean;
  onClose: () => void;
  title?: string;
}

export function FullscreenWebViewModal({ html, visible, onClose, title }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title ?? ""}
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <WebView
          source={{ html, baseUrl: "" }}
          style={styles.webView}
          scrollEnabled={true}
          showsVerticalScrollIndicator={true}
          scalesPageToFit={Platform.OS === "ios"}
          injectedJavaScript={FULLSCREEN_SCRIPT}
          onMessage={() => {}}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginRight: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  webView: {
    flex: 1,
  },
});
