import React, { useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import { useLanguageStore } from '../../store/languageStore';

import { motTraduit } from '@/components/translationHelper';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { Avatar } from '@rneui/themed';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { langIndex } = useLanguageStore();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="friends"
        options={{
          title: motTraduit(langIndex, 9),
          tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
          headerRight: () => (
            <Link href="/Profil" asChild>
              <Pressable>
                {({ pressed }) => (
                  <Avatar
                    rounded
                    title='I'
                    size={30}
                    source={{ uri: 'https://example.com/your-avatar.jpg' }}
                    containerStyle={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: motTraduit(langIndex, 8),
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-bag" color={color} />,
          headerRight: () => (
            <Link href="/Profil" asChild>
              <Pressable>
                {({ pressed }) => (
                  <Avatar
                    rounded
                    title='I'
                    size={30}
                    source={{ uri: 'https://example.com/your-avatar.jpg' }}
                    containerStyle={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: motTraduit(langIndex, 3),
          tabBarIcon: ({ color }) => <TabBarIcon name="gamepad" color={color} />,
          headerRight: () => (
            <Link href="/Profil" asChild>
              <Pressable>
                {({ pressed }) => (
                  <Avatar
                    rounded
                    title='I'
                    size={30}
                    source={{ uri: 'https://example.com/your-avatar.jpg' }}
                    containerStyle={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: motTraduit(langIndex, 4),
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-cart" color={color} />,
          headerRight: () => (
            <Link href="/Profil" asChild>
              <Pressable>
                {({ pressed }) => (
                  <Avatar
                    rounded
                    title='I'
                    size={30}
                    source={{ uri: 'https://example.com/your-avatar.jpg' }}
                    containerStyle={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="options"
        options={{
          title: motTraduit(langIndex, 7),
          tabBarIcon: ({ color }) => <TabBarIcon name="gear" color={color} />,
          headerRight: () => (
            <Link href="/Profil" asChild>
              <Pressable>
                {({ pressed }) => (
                  <Avatar
                    rounded
                    title='I'
                    size={30}
                    source={{ uri: 'https://example.com/your-avatar.jpg' }}
                    containerStyle={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
    </Tabs>
  );
}
