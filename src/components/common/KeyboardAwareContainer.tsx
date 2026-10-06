import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import {
  ScrollView,
  ScrollViewProps,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface KeyboardScrollContextType {
  scrollToInput: (pageY: number, fieldHeight: number) => void;
}

const KeyboardScrollContext = createContext<KeyboardScrollContextType>({
  scrollToInput: () => {},
});

export const useKeyboardScroll = () => useContext(KeyboardScrollContext);

interface KeyboardAwareContainerProps extends ScrollViewProps {
  children: React.ReactNode;
  contentContainerStyle?: ViewStyle | ViewStyle[];
  extraScrollHeight?: number;
}

export const KeyboardAwareContainer: React.FC<KeyboardAwareContainerProps> = ({
  children,
  contentContainerStyle,
  extraScrollHeight = 50,
  style,
  ...rest
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollYRef = useRef<number>(0);
  const keyboardHeightRef = useRef<number>(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      keyboardHeightRef.current = e.endCoordinates.height;
      setKeyboardVisible(true);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardHeightRef.current = 0;
      setKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToInput = (pageY: number, fieldHeight: number) => {
    const screenHeight = Dimensions.get('window').height;
    // Estimated visible height above keyboard
    const kbHeight = keyboardHeightRef.current > 0 ? keyboardHeightRef.current : 280;
    const visibleAreaBottom = screenHeight - kbHeight - extraScrollHeight;

    const inputBottom = pageY + fieldHeight;
    if (inputBottom > visibleAreaBottom) {
      const scrollOffset = inputBottom - visibleAreaBottom;
      const targetY = Math.max(0, scrollYRef.current + scrollOffset);
      scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
    }
  };

  return (
    <KeyboardScrollContext.Provider value={{ scrollToInput }}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={[styles.scrollView, style]}
          contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            scrollYRef.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          {...rest}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </KeyboardScrollContext.Provider>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
});
