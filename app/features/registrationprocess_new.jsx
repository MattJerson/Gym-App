import { View, Text } from 'react-native';

export default function RegistrationProcessNew() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
        Registration (Coming Soon)
      </Text>
      <Text style={{ fontSize: 14, color: '#555', textAlign: 'center' }}>
        This screen is a placeholder to satisfy routing. You can remove or replace
        app/features/registrationprocess_new.jsx when the real flow is ready.
      </Text>
    </View>
  );
}
