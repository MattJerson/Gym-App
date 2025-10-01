import React, { useState, forwardRef, useImperativeHandle, useRef } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // still needed if you want password eye toggle

const FormInput = forwardRef(({
  placeholder,
  value,
  onChangeText,
  secure = false,
  keyboardType = "default",
  isPassword = false,
  errorMessage = "",
  returnKeyType = "done",
  onSubmitEditing,
  onBlur,
  textContentType,
  // accept any other TextInput props (autoComplete, importantForAutofill, etc.)
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef();

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
  }));

  const handleBlur = () => {
    setFocused(false);
    if (onBlur) onBlur();
  };

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.inputContainer,
          focused && styles.inputFocused,
          errorMessage && styles.inputError,
        ]}
      >
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !isVisible}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          textContentType={textContentType}
          {...props}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          onSubmitEditing={onSubmitEditing}
        />
        {isPassword && (
          <Pressable
            style={styles.eyeButton}
            onPress={() => setIsVisible((prev) => !prev)}
          >
            <Ionicons
              name={isVisible ? "eye-off" : "eye"}
              size={20}
              color="#CCCCCC"
              style={styles.eyeIcon}
            />
          </Pressable>
        )}
      </View>

      {/* Reserve space for error text */}
      <View style={styles.errorContainer}>
        {errorMessage ? (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        ) : (
          <Text style={styles.errorMessagePlaceholder}> </Text>
        )}
      </View>
    </View>
  );
});

FormInput.displayName = "FormInput";

export default FormInput;

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginBottom: 8,
  },
  inputContainer: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  inputFocused: {
    borderColor: "#1E3A5F",
    backgroundColor: "rgba(30, 58, 95, 0.1)",
  },
  inputError: {
    borderColor: "#F44336",
    backgroundColor: "rgba(244, 67, 54, 0.1)",
  },
  textInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 24,
    fontSize: 16,
    color: "#fff",
  },
  eyeButton: {
    width: 44,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  eyeIcon: {
    zIndex: 1,
  },
  errorContainer: {
    minHeight: 18, // always reserve space for error message
    justifyContent: "center",
  },
  errorMessage: {
    marginLeft: 8,
    paddingTop: 4,
    color: "#F44336",
    fontSize: 12,
    fontWeight: "500",
  },
  errorMessagePlaceholder: {
    marginLeft: 8,
    fontSize: 12,
    opacity: 0, // invisible but takes up space
  },
});
