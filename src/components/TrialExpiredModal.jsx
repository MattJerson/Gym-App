import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function TrialExpiredModal({ visible, onDismiss }) {
  const router = useRouter();

  const handleUpgrade = () => {
    onDismiss();
    router.push('/subscriptionpackages');
  };

  const handleContinueFree = () => {
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <LinearGradient
              colors={['#FF6B35', '#F7931E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <Ionicons name="alert-circle" size={60} color="#FFF" />
              <Text style={styles.headerTitle}>Your Free Trial Has Ended</Text>
              <Text style={styles.headerSubtitle}>
                7 days of premium features completed
              </Text>
            </LinearGradient>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>
                Upgrade Now to Keep These Features:
              </Text>

              {/* Premium Features */}
              <View style={styles.featuresList}>
                <FeatureItem 
                  icon="fitness" 
                  text="Unlimited workout tracking" 
                  isPremium={true}
                />
                <FeatureItem 
                  icon="nutrition" 
                  text="Advanced calorie & macro tracking" 
                  isPremium={true}
                />
                <FeatureItem 
                  icon="trending-up" 
                  text="Detailed progress analytics" 
                  isPremium={true}
                />
                <FeatureItem 
                  icon="chatbubbles" 
                  text="Community chat & direct messaging" 
                  isPremium={true}
                />
                <FeatureItem 
                  icon="trophy" 
                  text="Badges & achievements system" 
                  isPremium={true}
                />
                <FeatureItem 
                  icon="stats-chart" 
                  text="Weight progress tracking" 
                  isPremium={true}
                />
              </View>

              {/* What You'll Lose */}
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={24} color="#FF6B35" />
                <View style={styles.warningTextContainer}>
                  <Text style={styles.warningTitle}>
                    Without upgrading, you'll lose:
                  </Text>
                  <Text style={styles.warningText}>
                    • Access to all premium features{'\n'}
                    • Your workout history and progress data{'\n'}
                    • Community access and messages{'\n'}
                    • Calorie tracking and nutrition logs
                  </Text>
                </View>
              </View>

              {/* Pricing Highlight */}
              <View style={styles.pricingBox}>
                <Text style={styles.pricingLabel}>Starting at</Text>
                <Text style={styles.pricingAmount}>$27.99/month</Text>
                <Text style={styles.pricingNote}>
                  Save more with 6-month or 12-month plans!
                </Text>
              </View>

              {/* CTA Buttons */}
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgrade}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF6B35', '#F7931E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.upgradeGradient}
                >
                  <Text style={styles.upgradeButtonText}>
                    View Plans & Upgrade Now
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinueFree}
                activeOpacity={0.7}
              >
                <Text style={styles.continueButtonText}>
                  Continue with Free (Basic)
                </Text>
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                By continuing with the free version, you'll be switched to our Basic plan with limited features.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function FeatureItem({ icon, text, isPremium }) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.iconCircle, isPremium && styles.iconCirclePremium]}>
        <Ionicons 
          name={icon} 
          size={20} 
          color={isPremium ? '#FF6B35' : '#666'} 
        />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: width - 40,
    maxHeight: '90%',
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 15,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 15,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconCirclePremium: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
  },
  featureText: {
    fontSize: 15,
    color: '#FFF',
    flex: 1,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  warningTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  pricingBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  pricingLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 5,
  },
  pricingAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 5,
  },
  pricingNote: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  upgradeButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  upgradeButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    marginRight: 8,
  },
  continueButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 15,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  disclaimer: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 16,
  },
});
