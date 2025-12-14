import React from "react";
import { View, Text, StyleSheet } from "react-native";
import TextField from "./fields/TextField";
import DropdownField from "./fields/DropdownField";
import SwitchField from "./fields/SwitchField";
import MultiButtonField from "./fields/MultiButtonField";
import CalculatedField from "./fields/CalculatedField";
import EmojiPicker from "./EmojiPicker";

export default function FormStep({
  step,
  formData,
  errors,
  openDropdown,
  handleInputChange,
  handleFieldBlur,
  handleDropdownOpen,
  onHapticFeedback,
  inputRefs,
  getPlaceholder,
}) {
  const renderField = (field, index) => {
    const commonProps = {
      field,
      value: formData[field.key],
      error: errors[field.key],
    };

    switch (field.type) {
      case "text":
        return (
          <TextField
            {...commonProps}
            ref={(el) => (inputRefs.current[field.key] = el)}
            onChangeText={(text) => handleInputChange(field.key, text)}
            onBlur={() => handleFieldBlur(field.key)}
            onSubmitEditing={() => {
              const nextField = step.fields[index + 1];
              if (nextField && nextField.type === "text") {
                inputRefs.current[nextField.key]?.focus();
              }
            }}
            placeholder={getPlaceholder(field)}
            textContentType={field.textContentType}
          />
        );

      case "dropdown":
        return (
          <DropdownField
            {...commonProps}
            onChange={(callback) =>
              handleInputChange(
                field.key,
                typeof callback === "function"
                  ? callback(formData[field.key])
                  : callback
              )
            }
            onToggle={() => handleDropdownOpen(field.key)}
            isOpen={openDropdown === field.key}
            placeholder={getPlaceholder(field)}
          />
        );

      case "switch":
        return (
          <SwitchField
            {...commonProps}
            onChange={(value) => handleInputChange(field.key, value)}
          />
        );

      case "multi-button":
        return (
          <MultiButtonField
            {...commonProps}
            onChange={(value) => handleInputChange(field.key, value)}
            onPress={onHapticFeedback}
          />
        );

      case "emoji-picker":
        return (
          <EmojiPicker
            {...commonProps}
            emojis={field.emojis || ["😊", "😎", "🔥", "💪", "⚡", "🚀"]}
            onSelect={(emoji) => handleInputChange(field.key, emoji)}
            horizontal={field.horizontal}
          />
        );

      case "calculated":
        return (
          <CalculatedField
            {...commonProps}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.stepContainer}>
      {step.subtitle && (
        <Text style={styles.subtitle}>{step.subtitle}</Text>
      )}
      {step.fields.map((field, index) => (
        <View key={field.key} style={{ marginVertical: 8 }}>
          {renderField(field, index)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    width: "100%",
  },
  subtitle: {
    fontSize: 14,
    color: "#999",
  marginBottom: 8,
    textAlign: "center",
  },
});
