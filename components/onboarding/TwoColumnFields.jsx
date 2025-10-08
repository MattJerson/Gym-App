import React from "react";
import { View, Text, StyleSheet } from "react-native";
import TextField from "./fields/TextField";
import SwitchField from "./fields/SwitchField";

export default function TwoColumnFields({
  heightField,
  weightField,
  useMetricField,
  formData,
  errors,
  handleInputChange,
  handleFieldBlur,
  inputRefs,
  getPlaceholder,
}) {
  return (
    <View style={styles.container}>
      <SwitchField
        field={useMetricField}
        value={formData[useMetricField.key]}
        onChange={(value) => handleInputChange(useMetricField.key, value)}
      />
      
      <View style={styles.twoColumnRow}>
        <View style={styles.column}>
          <TextField
            field={heightField}
            ref={(el) => (inputRefs.current[heightField.key] = el)}
            value={formData[heightField.key]}
            onChangeText={(text) => handleInputChange(heightField.key, text)}
            onBlur={() => handleFieldBlur(heightField.key)}
            placeholder={getPlaceholder(heightField)}
            error={errors[heightField.key]}
          />
        </View>
        <View style={styles.column}>
          <TextField
            field={weightField}
            ref={(el) => (inputRefs.current[weightField.key] = el)}
            value={formData[weightField.key]}
            onChangeText={(text) => handleInputChange(weightField.key, text)}
            onBlur={() => handleFieldBlur(weightField.key)}
            placeholder={getPlaceholder(weightField)}
            error={errors[weightField.key]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  column: {
    flex: 1,
  },
});
