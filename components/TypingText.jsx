import React, { useState, useEffect, useRef } from "react";
import { Text, StyleSheet, Animated } from "react-native";

/**
 * TypingText Component
 * Displays a typing animation that shows one message, then transitions to another
 * 
 * @param {string} firstMessage - Initial message to type out (e.g., "Let's get started today, User!")
 * @param {string} secondMessage - Final message to display (e.g., "Home")
 * @param {number} typingSpeed - Milliseconds per character (default: 80 - slower for better readability)
 * @param {number} pauseBetween - Milliseconds to pause between messages (default: 2500 - longer pause)
 * @param {function} onComplete - Callback when animation completes
 */
const TypingText = ({ 
  firstMessage, 
  secondMessage, 
  typingSpeed = 80, 
  pauseBetween = 2500,
  onComplete,
  style 
}) => {
  const [displayText, setDisplayText] = useState("");
  const [currentPhase, setCurrentPhase] = useState("typing"); // typing, paused, fading, complete
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let currentIndex = 0;
    let timeoutId;

    const typeNextCharacter = () => {
      if (currentIndex < firstMessage.length) {
        setDisplayText(firstMessage.substring(0, currentIndex + 1));
        currentIndex++;
        timeoutId = setTimeout(typeNextCharacter, typingSpeed);
      } else {
        // Finished typing first message, pause before transitioning
        setCurrentPhase("paused");
        timeoutId = setTimeout(() => {
          setCurrentPhase("fading");
          
          // Smooth fade out and scale animation
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.9,
              duration: 600,
              useNativeDriver: true,
            })
          ]).start(() => {
            // Change text while invisible
            setDisplayText(secondMessage);
            
            // Fade in and scale up the new text
            Animated.parallel([
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
              }),
              Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
              })
            ]).start(() => {
              setCurrentPhase("complete");
              if (onComplete) {
                onComplete();
              }
            });
          });
        }, pauseBetween);
      }
    };

    typeNextCharacter();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [firstMessage, secondMessage, typingSpeed, pauseBetween, onComplete]);

  return (
    <Animated.Text 
      style={[
        styles.text, 
        style,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      {displayText}
      {currentPhase === "typing" && <Text style={styles.cursor}>|</Text>}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  cursor: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4A9EFF",
    opacity: 0.8,
  },
});

export default TypingText;
