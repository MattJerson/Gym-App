import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";

export default function DropdownField({
  field,
  value,
  onChange,
  onToggle,
  isOpen,
  error,
  placeholder,
}) {
  return (
    <View style={styles.fieldWrapper}>
      <View style={[
        styles.formInputContainer,
        isOpen && styles.formInputFocused,
        error && styles.formInputError
      ]}>
        <View style={styles.formInputIconContainer}>
          <Ionicons
            name={isOpen ? "chevron-up-outline" : "chevron-down-outline"}
            style={[
              styles.formInputIcon,
              isOpen && styles.formInputIconFocused,
              error && styles.formInputIconError
            ]}
          />
        </View>
        <DropDownPicker 
          open={isOpen} 
          value={value} 
          items={field.items} 
          setOpen={onToggle}
          setValue={(callback) => onChange(callback(value))} 
          multiple={field.multiple || false} 
          mode={field.multiple ? "BADGE" : "SIMPLE"} 
          placeholder={placeholder}
          style={styles.dropdownInput} 
          dropDownContainerStyle={[
            styles.dropdownContainer,
            field.multiple && { minHeight: 150 }
          ]}
          showArrowIcon={false}
          listMode="SCROLLVIEW"
          scrollViewProps={{
            nestedScrollEnabled: true,
          }}
          textStyle={{ color: "#fff", fontSize: 16 }} 
          labelStyle={{ color: "#fff", fontSize: 16 }} 
          placeholderStyle={{ color: "#666", fontSize: 16 }}
          arrowIconStyle={{ tintColor: "#1E3A5F" }}
          tickIconStyle={{ tintColor: "#1E3A5F" }}
          badgeTextStyle={{ color: "#000", fontSize: 13 }}
          badgeDotStyle={{ backgroundColor: "#1E3A5F" }}
          searchable={false}
          zIndex={field.zIndex}
        />
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrapper: {
  width: "100%",
  marginTop: 4,
  marginBottom: 4,
  },
  formInputContainer: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  formInputFocused: {
    borderColor: "#1E3A5F",
    backgroundColor: "rgba(30, 58, 95, 0.1)",
  },
  formInputError: {
    borderColor: "#F44336",
    backgroundColor: "rgba(244, 67, 54, 0.1)",
  },
  formInputIconContainer: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  formInputIcon: {
    fontSize: 20,
  paddingHorizontal: 8,
    color: "#666",
  },
  formInputIconFocused: {
    color: "#1E3A5F",
  },
  formInputIconError: {
    color: "#F44336",
  },
  dropdownInput: {
    backgroundColor: "transparent",
    borderWidth: 0,
    flex: 1,
    height: "100%",
    paddingHorizontal: 0,
  },
  dropdownContainer: {
    backgroundColor: "#333333",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    marginLeft: -24,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginLeft: 8,
    gap: 6,
  },
  errorText: {
    color: "#F44336",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
});
