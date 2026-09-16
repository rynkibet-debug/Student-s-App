import React, { useContext, useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

import { ThemeContext } from '../context/themeContext';

export default function DropdownSelect({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select an option',
  disabled = false,
}) {
  const { theme } = useContext(ThemeContext);
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Text
        style={{
          color: theme.subtext,
          fontSize: 13,
          fontWeight: '600',
          marginBottom: 6,
        }}
      >
        {label}
      </Text>

      <TouchableOpacity
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.8}
        disabled={disabled}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.card,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Text
          style={{
            color: value ? theme.text : theme.subtext,
            fontSize: 15,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={theme.subtext}
        />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: theme.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderWidth: 1,
              borderColor: theme.border,
              maxHeight: '60%',
              paddingBottom: 20,
            }}
          >
            <View
              style={{
                alignItems: 'center',
                paddingVertical: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.border,
                }}
              />
            </View>

            <Text
              style={{
                color: theme.text,
                fontWeight: '700',
                fontSize: 16,
                paddingHorizontal: 20,
                marginBottom: 12,
              }}
            >
              {label}
            </Text>

            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = item === value;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 20,
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border,
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? theme.accent : theme.text,
                        fontSize: 15,
                        fontWeight: isSelected ? '700' : '400',
                        flex: 1,
                      }}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={theme.accent}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}