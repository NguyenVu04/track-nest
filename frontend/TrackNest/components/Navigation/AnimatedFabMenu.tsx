import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  route: string;
  color?: string;
  hidden?: boolean;
}

interface AnimatedFabMenuProps {
  items: MenuItem[];
  primaryColor?: string;
  onNavigate?: (route: string) => void;
}

const AnimatedFabMenu: React.FC<AnimatedFabMenuProps> = ({
  items,
  primaryColor = "#74becb",
  onNavigate,
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const { height: screenHeight } = useWindowDimensions();

  const visibleItems = items.filter((item) => !item.hidden);

  const toggleMenu = () => {
    setIsOpen(!isOpen);

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: isOpen ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: isOpen ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rotateValue = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const handleMenuItemPress = (item: MenuItem) => {
    setIsOpen(false);
    scaleAnim.setValue(0);
    rotateAnim.setValue(0);
    onNavigate?.(item.route);
    router.push(item.route as any);
  };

  return (
    <View style={styles.container}>
      {/* Menu Items Background */}
      {isOpen && (
        <Animated.View
          style={[
            styles.menuItemsContainer,
            {
              opacity: scaleAnim,
              transform: [{ scaleY: scaleAnim }],
              maxHeight: Math.min(screenHeight * 0.6, visibleItems.length * 70),
            },
          ]}
        >
          {visibleItems.map((item, index) => (
            <Animated.View
              key={item.id}
              style={{
                opacity: scaleAnim,
                transform: [
                  {
                    translateY: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20 - index * 5, 0],
                    }),
                  },
                ],
              }}
            >
              <Pressable
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item)}
              >
                <View
                  style={[
                    styles.menuItemIcon,
                    { backgroundColor: item.color || primaryColor },
                  ]}
                >
                  <Ionicons name={item.icon as any} size={20} color="#fff" />
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {/* Backdrop */}
      {isOpen && (
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)} />
      )}

      {/* Main FAB */}
      <Animated.View
        style={[
          styles.mainFab,
          {
            transform: [{ rotate: rotateValue }],
            backgroundColor: primaryColor,
          },
        ]}
      >
        <Pressable onPress={toggleMenu} style={styles.fabPressable}>
          <Ionicons name="add" size={32} color="#fff" />
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    right: 24,
    zIndex: 1000,
  },
  menuItemsContainer: {
    position: "absolute",
    bottom: 80,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
    overflow: "hidden",
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    minWidth: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    position: "absolute",
    top: -1000,
    left: -1000,
    width: 2000,
    height: 2000,
    backgroundColor: "transparent",
  },
  mainFab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 16,
  },
  fabPressable: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AnimatedFabMenu;
