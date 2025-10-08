import React, { forwardRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FormInput from "../../FormInput";

const TextField = forwardRef(({
  field,
  value,
  onChangeText,
  onBlur,
  onSubmitEditing,
  placeholder,
  error,
  textContentType,
}, ref) => {
  return (
    <View style={styles.container}>
      <FormInput
        ref={ref}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={field.keyboardType || 'default'}
        returnKeyType={field.returnKeyType || 'done'}
        textContentType={textContentType}
        onSubmitEditing={onSubmitEditing}
        onBlur={onBlur}
        errorMessage={error}
      />
    </View>
  );
});

TextField.displayName = 'TextField';

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});

export default TextField;
