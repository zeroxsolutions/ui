import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DirectionProvider, type TextDirection } from '@/components/ui/direction';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const TRANSLATIONS = {
  en: {
    dir: 'ltr',
    language: 'English',
    title: 'Login to your account',
    description: 'Enter your email below to login to your account',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot your password?',
    login: 'Login',
  },
  ar: {
    dir: 'rtl',
    language: 'العربية',
    title: 'تسجيل الدخول إلى حسابك',
    description: 'أدخل بريدك الإلكتروني أدناه لتسجيل الدخول إلى حسابك',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    forgotPassword: 'نسيت كلمة المرور؟',
    login: 'تسجيل الدخول',
  },
} as const satisfies Record<string, { dir: TextDirection } & Record<string, string>>;

type Language = keyof typeof TRANSLATIONS;

function DirectionDemo(): ReactNode {
  const [language, setLanguage] = useState<Language>('ar');
  const t = TRANSLATIONS[language];

  return (
    <View className="gap-4">
      <ToggleGroup
        type="single"
        value={language}
        onValueChange={(next) => {
          if (next === 'en' || next === 'ar') setLanguage(next);
        }}
        variant="outline"
        spacing={0}
        className="self-start"
      >
        {(Object.keys(TRANSLATIONS) as Language[]).map((key) => (
          <ToggleGroupItem key={key} value={key}>
            <Text>{TRANSLATIONS[key].language}</Text>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <DirectionProvider direction={t.dir}>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </CardHeader>
          <CardContent className="gap-6">
            <View className="gap-2">
              <Label nativeID="direction-email">{t.email}</Label>
              <Input
                placeholder="m@example.com"
                keyboardType="email-address"
                aria-label={t.email}
                aria-labelledby="direction-email"
              />
            </View>
            <View className="gap-2">
              <View className="flex-row items-center">
                <Label nativeID="direction-password">{t.password}</Label>
                <Text role="link" className="ms-auto text-sm underline">
                  {t.forgotPassword}
                </Text>
              </View>
              <Input secureTextEntry aria-label={t.password} aria-labelledby="direction-password" />
            </View>
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              <Text>{t.login}</Text>
            </Button>
          </CardFooter>
        </Card>
      </DirectionProvider>
    </View>
  );
}

export { DirectionDemo };
