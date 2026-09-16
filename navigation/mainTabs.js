import React, { useContext, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import PagerView from 'react-native-pager-view';
import Ionicons from '@expo/vector-icons/Ionicons';

import HomeScreen from '../screens/tabs/homeScreen';
import ClassesScreen from '../screens/tabs/classesScreen';
import ResourcesScreen from '../screens/tabs/resourcesScreen';
import UpdatesScreen from '../screens/tabs/updatesScreen';
import AdminScreen from '../screens/tabs/adminScreen';

import { ThemeContext } from '../context/themeContext';
import { AuthContext } from '../context/authContext';
import { TabNavigationContext } from '../context/tabNavigationContext';

export default function MainTabs() {
  const { theme, activeMode } = useContext(ThemeContext);

  const { user } = useContext(AuthContext);

  const isAdmin = user?.role && user.role.trim() !== 'student';
  const [pendingParams, setPendingParams] = useState(null);

function goToTabByName(name, params = null) {
  const index = TABS.findIndex((t) => t.name === name);
  if (index !== -1) {
    setPendingParams(params);
    goToTab(index);
  }
}

  const TABS = [
    { name: 'Home', component: HomeScreen, icon: 'home', iconOutline: 'home-outline' },
    { name: 'Classes', component: ClassesScreen, icon: 'calendar', iconOutline: 'calendar-outline' },
    { name: 'Resources', component: ResourcesScreen, icon: 'library', iconOutline: 'library-outline' },
    { name: 'Updates', component: UpdatesScreen, icon: 'notifications', iconOutline: 'notifications-outline' },
    ...(isAdmin
      ? [{ name: 'Manage', component: AdminScreen, icon: 'shield-checkmark', iconOutline: 'shield-checkmark-outline' }]
      : []),
  ];

  const pagerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isDark = activeMode === 'dark' || activeMode === 'amoled';
  const activeColor = isDark ? '#bde0fe' : theme.accent;

  function goToTab(index) {
    pagerRef.current?.setPage(index);
  }

  function goToAdjacentTab(direction) {
    const nextIndex = activeIndex + direction;
    if (nextIndex >= 0 && nextIndex < TABS.length) {
      goToTab(nextIndex);
    }
  }

  function goToTabByName(name, params = null) {
    const index = TABS.findIndex((t) => t.name === name);
    if (index !== -1) goToTab(index);
  }

  return (
    <TabNavigationContext.Provider value={{ goToTabByName }}>
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageSelected={(e) => setActiveIndex(e.nativeEvent.position)}
        >
          {TABS.map((tab) => {
            const Screen = tab.component;
            return (
              <View key={tab.name} style={{ flex: 1 }}>
                   <Screen
                  goToAdjacentTab={goToAdjacentTab}
                  tabParams={tab.name === 'Updates' ? pendingParams : undefined}
                  />
              </View>
            );
          })}
        </PagerView>

        <View
          style={{
            flexDirection: 'row',
            backgroundColor: theme.tab,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            height: Platform.OS === 'ios' ? 85 : 68,
            paddingBottom: Platform.OS === 'ios' ? 24 : 10,
            paddingTop: 10,
          }}
        >
          {TABS.map((tab, index) => {
            const focused = activeIndex === index;
            return (
              <TouchableOpacity
                key={tab.name}
                onPress={() => goToTab(index)}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons
                  name={focused ? tab.icon : tab.iconOutline}
                  size={22}
                  color={focused ? activeColor : theme.subtext}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: focused ? activeColor : theme.subtext,
                    marginTop: 2,
                  }}
                >
                  {tab.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </TabNavigationContext.Provider>
  );
}