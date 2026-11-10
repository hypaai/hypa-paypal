import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

import { SelectorModal } from '@/components/modules/settings/selector-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { FONTS } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/use-theme-color';
import { CURRENCIES, TIME_OPTIONS, WEEKDAY_NAMES, formatTime, type BridgeProfileForm } from '@/lib/bridge';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-[13px] text-zinc-900 dark:text-zinc-50" style={{ fontFamily: FONTS.main.medium }}>
        {label}
      </Text>
      {children}
      {hint ? (
        <Text className="mt-1 text-[12px] text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.regular }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** A dropdown: looks like a field, opens a list to choose from. */
function Select({ label, onPress, compact }: { label: string; onPress: () => void; compact?: boolean }) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`flex-row items-center justify-between rounded-md border border-input bg-background dark:bg-input/30 ${compact ? 'h-9 gap-1 px-2.5' : 'h-10 px-3'}`}>
      <Text className={compact ? 'text-[13px] text-zinc-900 dark:text-zinc-50' : 'text-base text-zinc-900 dark:text-zinc-50'} style={{ fontFamily: FONTS.main.regular }}>
        {label}
      </Text>
      <ChevronDown size={compact ? 14 : 18} color={colors.iconMuted} />
    </Pressable>
  );
}

/** The business facts the assistant is allowed to use. Prices here are the only prices it will quote. */
export function ProfileForm({ value, onChange }: { value: BridgeProfileForm; onChange: (next: BridgeProfileForm) => void }) {
  const [picker, setPicker] = useState<{ kind: 'currency' } | { kind: 'time'; index: number; field: 'open' | 'close' } | null>(null);
  const set = <K extends keyof BridgeProfileForm>(key: K, next: BridgeProfileForm[K]) => onChange({ ...value, [key]: next });
  const setRow = (index: number, row: Partial<BridgeProfileForm['priceList'][number]>) =>
    set('priceList', value.priceList.map((existing, i) => (i === index ? { ...existing, ...row } : existing)));
  const setDay = (index: number, day: Partial<BridgeProfileForm['hours'][number]>) =>
    set('hours', value.hours.map((existing, i) => (i === index ? { ...existing, ...day } : existing)));
  /** A day switched on starts with the hours of a day already open, so a week takes one set of times. */
  const toggleDay = (index: number, on: boolean) => {
    const model = value.hours.find((day) => day.on);
    setDay(index, on && model ? { on, open: model.open, close: model.close } : { on });
  };

  const day = picker?.kind === 'time' ? value.hours[picker.index] : undefined;

  return (
    <View>
      <Field label="Business name">
        <Input value={value.name} onChangeText={(text) => set('name', text)} placeholder="Ada's Tailoring" />
      </Field>
      <Field label="What you sell">
        <Input value={value.sells} onChangeText={(text) => set('sells', text)} placeholder="Men's and women's native wear" />
      </Field>
      <Field label="Currency" hint="Your prices and the assistant's quotes use this currency.">
        <Select label={CURRENCIES.find((currency) => currency.name === value.currency)?.displayName ?? value.currency} onPress={() => setPicker({ kind: 'currency' })} />
      </Field>

      <Field label="Price list" hint="The assistant only quotes these prices. Anything else goes to you.">
        {value.priceList.map((row, index) => (
          <View key={index} className="mb-2 flex-row gap-2">
            <Input className="flex-1" value={row.name} onChangeText={(text) => setRow(index, { name: text })} placeholder="Agbada, 3 piece" />
            <Input className="w-28" value={row.price} onChangeText={(text) => setRow(index, { price: text })} placeholder="85000" keyboardType="numeric" />
            {value.priceList.length > 1 ? (
              <Button variant="ghost" size="sm" accessibilityLabel="Remove item" onPress={() => set('priceList', value.priceList.filter((_, i) => i !== index))}>
                <Text>✕</Text>
              </Button>
            ) : null}
          </View>
        ))}
        <Button variant="outline" size="sm" onPress={() => set('priceList', [...value.priceList, { name: '', price: '' }])}>
          <Text>Add item</Text>
        </Button>
      </Field>

      <Field label="Opening hours (optional)" hint="Switch on the days you open. The assistant tells customers you are closed on the rest.">
        {value.hours.map((row, index) => (
          <View key={row.day} className="flex-row items-center py-1.5">
            <Switch checked={row.on} onCheckedChange={(on) => toggleDay(index, on)} accessibilityLabel={WEEKDAY_NAMES[row.day]} />
            <Text className="ml-3 w-12 text-[14px] text-zinc-900 dark:text-zinc-50" style={{ fontFamily: FONTS.main.medium }}>
              {WEEKDAY_NAMES[row.day].slice(0, 3)}
            </Text>
            {row.on ? (
              <View className="flex-1 flex-row items-center justify-end gap-1.5">
                <Select compact label={formatTime(row.open)} onPress={() => setPicker({ kind: 'time', index, field: 'open' })} />
                <Text className="text-[13px] text-zinc-500 dark:text-zinc-400">to</Text>
                <Select compact label={formatTime(row.close)} onPress={() => setPicker({ kind: 'time', index, field: 'close' })} />
              </View>
            ) : (
              <Text className="flex-1 text-right text-[13px] text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.regular }}>
                Closed
              </Text>
            )}
          </View>
        ))}
      </Field>

      <Field label="Languages" hint="Separate with commas. The assistant still answers in the language the customer writes in.">
        <Input value={value.languages} onChangeText={(text) => set('languages', text)} placeholder="English, Pidgin, Yoruba" />
      </Field>
      <Field label="Tone (optional)">
        <Input value={value.tone} onChangeText={(text) => set('tone', text)} placeholder="Warm and polite" />
      </Field>

      <SelectorModal
        visible={picker?.kind === 'currency'}
        title="Currency"
        options={CURRENCIES}
        selected={value.currency}
        onSelect={(next) => {
          set('currency', next);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
      <SelectorModal
        visible={picker?.kind === 'time'}
        title={day && picker?.kind === 'time' ? `${WEEKDAY_NAMES[day.day]} ${picker.field === 'open' ? 'opens' : 'closes'}` : ''}
        options={TIME_OPTIONS}
        selected={day && picker?.kind === 'time' ? day[picker.field] : ''}
        onSelect={(next) => {
          if (picker?.kind === 'time') setDay(picker.index, { [picker.field]: next });
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}
