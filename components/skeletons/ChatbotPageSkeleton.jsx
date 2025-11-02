import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonCard, SkeletonCircle, SkeletonText } from '../SkeletonLoader';

export const ChatbotPageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header Area */}
      <View style={styles.header}>
        <SkeletonCircle size={24} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <SkeletonText width="40%" lines={1} style={{ marginBottom: 4 }} />
          <SkeletonText width="20%" lines={1} />
        </View>
      </View>

      {/* Messages Area */}
      <View style={styles.messagesArea}>
        {/* Bot Message */}
        <View style={styles.botMessageContainer}>
          <SkeletonCircle size={32} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <SkeletonLoader 
              width="80%" 
              height={60} 
              borderRadius={16} 
              style={{ marginBottom: 4 }}
            />
            <SkeletonText width="25%" lines={1} />
          </View>
        </View>

        {/* User Message */}
        <View style={styles.userMessageContainer}>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <SkeletonLoader 
              width="70%" 
              height={50} 
              borderRadius={16} 
              style={{ marginBottom: 4 }}
            />
            <SkeletonText width="20%" lines={1} />
          </View>
        </View>

        {/* Bot Message */}
        <View style={styles.botMessageContainer}>
          <SkeletonCircle size={32} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <SkeletonLoader 
              width="90%" 
              height={80} 
              borderRadius={16} 
              style={{ marginBottom: 4 }}
            />
            <SkeletonText width="25%" lines={1} />
          </View>
        </View>

        {/* User Message */}
        <View style={styles.userMessageContainer}>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <SkeletonLoader 
              width="60%" 
              height={40} 
              borderRadius={16} 
              style={{ marginBottom: 4 }}
            />
            <SkeletonText width="20%" lines={1} />
          </View>
        </View>
      </View>

      {/* Input Area */}
      <View style={styles.inputArea}>
        <SkeletonLoader width="100%" height={50} borderRadius={25} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  messagesArea: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  botMessageContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'flex-end',
  },
  inputArea: {
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
});
