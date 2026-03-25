import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/appStyles';

type ModalShellProps = {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSave: () => void;
};

export function ModalShell({ eyebrow, title, children, onClose, onSave }: ModalShellProps) {
  return (
    <View style={styles.modalBackdrop}>
      <View style={styles.modalSheet}>
        <Text style={styles.modalEyebrow}>{eyebrow}</Text>
        <Text style={styles.modalTitle}>{title}</Text>
        {children}
        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.modalGhost} onPress={onClose}>
            <Text style={styles.modalGhostText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalPrimary} onPress={onSave}>
            <Text style={styles.modalPrimaryText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
