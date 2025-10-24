import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import SettingsHeader from "../../../components/SettingsHeader";

export default function TermsOfService() {
  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <SettingsHeader title="Terms of Service" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.lastUpdated}>Last Updated: October 23, 2025</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
              By accessing or using the Gym App ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Use of Service</Text>
            <Text style={styles.paragraph}>
              You must be at least 13 years old to use this App. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </Text>
            <Text style={styles.paragraph}>
              You agree to use the App only for lawful purposes and in accordance with these Terms. You must not:
            </Text>
            <Text style={styles.bulletPoint}>• Violate any applicable laws or regulations</Text>
            <Text style={styles.bulletPoint}>• Infringe on intellectual property rights</Text>
            <Text style={styles.bulletPoint}>• Transmit harmful or malicious code</Text>
            <Text style={styles.bulletPoint}>• Attempt to gain unauthorized access to any part of the App</Text>
            <Text style={styles.bulletPoint}>• Interfere with or disrupt the App's functionality</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. User Content</Text>
            <Text style={styles.paragraph}>
              You retain ownership of any content you submit to the App. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display your content for the purpose of operating and improving the App.
            </Text>
            <Text style={styles.paragraph}>
              You are solely responsible for your content and the consequences of posting it. We reserve the right to remove any content that violates these Terms or is otherwise objectionable.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Health Disclaimer</Text>
            <Text style={styles.paragraph}>
              The App provides fitness and nutrition information for general educational purposes only. This information is not intended as medical advice, diagnosis, or treatment.
            </Text>
            <Text style={styles.paragraph}>
              Always consult with a qualified healthcare professional before starting any exercise program or making dietary changes, especially if you have any pre-existing health conditions.
            </Text>
            <Text style={styles.paragraph}>
              We are not responsible for any injuries or health problems that may occur from using the App or following its recommendations.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Subscription and Payments</Text>
            <Text style={styles.paragraph}>
              Certain features of the App require a paid subscription. Subscription fees are charged on a recurring basis according to your selected plan.
            </Text>
            <Text style={styles.paragraph}>
              You may cancel your subscription at any time, but no refunds will be provided for partial subscription periods. Your access will continue until the end of your current billing cycle.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
            <Text style={styles.paragraph}>
              The App and its content, including but not limited to text, graphics, logos, images, and software, are the property of Gym App and are protected by copyright, trademark, and other intellectual property laws.
            </Text>
            <Text style={styles.paragraph}>
              You may not copy, modify, distribute, sell, or lease any part of the App or its content without our express written permission.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
            <Text style={styles.paragraph}>
              To the fullest extent permitted by law, Gym App shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the App.
            </Text>
            <Text style={styles.paragraph}>
              In no event shall our total liability exceed the amount you paid for the App in the past twelve months.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Changes to Terms</Text>
            <Text style={styles.paragraph}>
              We reserve the right to modify these Terms at any time. We will notify you of significant changes via email or through the App. Your continued use of the App after such modifications constitutes acceptance of the updated Terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Termination</Text>
            <Text style={styles.paragraph}>
              We may terminate or suspend your account and access to the App at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Governing Law</Text>
            <Text style={styles.paragraph}>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Gym App operates, without regard to its conflict of law provisions.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Contact Us</Text>
            <Text style={styles.paragraph}>
              If you have any questions about these Terms, please contact us through the Contact Support page in the App or email us at support@gymapp.com.
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By using the Gym App, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 40 },
  lastUpdated: {
    fontSize: 13,
    color: "#666",
    marginBottom: 24,
    fontStyle: "italic",
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#00D4AA",
    marginBottom: 12,
    fontWeight: "bold",
  },
  paragraph: {
    fontSize: 15,
    color: "#ddd",
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 15,
    color: "#ddd",
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 8,
  },
  footer: {
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "rgba(0, 212, 170, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 170, 0.2)",
  },
  footerText: {
    fontSize: 14,
    color: "#999",
    lineHeight: 20,
    textAlign: "center",
  },
});
