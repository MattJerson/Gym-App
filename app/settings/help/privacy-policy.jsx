import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import SettingsHeader from "../../../components/SettingsHeader";

export default function PrivacyPolicy() {
  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <SettingsHeader title="Privacy Policy" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.lastUpdated}>Last Updated: October 23, 2025</Text>

          <View style={styles.introSection}>
            <Text style={styles.introText}>
              At Gym App, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
            
            <Text style={styles.subSectionTitle}>Personal Information</Text>
            <Text style={styles.paragraph}>
              We collect information that you provide directly to us:
            </Text>
            <Text style={styles.bulletPoint}>• Name and email address</Text>
            <Text style={styles.bulletPoint}>• Age, gender, height, and weight</Text>
            <Text style={styles.bulletPoint}>• Fitness goals and preferences</Text>
            <Text style={styles.bulletPoint}>• Body measurements and progress photos (optional)</Text>
            <Text style={styles.bulletPoint}>• Workout and nutrition data</Text>
            
            <Text style={styles.subSectionTitle}>Automatically Collected Information</Text>
            <Text style={styles.paragraph}>
              When you use the App, we automatically collect:
            </Text>
            <Text style={styles.bulletPoint}>• Device information (type, OS version, unique identifiers)</Text>
            <Text style={styles.bulletPoint}>• Usage data (features accessed, time spent)</Text>
            <Text style={styles.bulletPoint}>• Log data (IP address, app crashes, system activity)</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
            <Text style={styles.paragraph}>
              We use your information to:
            </Text>
            <Text style={styles.bulletPoint}>• Provide and maintain the App's functionality</Text>
            <Text style={styles.bulletPoint}>• Personalize your workout and nutrition plans</Text>
            <Text style={styles.bulletPoint}>• Track your fitness progress and achievements</Text>
            <Text style={styles.bulletPoint}>• Send you notifications and updates (if enabled)</Text>
            <Text style={styles.bulletPoint}>• Improve our services and develop new features</Text>
            <Text style={styles.bulletPoint}>• Respond to your support inquiries</Text>
            <Text style={styles.bulletPoint}>• Detect and prevent fraud or abuse</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Information Sharing</Text>
            <Text style={styles.paragraph}>
              We do not sell your personal information. We may share your information only in the following circumstances:
            </Text>
            <Text style={styles.bulletPoint}>
              • <Text style={styles.bold}>With Your Consent:</Text> When you explicitly authorize us to share specific information
            </Text>
            <Text style={styles.bulletPoint}>
              • <Text style={styles.bold}>Service Providers:</Text> With third-party vendors who help us operate the App (analytics, hosting, payment processing)
            </Text>
            <Text style={styles.bulletPoint}>
              • <Text style={styles.bold}>Legal Requirements:</Text> When required by law, legal process, or government request
            </Text>
            <Text style={styles.bulletPoint}>
              • <Text style={styles.bold}>Business Transfers:</Text> In connection with a merger, acquisition, or sale of assets
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Data Security</Text>
            <Text style={styles.paragraph}>
              We implement industry-standard security measures to protect your information:
            </Text>
            <Text style={styles.bulletPoint}>• Encryption of data in transit and at rest</Text>
            <Text style={styles.bulletPoint}>• Secure authentication and access controls</Text>
            <Text style={styles.bulletPoint}>• Regular security audits and updates</Text>
            <Text style={styles.bulletPoint}>• Limited employee access to personal data</Text>
            <Text style={styles.paragraph}>
              However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Your Privacy Rights</Text>
            <Text style={styles.paragraph}>
              You have the right to:
            </Text>
            <Text style={styles.bulletPoint}>
              • <Text style={styles.bold}>Access:</Text> Request a copy of your personal data
            </Text>
            <Text style={styles.bulletPoint}>
              • <Text style={styles.bold}>Correction:</Text> Update or correct inaccurate information
            </Text>
            <Text style={styles.bulletPoint}>
              • <Text style={styles.bold}>Deletion:</Text> Request deletion of your account and data
            </Text>
            <Text style={styles.bulletPoint}>
              • <Text style={styles.bold}>Opt-Out:</Text> Unsubscribe from marketing communications
            </Text>
            <Text style={styles.bulletPoint}>
              • <Text style={styles.bold}>Data Portability:</Text> Receive your data in a structured format
            </Text>
            <Text style={styles.paragraph}>
              To exercise these rights, go to Settings {'>'} Privacy & Security or contact us at privacy@gymapp.com.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Data Retention</Text>
            <Text style={styles.paragraph}>
              We retain your information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain data for:
            </Text>
            <Text style={styles.bulletPoint}>• Legal compliance and dispute resolution</Text>
            <Text style={styles.bulletPoint}>• Fraud prevention</Text>
            <Text style={styles.bulletPoint}>• Enforcing our agreements</Text>
            <Text style={styles.paragraph}>
              Aggregated, anonymized data may be retained indefinitely for analytics and research purposes.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
            <Text style={styles.paragraph}>
              The App is not intended for children under 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, please contact us immediately.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Third-Party Services</Text>
            <Text style={styles.paragraph}>
              The App may contain links to third-party websites or integrate with third-party services (e.g., social media, fitness trackers). We are not responsible for their privacy practices. Please review their privacy policies before sharing your information.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. International Users</Text>
            <Text style={styles.paragraph}>
              Your information may be transferred to and processed in countries other than your own. By using the App, you consent to such transfers. We ensure appropriate safeguards are in place for international data transfers.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
            <Text style={styles.paragraph}>
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification. The "Last Updated" date at the top reflects when changes were made.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Contact Us</Text>
            <Text style={styles.paragraph}>
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
            </Text>
            <Text style={styles.bulletPoint}>• Email: privacy@gymapp.com</Text>
            <Text style={styles.bulletPoint}>• In-App: Settings {'>'} Help & Support {'>'} Contact Support</Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By using the Gym App, you acknowledge that you have read and understood this Privacy Policy.
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
    marginBottom: 20,
    fontStyle: "italic",
  },
  introSection: {
    padding: 20,
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: "rgba(0, 212, 170, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 170, 0.2)",
  },
  introText: {
    fontSize: 15,
    color: "#ddd",
    lineHeight: 22,
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
  subSectionTitle: {
    fontSize: 16,
    color: "#fff",
    marginTop: 12,
    marginBottom: 8,
    fontWeight: "600",
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
  bold: {
    fontWeight: "700",
    color: "#fff",
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
