import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';
import { useKeyboardScroll } from './KeyboardAwareContainer';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  isPassword?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerStyle,
      isPassword = false,
      style,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const containerRef = useRef<View>(null);
    const textInputRef = useRef<TextInput>(null);
    const { scrollToInput } = useKeyboardScroll();

    useImperativeHandle(ref, () => textInputRef.current as TextInput);

    const handleFocus = (e: any) => {
      setIsFocused(true);
      if (containerRef.current && scrollToInput) {
        // Delay slightly to let keyboard emerge if not already open
        setTimeout(() => {
          containerRef.current?.measureInWindow((_x, y, _width, height) => {
            if (typeof y === 'number' && !isNaN(y)) {
              scrollToInput(y, height);
            }
          });
        }, 100);
      }
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <View ref={containerRef} style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View
          style={[
            styles.inputContainer,
            isFocused && styles.inputFocused,
            Boolean(error) && styles.inputError,
            props.multiline && styles.inputMultiline,
          ]}
        >
          {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

          <TextInput
            ref={textInputRef}
            style={[
              styles.input,
              leftIcon ? { paddingLeft: 0 } : null,
              rightIcon || isPassword ? { paddingRight: 0 } : null,
              style,
            ]}
            placeholderTextColor="#94A3B8"
            secureTextEntry={isPassword && !isPasswordVisible}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />

          {isPassword && (
            <TouchableOpacity
              style={styles.rightIconContainer}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>
          )}

          {rightIcon && !isPassword && (
            <View style={styles.rightIconContainer}>{rightIcon}</View>
          )}
        </View>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : helperText ? (
          <Text style={styles.helperText}>{helperText}</Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3EF',
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  inputFocused: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary,
  },
  inputError: {
    borderColor: COLORS.danger,
    backgroundColor: '#FEF2F2',
  },
  inputMultiline: {
    alignItems: 'flex-start',
    paddingVertical: 10,
    minHeight: 80,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textDark,
    paddingVertical: 10,
  },
  leftIconContainer: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIconContainer: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 11,
    color: COLORS.danger,
    marginTop: 4,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
  },
});
