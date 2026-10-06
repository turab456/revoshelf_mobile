import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { ListingDetailScreen } from '../screens/main/ListingDetailScreen';
import { CreateListingScreen } from '../screens/main/CreateListingScreen';
import { EditListingScreen } from '../screens/main/EditListingScreen';
import { SellerProfileScreen } from '../screens/main/SellerProfileScreen';
import { ChatDetailScreen } from '../screens/main/ChatDetailScreen';
import { MyListingsScreen } from '../screens/main/MyListingsScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { MessagesScreen } from '../screens/main/MessagesScreen';
import { SearchScreen } from '../screens/main/SearchScreen';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { VerifyEmailScreen } from '../screens/auth/VerifyEmailScreen';

// Static Screens
import { AboutUsScreen } from '../screens/static/AboutUsScreen';
import { ContactUsScreen } from '../screens/static/ContactUsScreen';
import { HelpCenterScreen } from '../screens/static/HelpCenterScreen';
import { FaqScreen } from '../screens/static/FaqScreen';
import { SafetyTipsScreen } from '../screens/static/SafetyTipsScreen';
import { ReportIssueScreen } from '../screens/static/ReportIssueScreen';
import { PrivacyPolicyScreen } from '../screens/static/PrivacyPolicyScreen';
import { TermsConditionsScreen } from '../screens/static/TermsConditionsScreen';
import { CommunityGuidelinesScreen } from '../screens/static/CommunityGuidelinesScreen';
import { HowItWorksScreen } from '../screens/static/HowItWorksScreen';

import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {/* Main Tab App Shell */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />

        {/* Marketplace & Details */}
        <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
        <Stack.Screen name="CreateListing" component={CreateListingScreen} />
        <Stack.Screen name="EditListing" component={EditListingScreen} />
        <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />

        {/* Real-time Messaging */}
        <Stack.Screen name="Messages" component={MessagesScreen} />
        <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />

        {/* User Inventory & Settings */}
        <Stack.Screen name="MyListings" component={MyListingsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />

        {/* Auth Flows */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />

        {/* Static & Informational Screens */}
        <Stack.Screen name="AboutUs" component={AboutUsScreen} />
        <Stack.Screen name="ContactUs" component={ContactUsScreen} />
        <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
        <Stack.Screen name="Faq" component={FaqScreen} />
        <Stack.Screen name="SafetyTips" component={SafetyTipsScreen} />
        <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
        <Stack.Screen name="CommunityGuidelines" component={CommunityGuidelinesScreen} />
        <Stack.Screen name="HowItWorks" component={HowItWorksScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
