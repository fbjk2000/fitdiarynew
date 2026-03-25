import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { palette } from '../theme/palette';
import { styles } from '../styles/appStyles';

type AuthScreenProps = {
  isLogin: boolean;
  email: string;
  password: string;
  name: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setName: (value: string) => void;
  onSubmit: () => void;
  onToggleMode: () => void;
};

export function AuthScreen(props: AuthScreenProps) {
  const { isLogin, email, password, name, setEmail, setPassword, setName, onSubmit, onToggleMode } = props;

  return (
    <ScrollView contentContainerStyle={styles.authScreen}>
      <View style={styles.authCopy}>
        <Text style={styles.authEyebrow}>Performance journal</Text>
        <Text style={styles.authTitle}>Train clean. Fuel sharp. Track beautifully.</Text>
        <Text style={styles.authBody}>
          A more premium daily fitness log for workouts, meals, water, and streak momentum.
        </Text>
      </View>
      <View style={styles.authStats}>
        {['Sessions', 'Nutrition', 'Recovery'].map((item, index) => (
          <View key={item} style={styles.authStat}>
            <Text style={styles.authStatValue}>{`0${index + 1}`}</Text>
            <Text style={styles.authStatLabel}>{item}</Text>
          </View>
        ))}
      </View>
      <View style={styles.authCard}>
        <Text style={styles.authCardEyebrow}>{isLogin ? 'Welcome back' : 'Create your account'}</Text>
        <Text style={styles.authCardTitle}>{isLogin ? 'Enter your studio' : 'Start your next block'}</Text>
        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={palette.muted}
            value={name}
            onChangeText={setName}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={palette.muted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={palette.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.authPrimary} onPress={onSubmit}>
          <Text style={styles.authPrimaryText}>{isLogin ? 'Sign in' : 'Create account'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onToggleMode}>
          <Text style={styles.authSwitch}>
            {isLogin ? 'Need an account? Switch to sign up' : 'Already have an account? Switch to sign in'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
