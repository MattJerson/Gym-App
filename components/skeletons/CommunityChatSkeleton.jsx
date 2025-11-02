import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonCircle, SkeletonText } from '../SkeletonLoader';

export const CommunityChatSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SkeletonCircle size={24} style={{ marginRight: 12 }} />
          <View>
            <SkeletonText width={120} lines={1} style={{ marginBottom: 4 }} />
            <SkeletonText width={80} lines={1} />
          </View>
        </View>
        <SkeletonCircle size={40} />
      </View>

      {/* Messages List */}
      <View style={styles.messagesArea}>
        {/* Message 1 */}
        <View style={styles.messageContainer}>
          <SkeletonCircle size={36} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <View style={styles.messageHeader}>
              <SkeletonText width="30%" lines={1} style={{ marginBottom: 6 }} />
              <SkeletonText width="15%" lines={1} />
            </View>
            <SkeletonLoader width="85%" height={50} borderRadius={12} />
          </View>
        </View>

        {/* Message 2 */}
        <View style={styles.messageContainer}>
          <SkeletonCircle size={36} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <View style={styles.messageHeader}>
              <SkeletonText width="25%" lines={1} style={{ marginBottom: 6 }} />
              <SkeletonText width="15%" lines={1} />
            </View>
            <SkeletonLoader width="70%" height={40} borderRadius={12} />
          </View>
        </View>

        {/* Message 3 */}
        <View style={styles.messageContainer}>
          <SkeletonCircle size={36} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <View style={styles.messageHeader}>
              <SkeletonText width="35%" lines={1} style={{ marginBottom: 6 }} />
              <SkeletonText width="15%" lines={1} />
            </View>
            <SkeletonLoader width="90%" height={60} borderRadius={12} />
          </View>
        </View>

        {/* Message 4 */}
        <View style={styles.messageContainer}>
          <SkeletonCircle size={36} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <View style={styles.messageHeader}>
              <SkeletonText width="28%" lines={1} style={{ marginBottom: 6 }} />
              <SkeletonText width="15%" lines={1} />
            </View>
            <SkeletonLoader width="75%" height={45} borderRadius={12} />
          </View>
        </View>
      </View>

      {/* Input Area */}
      <View style={styles.inputArea}>
        <SkeletonCircle size={40} style={{ marginRight: 10 }} />
        <SkeletonLoader width="75%" height={48} borderRadius={24} style={{ flex: 1 }} />
        <SkeletonCircle size={40} style={{ marginLeft: 10 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1a1a1a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messagesArea: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1a1a1a',
  },
});
